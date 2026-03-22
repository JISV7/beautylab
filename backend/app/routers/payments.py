"""Payments router for split payment processing."""

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentListResponse,
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentResponse,
    PaymentWithDetails,
    SplitPaymentRequest,
    SplitPaymentResponse,
)
from app.services.payment_service import (
    PaymentAmountMismatchError,
    PaymentMethodNotFoundError,
    PaymentService,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/methods", response_model=list[PaymentMethodResponse])
async def list_payment_methods(
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> list[PaymentMethodResponse]:
    """Get current user's saved payment methods."""
    payment_service = PaymentService(db)

    methods = await payment_service.get_user_payment_methods(user_id=current_user.id)

    return [PaymentMethodResponse.model_validate(m) for m in methods]


@router.post("/methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def add_payment_method(
    method_data: PaymentMethodCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> PaymentMethodResponse:
    """
    Save a new payment method.

    **Body:**
    ```json
    {
        "method_type": "credit_card",
        "is_default": true
    }
    ```

    Note: This only creates the payment method record.
    Card details are submitted with each payment for security.
    """
    payment_service = PaymentService(db)

    try:
        method = await payment_service.create_payment_method(
            user_id=current_user.id,
            method_type=method_data.method_type,
            is_default=method_data.is_default,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return PaymentMethodResponse.model_validate(method)


@router.post("/split", response_model=SplitPaymentResponse)
async def process_split_payment(
    request: SplitPaymentRequest,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> SplitPaymentResponse:
    """
    Process split payment for an invoice.

    Allows paying for an invoice using multiple payment methods.
    Example: $20 credit card + $10 debit card + $70 cash deposit = $100 total

    **Body:**
    ```json
    {
        "invoice_id": "uuid",
        "payments": [
            {
                "method_type": "credit_card",
                "amount": 20.00,
                "details": {
                    "card_holder_name": "John Doe",
                    "card_number": "4111111111111111",
                    "expiry_month": 12,
                    "expiry_year": 2027,
                    "cvv": "123",
                    "card_brand": "visa"
                }
            },
            {
                "method_type": "debit_card",
                "amount": 10.00,
                "details": {
                    "card_holder_name": "John Doe",
                    "card_number": "5555555555554444",
                    "expiry_month": 6,
                    "expiry_year": 2026,
                    "cvv": "456",
                    "bank_name": "Banco de Venezuela"
                }
            },
            {
                "method_type": "cash_deposit",
                "amount": 70.00,
                "details": {
                    "deposit_reference": "REF123456",
                    "deposit_bank": "Banesco",
                    "deposit_date": "2026-03-21"
                }
            }
        ]
    }
    ```

    **Validation:**
    - Sum of all payments MUST equal invoice total
    - At least one payment required
    - Card numbers and CVV are hashed for security
    """
    payment_service = PaymentService(db)

    try:
        payments = await payment_service.process_split_payment(request=request)
    except PaymentMethodNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except PaymentAmountMismatchError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    # Calculate totals
    total_paid = sum(p.amount for p in payments)

    # Get invoice to calculate remaining
    from app.services.invoice_service import InvoiceService

    invoice_service = InvoiceService(db)
    invoice = await invoice_service.get_invoice_by_id(request.invoice_id)

    remaining_balance = invoice.total - total_paid if invoice else Decimal("0.00")

    return SplitPaymentResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total_paid=total_paid,
        remaining_balance=remaining_balance,
        is_fully_paid=remaining_balance <= 0,
    )


@router.get("/{payment_id}", response_model=PaymentWithDetails)
async def get_payment(
    payment_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> PaymentWithDetails:
    """Get payment details by ID."""
    payment_service = PaymentService(db)

    payment = await payment_service.get_payment_by_id(payment_id)

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment {payment_id} not found",
        )

    # TODO: Check authorization - user should own the invoice

    return PaymentWithDetails.model_validate(payment)


@router.get("/invoice/{invoice_id}", response_model=PaymentListResponse)
async def get_invoice_payments(
    invoice_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> PaymentListResponse:
    """Get all payments for an invoice."""
    payment_service = PaymentService(db)

    payments = await payment_service.get_invoice_payments(invoice_id=invoice_id)

    return PaymentListResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total=len(payments),
    )


@router.get("/invoice/{invoice_id}/summary")
async def get_payment_summary(
    invoice_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get payment summary for an invoice.

    Returns:
    - Invoice total
    - Total paid
    - Remaining balance
    - Payment status
    """
    payment_service = PaymentService(db)

    summary = await payment_service.get_payment_statistics(invoice_id=invoice_id)

    return summary
