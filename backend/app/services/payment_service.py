"""Payment service for split payment processing."""

import hashlib
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invoice import Invoice
from app.models.payment import Payment, PaymentDetail, PaymentMethod
from app.schemas.payment import (
    BankTransferDetails,
    CashDepositDetails,
    CreditCardDetails,
    DebitCardDetails,
    SplitPaymentItem,
    SplitPaymentRequest,
)


class PaymentNotFoundError(ValueError):
    """Raised when a payment is not found."""

    pass


class PaymentAmountMismatchError(ValueError):
    """Raised when payment amounts don't match invoice total."""

    pass


class PaymentMethodNotFoundError(ValueError):
    """Raised when a payment method is not found."""

    pass


class PaymentService:
    """Service for payment processing operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Payment Method Operations ====================

    async def get_payment_method_by_id(self, method_id: UUID) -> PaymentMethod | None:
        """Get payment method by ID."""
        result = await self.db.execute(select(PaymentMethod).where(PaymentMethod.id == method_id))
        return result.scalar_one_or_none()

    async def get_user_payment_methods(
        self,
        user_id: UUID,
    ) -> list[PaymentMethod]:
        """Get all payment methods for a user."""
        result = await self.db.execute(
            select(PaymentMethod)
            .where(PaymentMethod.user_id == user_id)
            .order_by(PaymentMethod.is_default.desc(), PaymentMethod.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_payment_method(
        self,
        user_id: UUID,
        method_type: str,
        is_default: bool = False,
    ) -> PaymentMethod:
        """Create a new payment method."""
        # If this is set as default, unset other defaults
        if is_default:
            await self._unset_default_methods(user_id)

        payment_method = PaymentMethod(
            user_id=user_id,
            method_type=method_type,
            is_default=is_default,
        )
        self.db.add(payment_method)
        await self.db.commit()
        await self.db.refresh(payment_method)
        return payment_method

    async def _unset_default_methods(self, user_id: UUID) -> None:
        """Unset all default payment methods for a user."""
        result = await self.db.execute(
            select(PaymentMethod).where(PaymentMethod.user_id == user_id)
        )
        methods = result.scalars().all()
        for method in methods:
            method.is_default = False
        await self.db.commit()

    # ==================== Payment Processing ====================

    async def get_payment_by_id(self, payment_id: UUID) -> Payment | None:
        """Get payment by ID."""
        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()

    async def get_invoice_payments(self, invoice_id: UUID) -> list[Payment]:
        """Get all payments for an invoice."""
        result = await self.db.execute(select(Payment).where(Payment.invoice_id == invoice_id))
        return list(result.scalars().all())

    async def process_split_payment(
        self,
        request: SplitPaymentRequest,
    ) -> list[Payment]:
        """
        Process multiple payments for a single invoice (split payment).

        Args:
            request: Split payment request with multiple payment items

        Returns:
            List of created payments

        Raises:
            PaymentAmountMismatchError: If sum of payments doesn't match invoice total
            PaymentMethodNotFoundError: If invoice not found
        """
        # Verify invoice exists and get total
        invoice = await self._get_invoice_by_id(request.invoice_id)
        if not invoice:
            raise PaymentMethodNotFoundError(f"Invoice {request.invoice_id} not found")

        # Calculate total payment amount
        total_payment = sum(item.amount for item in request.payments)

        # Validate total matches invoice
        if total_payment != invoice.total:
            raise PaymentAmountMismatchError(
                f"Payment total ({total_payment}) does not match invoice total ({invoice.total})"
            )

        payments = []

        for item in request.payments:
            # Create payment method for this transaction
            payment_method = await self.create_payment_method(
                user_id=invoice.client_id,
                method_type=item.method_type,
                is_default=False,
            )

            # Create payment
            payment = Payment(
                invoice_id=request.invoice_id,
                payment_method_id=payment_method.id,
                amount=item.amount,
                status="completed",  # Simulated immediate completion
            )
            self.db.add(payment)
            await self.db.flush()  # Get payment ID

            # Create payment details
            await self._create_payment_details(payment.id, item)

            payments.append(payment)

        await self.db.commit()

        # Refresh payments
        for pmt in payments:
            await self.db.refresh(pmt)

        return payments

    async def process_single_payment(
        self,
        invoice_id: UUID,
        payment_item: SplitPaymentItem,
        user_id: UUID,
    ) -> Payment:
        """Process a single payment for an invoice."""
        # Create payment method
        payment_method = await self.create_payment_method(
            user_id=user_id,
            method_type=payment_item.method_type,
            is_default=False,
        )

        # Create payment
        payment = Payment(
            invoice_id=invoice_id,
            payment_method_id=payment_method.id,
            amount=payment_item.amount,
            status="completed",
        )
        self.db.add(payment)
        await self.db.flush()

        # Create payment details
        await self._create_payment_details(payment.id, payment_item)

        await self.db.commit()
        await self.db.refresh(payment)

        return payment

    async def _create_payment_details(
        self,
        payment_id: UUID,
        payment_item: SplitPaymentItem,
    ) -> PaymentDetail:
        """Create payment details based on payment type."""
        details = PaymentDetail(payment_id=payment_id)

        if isinstance(payment_item.details, CreditCardDetails):
            card = payment_item.details
            details.card_holder_name = card.card_holder_name
            details.card_number_last4 = card.card_number[-4:]
            details.card_number_hash = self._hash_sensitive_data(card.card_number)
            details.card_expiry_month = card.expiry_month
            details.card_expiry_year = card.expiry_year
            details.card_cvv_hash = self._hash_sensitive_data(card.cvv)
            details.card_brand = card.card_brand

        elif isinstance(payment_item.details, DebitCardDetails):
            card = payment_item.details
            details.card_holder_name = card.card_holder_name
            details.card_number_last4 = card.card_number[-4:]
            details.card_number_hash = self._hash_sensitive_data(card.card_number)
            details.card_expiry_month = card.expiry_month
            details.card_expiry_year = card.expiry_year
            details.card_cvv_hash = self._hash_sensitive_data(card.cvv)
            details.card_brand = "debit"
            details.bank_name = card.bank_name

        elif isinstance(payment_item.details, CashDepositDetails):
            deposit = payment_item.details
            details.deposit_reference = deposit.deposit_reference
            details.deposit_bank = deposit.deposit_bank
            details.deposit_date = deposit.deposit_date

        elif isinstance(payment_item.details, BankTransferDetails):
            transfer = payment_item.details
            details.deposit_reference = transfer.transfer_reference
            details.deposit_bank = transfer.bank_name
            details.deposit_date = transfer.transfer_date

        self.db.add(details)
        await self.db.flush()

        return details

    def _hash_sensitive_data(self, data: str) -> str:
        """Hash sensitive data like card numbers and CVV."""
        return hashlib.sha256(data.encode()).hexdigest()

    async def _get_invoice_by_id(self, invoice_id: UUID) -> Invoice | None:
        """Get invoice by ID."""
        result = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        return result.scalar_one_or_none()

    async def get_payment_statistics(
        self,
        invoice_id: UUID,
    ) -> dict:
        """Get payment statistics for an invoice."""
        payments = await self.get_invoice_payments(invoice_id)

        total_paid = sum(p.amount for p in payments)
        completed_payments = sum(1 for p in payments if p.status == "completed")
        pending_payments = sum(1 for p in payments if p.status == "pending")

        # Get invoice total
        invoice = await self._get_invoice_by_id(invoice_id)
        invoice_total = invoice.total if invoice else Decimal("0.00")

        remaining_balance = invoice_total - total_paid

        return {
            "invoice_total": invoice_total,
            "total_paid": total_paid,
            "remaining_balance": remaining_balance,
            "is_fully_paid": remaining_balance <= 0,
            "completed_payments": completed_payments,
            "pending_payments": pending_payments,
            "total_payments": len(payments),
        }

    async def get_payment_method_statistics(self) -> dict:
        """
        Get payment method usage statistics.

        Returns percentage breakdown of payment methods used.
        Example: 50% bank_transfer, 40% credit_card, 10% debit_card
        """
        result = await self.db.execute(
            select(
                PaymentMethod.method_type,
                func.count(Payment.id).label("count"),
            )
            .join(Payment, Payment.payment_method_id == PaymentMethod.id)
            .group_by(PaymentMethod.method_type)
        )
        rows = result.all()

        total = sum(row[1] for row in rows)
        if total == 0:
            return {
                "total_payments": 0,
                "methods": [],
            }

        methods = []
        for method_type, count in rows:
            percentage = (count / total) * 100
            methods.append(
                {
                    "method_type": method_type,
                    "count": count,
                    "percentage": round(percentage, 1),
                }
            )

        # Sort by percentage descending
        methods.sort(key=lambda x: x["percentage"], reverse=True)

        return {
            "total_payments": total,
            "methods": methods,
        }
