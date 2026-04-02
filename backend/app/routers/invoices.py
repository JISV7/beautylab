"""Invoices router for billing management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceListResponse,
    InvoiceResponse,
    InvoiceUpdate,
    InvoiceWithDetails,
)
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("/summary")
async def get_invoice_summary(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get invoice summary statistics for the current user."""
    invoice_service = InvoiceService(db)
    return await invoice_service.get_user_invoice_summary(current_user.id)


@router.get("/", response_model=InvoiceListResponse)
async def list_invoices(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
) -> InvoiceListResponse:
    """Get current user's invoices."""
    invoice_service = InvoiceService(db)

    invoices, total = await invoice_service.get_user_invoices(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size

    # Build invoice responses with calculated status and payment progress

    from app.services.invoice_service import calculate_invoice_status

    invoices_data = []
    for inv in invoices:
        # Calculate total paid and status
        total_paid = sum(p.amount for p in inv.payments)
        calculated_status = calculate_invoice_status(inv, inv.payments)
        remaining = inv.total - total_paid
        progress = float((total_paid / inv.total) * 100) if inv.total > 0 else 0.0

        invoices_data.append(
            InvoiceResponse(
                id=inv.id,
                invoice_number=inv.invoice_number,
                control_number=inv.control_number,
                issue_date=inv.issue_date,
                issue_time=inv.issue_time,
                client_id=inv.client_id,
                client_rif=inv.client_rif,
                client_business_name=inv.client_business_name,
                client_document_type=inv.client_document_type,
                client_document_number=inv.client_document_number,
                client_fiscal_address=inv.client_fiscal_address,
                company_info_id=inv.company_info_id,
                subtotal=inv.subtotal,
                discount_total=inv.discount_total,
                tax_total=inv.tax_total,
                total=inv.total,
                status=calculated_status,
                notes=inv.notes,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                total_paid=total_paid,
                remaining_balance=remaining,
                payment_progress=round(progress, 2),
            )
        )

    return InvoiceListResponse(
        invoices=invoices_data,
        total=total,
        page=page,
        page_size=10,
        total_pages=total_pages,
    )


@router.get("/{invoice_id}", response_model=InvoiceWithDetails)
async def get_invoice(
    invoice_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> InvoiceWithDetails:
    """Get a specific invoice by ID."""
    invoice_service = InvoiceService(db)

    invoice = await invoice_service.get_invoice_with_details(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found",
        )

    # Check ownership
    if invoice.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this invoice",
        )

    # Manually construct payment responses with card details
    from app.schemas.payment import PaymentResponse

    payments_data = []
    for payment in invoice.payments:
        payment_dict = {
            "id": payment.id,
            "invoice_id": payment.invoice_id,
            "method_type": payment.method_type,
            "amount": payment.amount,
            "status": payment.status,
            "transaction_reference": payment.transaction_reference,
            "created_at": payment.created_at,
        }
        # Add card details if available
        if payment.details:
            payment_dict["card_last4"] = payment.details.card_number_last4
            payment_dict["card_brand"] = payment.details.card_brand
            payment_dict["card_holder_name"] = payment.details.card_holder_name
        payments_data.append(PaymentResponse(**payment_dict))

    # Build response manually
    return InvoiceWithDetails(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        control_number=invoice.control_number,
        issue_date=invoice.issue_date,
        issue_time=invoice.issue_time,
        client_id=invoice.client_id,
        client_rif=invoice.client_rif,
        client_business_name=invoice.client_business_name,
        client_document_type=invoice.client_document_type,
        client_document_number=invoice.client_document_number,
        client_fiscal_address=invoice.client_fiscal_address,
        company_info_id=invoice.company_info_id,
        subtotal=invoice.subtotal,
        discount_total=invoice.discount_total,
        tax_total=invoice.tax_total,
        total=invoice.total,
        status=invoice.status,
        notes=invoice.notes,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
        lines=invoice.lines,
        adjustments=invoice.adjustments,
        payments=payments_data,
        company=invoice.company,
        control_number_range=invoice.control_number_range,
    )


@router.get("/number/{invoice_number}", response_model=InvoiceWithDetails)
async def get_invoice_by_number(
    invoice_number: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> InvoiceWithDetails:
    """Get invoice by invoice number."""
    invoice_service = InvoiceService(db)

    invoice = await invoice_service.get_invoice_by_number(invoice_number)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_number} not found",
        )

    # Check ownership
    if invoice.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this invoice",
        )

    # Manually construct payment responses with card details
    from app.schemas.payment import PaymentResponse

    payments_data = []
    for payment in invoice.payments:
        payment_dict = {
            "id": payment.id,
            "invoice_id": payment.invoice_id,
            "method_type": payment.method_type,
            "amount": payment.amount,
            "status": payment.status,
            "transaction_reference": payment.transaction_reference,
            "created_at": payment.created_at,
        }
        # Add card details if available
        if payment.details:
            payment_dict["card_last4"] = payment.details.card_number_last4
            payment_dict["card_brand"] = payment.details.card_brand
            payment_dict["card_holder_name"] = payment.details.card_holder_name
        payments_data.append(PaymentResponse(**payment_dict))

    # Build response manually
    return InvoiceWithDetails(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        control_number=invoice.control_number,
        issue_date=invoice.issue_date,
        issue_time=invoice.issue_time,
        client_id=invoice.client_id,
        client_rif=invoice.client_rif,
        client_business_name=invoice.client_business_name,
        client_document_type=invoice.client_document_type,
        client_document_number=invoice.client_document_number,
        client_fiscal_address=invoice.client_fiscal_address,
        company_info_id=invoice.company_info_id,
        subtotal=invoice.subtotal,
        discount_total=invoice.discount_total,
        tax_total=invoice.tax_total,
        total=invoice.total,
        status=invoice.status,
        notes=invoice.notes,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
        lines=invoice.lines,
        adjustments=invoice.adjustments,
        payments=payments_data,
        company=invoice.company,
        control_number_range=invoice.control_number_range,
    )


@router.post("/", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> InvoiceResponse:
    """
    Create a new invoice.

    **Body:**
    ```json
    {
        "client_id": "uuid",
        "client_rif": "J-12345678-9",
        "client_business_name": "Company Name",
        "lines": [
            {
                "product_id": "uuid",
                "description": "Product description",
                "quantity": 2,
                "unit_price": 100.00,
                "tax_rate": 16.00,
                "is_exempt": false
            }
        ],
        "adjustments": [],
        "notes": "Optional notes"
    }
    ```

    Note: Typically created automatically during checkout.
    This endpoint is for manual invoice creation (admin).
    """
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.create_invoice(invoice_data=invoice_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return InvoiceResponse.model_validate(invoice)


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> InvoiceResponse:
    """Update invoice (admin only - e.g., change status, add notes)."""
    invoice_service = InvoiceService(db)

    invoice = await invoice_service.get_invoice_by_id(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found",
        )

    # Update fields
    if invoice_data.notes is not None:
        invoice.notes = invoice_data.notes
    if invoice_data.status is not None:
        invoice.status = invoice_data.status

    await db.commit()
    await db.refresh(invoice)

    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}/download")
async def download_invoice(
    invoice_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get invoice data for PDF generation.

    Returns invoice data formatted for PDF generation.
    Frontend can use this to generate downloadable PDF.
    """
    invoice_service = InvoiceService(db)

    invoice = await invoice_service.get_invoice_by_id(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice {invoice_id} not found",
        )

    # Check ownership
    if invoice.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this invoice",
        )

    # Format for PDF generation
    return {
        "invoice": InvoiceWithDetails.model_validate(invoice),
        "pdf_url": f"/invoices/{invoice_id}/pdf",  # Would be actual PDF endpoint
    }
