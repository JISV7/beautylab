"""Payments router for split payment processing."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.coupon import CouponUsage
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
from app.services.invoice_service import InvoiceService
from app.services.license_service import LicenseService
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
    - Sum of all payments MUST equal the effective invoice total (after discounts)
    - Partial payments are NOT accepted — full payment required
    - Card numbers and CVV are hashed for security
    """
    payment_service = PaymentService(db)
    invoice_service = InvoiceService(db)
    invoice = await invoice_service.get_invoice_by_id(request.invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {request.invoice_id} not found",
        )

    # The invoice total already includes discounts (calculated at invoice
    # creation time), so we use it directly as the effective total.
    effective_total = invoice.total
    total_paid = sum(p.amount for p in request.payments)

    # Full payment required — reject if amounts don't match
    if total_paid != effective_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Payment amount ({total_paid}) does not match the effective "
                f"invoice total ({effective_total}). "
                f"Full payment is required."
            ),
        )

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

    # Full payment confirmed — issue invoice, create licenses, consume coupons
    invoice.status = "issued"

    # Create licenses from invoice lines
    from app.models.invoice import InvoiceLine
    from app.schemas.license import LicensePurchaseItem, LicensePurchaseRequest

    license_service = LicenseService(db)
    line_result = await db.execute(select(InvoiceLine).where(InvoiceLine.invoice_id == invoice.id))
    invoice_lines = line_result.scalars().all()
    for il in invoice_lines:
        item_license_request = LicensePurchaseRequest(
            items=[
                LicensePurchaseItem(
                    product_id=il.product_id,
                    quantity=int(il.quantity),
                    license_type="gift",
                )
            ]
        )
        await license_service.purchase_licenses(
            request=item_license_request,
            purchased_by_user_id=current_user.id,
            invoice_line_id=il.id,
        )

    # DO NOT auto-activate licenses — they stay "pending" until the user
    # manually redeems them (for personal use) or gifts them to someone else

    # Apply coupons — mark usage and increment counter
    from app.models.invoice import InvoiceAdjustment
    from app.services.coupon_service import CouponService

    coupon_service = CouponService(db)
    adj_result = await db.execute(
        select(InvoiceAdjustment).where(InvoiceAdjustment.invoice_id == request.invoice_id)
    )
    adjustments = adj_result.scalars().all()
    for adj in adjustments:
        if adj.description and adj.description.startswith("Coupon: "):
            code = adj.description.replace("Coupon: ", "").strip()
            coupon = await coupon_service.get_coupon_by_code(code)
            if coupon:
                usage_check = await db.execute(
                    select(CouponUsage).where(
                        CouponUsage.coupon_id == coupon.id,
                        CouponUsage.user_id == current_user.id,
                        CouponUsage.invoice_id == request.invoice_id,
                    )
                )
                if not usage_check.scalar_one_or_none():
                    coupon.used_count += 1
                    usage = CouponUsage(
                        coupon_id=coupon.id,
                        user_id=current_user.id,
                        invoice_id=request.invoice_id,
                    )
                    db.add(usage)

    # Send confirmation email
    email_sent = True
    email_error = None
    try:
        import logging

        from app.services.email_service import get_email_service

        logger = logging.getLogger("beautylab.email")
        email_service = get_email_service()
        receipt_data = await invoice_service.get_invoice_receipt_data(request.invoice_id)

        if receipt_data:
            user_email = current_user.email

            # Build line items with tax_rate and is_exempt
            invoice_items = [
                {
                    "description": line.description,
                    "quantity": int(line.quantity),
                    "unit_price": str(line.unit_price),
                    "line_total": str(line.line_total),
                    "tax_rate": line.tax_rate
                    if hasattr(line, "tax_rate") and line.tax_rate
                    else None,
                    "is_exempt": line.is_exempt if hasattr(line, "is_exempt") else False,
                }
                for line in invoice.lines
            ]

            # Build company info
            company_info = None
            if invoice.company_info_id:
                from app.models.company_info import CompanyInfo

                co_result = await db.execute(
                    select(CompanyInfo).where(CompanyInfo.id == invoice.company_info_id)
                )
                co = co_result.scalar_one_or_none()
                if co:
                    company_info = {
                        "business_name": co.business_name,
                        "rif": co.rif,
                        "fiscal_address": co.fiscal_address,
                        "phone": co.phone,
                    }

            # Build payments info
            payments_info = []
            for p in payments:
                payment_info = {
                    "method_type": p.method_type,
                    "amount": str(p.amount),
                    "status": p.status,
                }
                if hasattr(p, "details") and p.details:
                    if hasattr(p.details, "card_brand"):
                        payment_info["card_brand"] = p.details.card_brand
                    if hasattr(p.details, "card_number_last4"):
                        payment_info["card_last4"] = p.details.card_number_last4
                payments_info.append(payment_info)

            # Build adjustments info
            adjustments_info = []
            from app.models.invoice import InvoiceAdjustment

            adj_result = await db.execute(
                select(InvoiceAdjustment).where(InvoiceAdjustment.invoice_id == invoice.id)
            )
            for adj in adj_result.scalars().all():
                adjustments_info.append(
                    {
                        "description": adj.description,
                        "amount": str(adj.amount),
                        "adjustment_type": "discount" if adj.amount < 0 else "other",
                    }
                )

            # Build control range info
            control_range_info = None
            from app.models import ControlNumberRange

            cnr_result = await db.execute(
                select(ControlNumberRange).where(
                    ControlNumberRange.id == invoice.control_number_range_id
                )
            )
            cnr = cnr_result.scalar_one_or_none()
            if cnr:
                control_range_info = {
                    "start_number": cnr.start_number,
                    "end_number": cnr.end_number,
                    "assigned_date": cnr.assigned_date.isoformat() if cnr.assigned_date else "",
                }

            # Determine client name and doc
            client_name_val = invoice.client_business_name
            if (
                not client_name_val
                and invoice.client_document_type
                and invoice.client_document_number
            ):
                client_name_val = f"{invoice.client_document_type}-{invoice.client_document_number}"
            elif not client_name_val:
                client_name_val = None

            client_doc_val = None
            if invoice.client_document_type and invoice.client_document_number:
                client_doc_val = f"{invoice.client_document_type}-{invoice.client_document_number}"
            elif invoice.client_rif:
                client_doc_val = invoice.client_rif

            success = email_service.send_invoice_email(
                to_email=user_email,
                invoice_number=invoice.invoice_number,
                total=str(invoice.total),
                issue_date=invoice.issue_date.isoformat(),
                items=invoice_items,
                download_url=f"https://beautylab.com/invoices/{invoice.id}/download",
                control_number=invoice.control_number,
                issue_time=invoice.issue_time.isoformat() if invoice.issue_time else None,
                status=invoice.status,
                company=company_info,
                client_name=client_name_val,
                client_doc=client_doc_val,
                client_address=invoice.client_fiscal_address,
                subtotal=str(invoice.subtotal),
                tax_total=str(invoice.tax_total),
                discount_total=str(invoice.discount_total) if invoice.discount_total else None,
                adjustments=adjustments_info if adjustments_info else None,
                payments=payments_info if payments_info else None,
                control_range=control_range_info,
            )
            if not success:
                email_sent = False
                email_error = (
                    "Email service returned false — invoice email may not have been delivered."
                )
                logger.error(
                    "Failed to send invoice email for invoice %s to %s",
                    invoice.invoice_number,
                    user_email,
                )
            else:
                logger.info(
                    "Invoice email sent successfully for invoice %s to %s",
                    invoice.invoice_number,
                    user_email,
                )
    except Exception as e:
        import logging
        import traceback

        logger = logging.getLogger("beautylab.email")
        email_sent = False
        email_error = f"Exception while sending invoice email: {e}"
        logger.error(
            "Exception sending invoice email for invoice %s: %s\n%s",
            request.invoice_id,
            e,
            traceback.format_exc(),
        )

    await db.commit()

    response_data = {
        "payments": [PaymentResponse.model_validate(p) for p in payments],
        "total_paid": total_paid,
        "remaining_balance": Decimal("0.00"),
        "is_fully_paid": True,
    }

    # Include email status so frontend can warn the user if needed
    if not email_sent:
        response_data["email_warning"] = email_error

    return SplitPaymentResponse(**response_data)


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
            user_rif=current_user.rif,
            user_business_name=current_user.business_name or current_user.full_name,
            user_document_type=current_user.document_type,
            user_document_number=current_user.document_number,
            user_fiscal_address=current_user.fiscal_address,
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
