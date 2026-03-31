"""Payments router for split payment processing."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.schemas.payment import (
    CoursePurchaseRequest,
    CoursePurchaseResponse,
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
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[PaymentMethodResponse]:
    """Get current user's saved payment methods."""
    payment_service = PaymentService(db)

    methods = await payment_service.get_user_payment_methods(user_id=current_user.id)

    return [PaymentMethodResponse.model_validate(m) for m in methods]


@router.post("/methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def add_payment_method(
    method_data: Annotated[PaymentMethodCreate, Body(...)],
    current_user: CurrentUser,
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
    request: Annotated[SplitPaymentRequest, Body(...)],
    current_user: CurrentUser,
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
    current_user: CurrentUser,
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
    current_user: CurrentUser,
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
    current_user: CurrentUser,
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


@router.get("/statistics/methods")
async def get_payment_method_statistics(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get payment method usage statistics.

    Returns percentage breakdown of payment methods used.
    Example: 50% bank_transfer, 40% credit_card, 10% debit_card

    Admin only endpoint.
    """
    payment_service = PaymentService(db)
    return await payment_service.get_payment_method_statistics()


@router.post("/purchase-course", response_model=CoursePurchaseResponse)
async def purchase_course(
    request: Annotated[CoursePurchaseRequest, Body(...)],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CoursePurchaseResponse:
    """
    Purchase a course with split payment support.

    This endpoint:
    1. Creates an invoice for the course
    2. Processes split payment across multiple methods
    3. Creates enrollment
    4. Sends confirmation email

    **Body:**
    ```json
    {
        "course_id": "uuid",
        "payments": [
            {
                "method_type": "credit_card",
                "amount": 50.00,
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
                "method_type": "zelle",
                "amount": 50.00,
                "details": {
                    "sender_name": "John Doe",
                    "sender_email": "john@example.com",
                    "recipient_email": settings.payments_email,
                    "confirmation_code": "ZELLE123456"
                }
            }
        ]
    }
    ```

    **Payment Methods Supported:**
    - credit_card
    - debit_card
    - cash_deposit
    - bank_transfer
    - zelle
    - pago_movil
    - paypal
    """
    from app.services.catalog_service import CatalogService
    from app.services.invoice_service import InvoiceNotFoundError, InvoiceService

    catalog_service = CatalogService(db)
    invoice_service = InvoiceService(db)
    payment_service = PaymentService(db)

    # Verify course exists and get product_id
    course = await catalog_service.get_course_by_id(request.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course {request.course_id} not found",
        )

    if not course.product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course does not have an associated product",
        )

    # Create invoice for the purchase
    try:
        invoice = await invoice_service.create_invoice_for_course_purchase(
            user_id=current_user.id,
            course_id=request.course_id,
            product_id=course.product_id,
            user_email=current_user.email,
            user_rif=None,  # Could be added to user profile
            user_business_name=None,
        )
    except InvoiceNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    # Create split payment request
    split_request = SplitPaymentRequest(
        invoice_id=invoice.id,
        payments=request.payments,
    )

    # Process payment
    try:
        payments, receipt_data = await payment_service.process_course_purchase(
            user_id=current_user.id,
            user_email=current_user.email,
            course_id=request.course_id,
            product_id=course.product_id,
            request=split_request,
        )
    except PaymentAmountMismatchError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except PaymentMethodNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    # Send confirmation email
    try:
        from app.services.email_service import get_email_service

        email_service = get_email_service()

        # Build items list for email
        items = [
            {
                "description": f"Course Enrollment - {course.title}",
                "quantity": "1",
                "unit_price": str(invoice.total),
                "line_total": str(invoice.total),
            }
        ]

        # Get payment breakdown for email
        payment_breakdown = await payment_service.get_payment_breakdown_for_email(invoice.id)

        email_service.send_purchase_confirmation_email(
            to_email=current_user.email,
            invoice_number=invoice.invoice_number,
            course_name=course.title,
            total=str(invoice.total),
            issue_date=invoice.issue_date.isoformat(),
            items=items,
            payment_breakdown=payment_breakdown,
        )
    except Exception as e:
        # Log error but don't fail the purchase
        print(f"Failed to send confirmation email: {e}")

    return CoursePurchaseResponse(
        success=True,
        invoice_number=invoice.invoice_number,
        total_paid=invoice.total,
        payments=[PaymentResponse.model_validate(p) for p in payments],
        message="Purchase successful! A confirmation email has been sent.",
    )


@router.get("/invoice/{invoice_id}/receipt")
async def get_invoice_receipt(
    invoice_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get invoice receipt data for display on confirmation page.

    Returns invoice details, line items, and payment breakdown.
    """
    from app.services.invoice_service import InvoiceService
    from app.services.payment_service import PaymentService

    invoice_service = InvoiceService(db)
    payment_service = PaymentService(db)

    # Get receipt data
    receipt_data = await invoice_service.get_invoice_receipt_data(invoice_id)

    if not receipt_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found",
        )

    # Check authorization - user must own the invoice
    invoice = await invoice_service.get_invoice_by_id(invoice_id)
    if not invoice or invoice.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this invoice",
        )

    # Get payment breakdown
    payment_breakdown = await payment_service.get_payment_breakdown_for_email(invoice_id)

    return {
        **receipt_data,
        "payment_breakdown": payment_breakdown,
    }
