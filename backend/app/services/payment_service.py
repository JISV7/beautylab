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
    CreditCardDetails,
    DebitCardDetails,
    PagoMovilDetails,
    PaypalDetails,
    SplitPaymentItem,
    SplitPaymentRequest,
    ZelleDetails,
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
        Supports partial payments - payments can be less than invoice total.

        Args:
            request: Split payment request with multiple payment items

        Returns:
            List of created payments

        Raises:
            PaymentMethodNotFoundError: If invoice not found
        """
        # Verify invoice exists and get total
        invoice = await self._get_invoice_by_id(request.invoice_id)
        if not invoice:
            raise PaymentMethodNotFoundError(f"Invoice {request.invoice_id} not found")

        # Calculate total payment amount
        total_payment = sum(item.amount for item in request.payments)

        # Allow partial payments (total can be less than or equal to invoice total)
        if total_payment > invoice.total:
            raise PaymentAmountMismatchError(
                f"Payment total ({total_payment}) exceeds invoice total ({invoice.total})"
            )

        # Log if this is a partial payment
        if total_payment < invoice.total:
            remaining = invoice.total - total_payment
            print(
                f"[INFO] Partial payment: {total_payment}/{invoice.total}, remaining: {remaining}"
            )

        payments = []

        for item in request.payments:
            # Create payment directly with method_type
            payment = Payment(
                invoice_id=request.invoice_id,
                method_type=item.method_type,
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
        # Create payment directly with method_type
        payment = Payment(
            invoice_id=invoice_id,
            method_type=payment_item.method_type,
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

        elif isinstance(payment_item.details, BankTransferDetails):
            transfer = payment_item.details
            details.deposit_reference = transfer.transfer_reference
            details.deposit_bank = transfer.bank_name
            details.deposit_date = transfer.transfer_date

        elif isinstance(payment_item.details, ZelleDetails):
            zelle = payment_item.details
            details.deposit_reference = zelle.confirmation_code
            details.deposit_bank = "Zelle"
            details.card_holder_name = zelle.sender_name

        elif isinstance(payment_item.details, PagoMovilDetails):
            pago = payment_item.details
            details.deposit_reference = pago.reference_code
            details.deposit_bank = pago.bank_name
            details.card_holder_name = pago.rif_cedula

        elif isinstance(payment_item.details, PaypalDetails):
            paypal = payment_item.details
            details.deposit_reference = paypal.transaction_id
            details.deposit_bank = "PayPal"
            details.card_holder_name = paypal.payer_name

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
                Payment.method_type,
                func.count(Payment.id).label("count"),
            ).group_by(Payment.method_type)
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

    async def get_payment_breakdown_for_email(
        self,
        invoice_id: UUID,
    ) -> list[dict]:
        """
        Get payment breakdown formatted for email template.

        Returns:
            List of payment info dicts with method and amount
        """
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(Payment)
            .where(Payment.invoice_id == invoice_id)
            .options(selectinload(Payment.details))
        )
        payments = list(result.scalars().all())
        breakdown = []

        for payment in payments:
            method_type = payment.method_type.replace("_", " ").title()
            reference = ""

            # Get reference from payment details
            if payment.details:
                if payment.details.deposit_reference:
                    reference = payment.details.deposit_reference
                elif payment.details.card_number_last4:
                    reference = f"****{payment.details.card_number_last4}"

            breakdown.append(
                {
                    "method": method_type,
                    "amount": str(payment.amount),
                    "reference": reference,
                }
            )

        return breakdown

    async def process_course_purchase(
        self,
        user_id: UUID,
        user_email: str,
        course_id: UUID,
        product_id: UUID,
        request: SplitPaymentRequest,
    ) -> tuple[list[Payment], dict]:
        """
        Process a complete course purchase with split payment.

        This method:
        1. Validates invoice total matches payments
        2. Creates payments
        3. Creates enrollment
        4. Returns payment breakdown for email

        Args:
            user_id: Purchasing user ID
            user_email: User's email for confirmation
            course_id: Course being purchased
            product_id: Product associated with course
            request: Split payment request

        Returns:
            Tuple of (payments list, receipt data dict)
        """
        from app.services.email_service import get_email_service
        from app.services.enrollment_service import EnrollmentService
        from app.services.invoice_service import InvoiceService

        # Process the split payment
        payments = await self.process_split_payment(request)

        # Get invoice and course info for email
        invoice_service = InvoiceService(self.db)
        receipt_data = await invoice_service.get_invoice_receipt_data(request.invoice_id)

        if receipt_data:
            # Get payment breakdown
            payment_breakdown = await self.get_payment_breakdown_for_email(request.invoice_id)

            # Get course name from invoice line
            course_name = "Course Enrollment"
            if receipt_data.get("items"):
                course_name = receipt_data["items"][0].get("description", course_name)

            # Send confirmation email
            email_service = get_email_service()
            email_service.send_purchase_confirmation_email(
                to_email=user_email,
                invoice_number=receipt_data["invoice_number"],
                course_name=course_name,
                total=receipt_data["total"],
                issue_date=receipt_data["issue_date"],
                items=receipt_data["items"],
                payment_breakdown=payment_breakdown,
                subtotal=receipt_data.get("subtotal"),
                tax_total=receipt_data.get("tax_total"),
            )

            # Create enrollment
            enrollment_service = EnrollmentService(self.db)
            try:
                await enrollment_service.create_enrollment(
                    user_id=user_id,
                    course_id=course_id,
                    invoice_id=request.invoice_id,
                    allow_duplicate=False,
                )
            except Exception:
                # Enrollment might already exist, continue anyway
                pass

            # Create license for the course
            from app.models.invoice import InvoiceLine
            from app.schemas.license import LicensePurchaseItem, LicensePurchaseRequest
            from app.services.license_service import LicenseService

            license_service = LicenseService(self.db)
            try:
                # Get the invoice line for this course
                line_result = await self.db.execute(
                    select(InvoiceLine)
                    .where(
                        InvoiceLine.invoice_id == request.invoice_id,
                        InvoiceLine.product_id == product_id,
                    )
                    .limit(1)
                )
                invoice_line = line_result.scalar_one_or_none()

                print(
                    f"[DEBUG] Creating license for product {product_id}, "
                    f"invoice_line: {invoice_line.id if invoice_line else None}"
                )

                license_request = LicensePurchaseRequest(
                    items=[
                        LicensePurchaseItem(
                            product_id=product_id,
                            quantity=1,
                            license_type="gift",
                        )
                    ]
                )
                licenses = await license_service.purchase_licenses(
                    request=license_request,
                    purchased_by_user_id=user_id,
                    invoice_line_id=invoice_line.id if invoice_line else None,
                )
                license_codes = [str(lic.license_code) for lic in licenses]
                print(f"[DEBUG] Created {len(licenses)} licenses: {license_codes}")

                # Check if invoice is fully paid and activate licenses if so
                invoice_result = await self.db.execute(
                    select(Invoice).where(Invoice.id == request.invoice_id)
                )
                invoice = invoice_result.scalar_one_or_none()

                if invoice:
                    # Calculate total paid
                    pay_result = await self.db.execute(
                        select(Payment).where(Payment.invoice_id == request.invoice_id)
                    )
                    payments_list = pay_result.scalars().all()
                    total_paid = sum(p.amount for p in payments_list)

                    print(
                        f"[DEBUG] Invoice {request.invoice_id}: "
                        f"total={invoice.total}, paid={total_paid}"
                    )

                    # Activate licenses if fully paid
                    if total_paid >= invoice.total:
                        activated = await license_service.activate_licenses_for_invoice(
                            request.invoice_id
                        )
                        print(f"[DEBUG] Activated {activated} licenses")
            except Exception as e:
                # Log error but don't fail the purchase
                print(f"[ERROR] License creation failed: {e}")
                import traceback

                traceback.print_exc()

        return payments, receipt_data
