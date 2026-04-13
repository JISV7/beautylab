"""Invoices router for billing management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
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
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/download-all")
async def download_all_invoices_as_pdfs(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Download all user invoices as a zip file containing individual PDFs.

    Each PDF is named with invoice_number and control_number for easy identification.
    Example: factura_A-00000001_000000000001.pdf
    """
    from datetime import datetime
    from io import BytesIO
    from pathlib import Path
    from zipfile import ZIP_DEFLATED, ZipFile

    from fastapi.responses import StreamingResponse
    from jinja2 import Environment, FileSystemLoader
    from weasyprint import HTML

    # Set up Jinja2 template environment
    _template_dir = Path(__file__).parent.parent / "templates"
    _env = Environment(loader=FileSystemLoader(_template_dir))

    # Custom filters for the template
    def _fmt_money(value: float) -> str:
        """Venezuelan format: 28.440,00"""
        return f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    _env.filters["money"] = _fmt_money
    _env.filters["invoice_status"] = lambda s: {
        "issued": "Emitida",
        "paid": "Pagada",
        "partial": "Pago Parcial",
        "cancelled": "Cancelada",
    }.get(s, s.capitalize())
    _env.filters["payment_status"] = lambda s: {
        "completed": "Completado",
    }.get(s, s.capitalize())
    _env.filters["payment_method"] = lambda s: (s or "Pago").replace("_", " ")
    _env.filters["tax_rate"] = lambda r: f"{float(r):,.2f}%" if r else "16%"
    _template = _env.get_template("invoice_pdf.html")

    invoice_service = InvoiceService(db)

    # Fetch ALL invoices for this user (no pagination — we need all of them)
    invoices, total = await invoice_service.get_user_invoices(
        user_id=current_user.id,
        page=1,
        page_size=10_000,  # Arbitrary large limit
    )

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No invoices found for this user",
        )

    # Fetch full details for each invoice (with lines, adjustments, payments, etc.)
    full_invoices = []
    for inv in invoices:
        full = await invoice_service.get_invoice_with_details(inv.id)
        if full:
            full_invoices.append(full)

    def _format_date_ddmmyyyy(d):
        return d.strftime("%d%m%Y")

    def _format_time_hhmmss_am_pm(t):
        hour = t.hour
        minute = t.minute
        second = t.second
        ampm = "p.m." if hour >= 12 else "a.m."
        hour_12 = hour % 12 or 12
        return f"{hour_12:02d}.{minute:02d}.{second:02d} {ampm}"

    def _generate_invoice_pdf(invoice) -> bytes:
        """Generate a single invoice PDF using the Jinja2 template."""
        c = invoice.company
        cnr = invoice.control_number_range
        cnr_printer = cnr.printer if cnr else None

        # Resolve client info (enrich from user if missing)
        _rif = invoice.client_rif
        _dtype = invoice.client_document_type
        _dnum = invoice.client_document_number
        _biz = invoice.client_business_name
        _addr = invoice.client_fiscal_address

        if (not _rif or not _addr) and invoice.client_id:
            from app.models.user import User

            u_result = db.execute(select(User).where(User.id == invoice.client_id))
            user = u_result.scalar_one_or_none()
            if user:
                _rif = _rif or user.rif
                _dtype = _dtype or user.document_type
                _dnum = _dnum or user.document_number
                _biz = _biz or user.business_name
                _addr = _addr or user.fiscal_address

        if _biz:
            client_name = _biz
        elif _dtype and _dnum:
            client_name = f"{_dtype}-{_dnum}"
        elif _rif:
            client_name = _rif
        else:
            client_name = "Cliente"

        client_doc = f"{_dtype}-{_dnum}" if _dtype and _dnum else _rif if _rif else "N/A"

        # Resolve printer info
        printer_name = cnr_printer.business_name if cnr_printer else "Imprenta"
        printer_rif = cnr_printer.rif if cnr_printer else "N/A"
        printer_providence = cnr_printer.authorization_providence if cnr_printer else "N/A"

        html = _template.render(
            # Basic invoice data
            invoice_number=invoice.invoice_number,
            control_number=invoice.control_number,
            status=invoice.status,
            issue_date_fmt=_format_date_ddmmyyyy(invoice.issue_date),
            issue_time_fmt=_format_time_hhmmss_am_pm(invoice.issue_time),
            # Company
            company=c,
            # Client
            client_name=client_name,
            client_doc=client_doc,
            client_fiscal_address=_addr,
            # Line items
            lines=invoice.lines or [],
            # Adjustments
            adjustments=invoice.adjustments or [],
            # Totals
            subtotal=float(invoice.subtotal),
            tax_total=float(invoice.tax_total),
            discount_total=float(invoice.discount_total),
            total=float(invoice.total),
            # Payments
            payments=invoice.payments or [],
            # Printer / control range
            control_number_range=cnr,
            printer_name=printer_name,
            printer_rif=printer_rif,
            printer_providence=printer_providence,
            cnr_start=cnr.start_number.zfill(12) if cnr else "",
            cnr_end=cnr.end_number.zfill(12) if cnr else "",
            cnr_assigned_date=cnr.assigned_date.strftime("%d/%m/%Y") if cnr else "",
        )
        return HTML(string=html).write_pdf()

    def _generate_zip_stream():
        """Generator that yields chunks of the zip file."""
        buffer = BytesIO()
        with ZipFile(buffer, "w", ZIP_DEFLATED) as zf:
            for invoice in full_invoices:
                # Generate PDF
                pdf_bytes = _generate_invoice_pdf(invoice)

                # Build filename: factura_{invoice_number}_{control_number}.pdf
                safe_invoice_num = invoice.invoice_number.replace("/", "-").replace("\\", "-")
                safe_control = invoice.control_number.replace("/", "-").replace("\\", "-")
                filename = f"factura_{safe_invoice_num}_{safe_control}.pdf"

                zf.writestr(filename, pdf_bytes)

        buffer.seek(0)
        while True:
            chunk = buffer.read(8192)
            if not chunk:
                break
            yield chunk

    # Generate a nice filename with date
    today = datetime.now().strftime("%Y%m%d")
    zip_filename = f"facturas_beautylab_{today}.zip"

    return StreamingResponse(
        _generate_zip_stream(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
        },
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
