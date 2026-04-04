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
    from zipfile import ZIP_DEFLATED, ZipFile

    from fastapi.responses import StreamingResponse
    from weasyprint import HTML

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
        """Generate a single invoice PDF using WeasyPrint."""
        c = invoice.company
        cnr = invoice.control_number_range
        cnr_printer = cnr.printer if cnr else None

        # Company info
        co_html = ""
        if c:
            phone = f"<p>  Tel: {c.phone}</p>" if c.phone else ""
            co_html = (
                '<div class="co">'
                f"<p><b>{c.business_name}</b></p>"
                f"<p>  RIF: {c.rif}</p>"
                f"<p>  {c.fiscal_address or ''}</p>"
                f"{phone}"
                "</div>"
            )

        # Control range
        range_html = ""
        if cnr:
            s = cnr.start_number.zfill(12)
            e = cnr.end_number.zfill(12)
            ad = _format_date_ddmmyyyy(cnr.assigned_date)
            range_html = (
                '<div class="box">'
                '<p class="sm">  Rango de Números de Control</p>'
                f"<p>  Desde N° {s} hasta N° {e}</p>"
                f'<p class="xs">  Fecha de asignación: {ad}</p>'
                "</div>"
            )

        # Line items
        lines_html = ""
        if invoice.lines:
            rows = ""
            for ln in invoice.lines:
                ex = " (E)" if ln.is_exempt else ""
                price = f"  Bs. {float(ln.unit_price):,.2f}"
                rate = f"  {float(ln.tax_rate):.2f}%"
                total = f"  Bs. {float(ln.line_total):,.2f}"
                rows += (
                    "<tr>"
                    f"<td>{ln.description}{ex}</td>"
                    f'<td class="c">{ln.quantity}</td>'
                    f'<td class="r">{price}</td>'
                    f'<td class="r m">{rate}</td>'
                    f'<td class="r b">{total}</td>'
                    "</tr>"
                )
            lines_html = (
                "<table><thead><tr>"
                '<th class="l">Descripción</th>'
                '<th class="c">Cant.</th>'
                '<th class="r">Precio Unit.</th>'
                '<th class="r">Alícuota</th>'
                '<th class="r">Total</th>'
                "</tr></thead>"
                f"<tbody>{rows}</tbody></table>"
            )

        # Adjustments
        adj_html = ""
        if invoice.adjustments:
            parts = []
            for a in invoice.adjustments:
                sign = "-" if a.adjustment_type == "discount" else ""
                amt = f"{sign}Bs. {float(a.amount):,.2f}"
                parts.append(f"<div><span>{a.description}</span><b>{amt}</b></div>")
            adj_html = f'<div class="mb"><h4 class="sm">Ajustes</h4>{"".join(parts)}</div>'

        # Totals
        sub = f"  Bs. {float(invoice.subtotal):,.2f}"
        tax = f"  Bs. {float(invoice.tax_total):,.2f}"
        disc = ""
        if float(invoice.discount_total) > 0:
            d = f"-Bs. {float(invoice.discount_total):,.2f}"
            disc = f'<div><span>Descuentos</span><b class="g">{d}</b></div>'
        tot = f"  Bs. {float(invoice.total):,.2f}"
        totals_html = (
            '<div class="tot">'
            f"<div><span>Base Imponible</span><b>{sub}</b></div>"
            f"<div><span>IVA (16%)</span><b>{tax}</b></div>"
            f"{disc}"
            f'<div class="gr"><span>Total</span><b>{tot}</b></div>'
            "</div>"
        )

        # Payments
        pay_html = ""
        if invoice.payments:
            parts = []
            for p in invoice.payments:
                mt = (p.method_type or "Pago").replace("_", " ").title()
                ci = ""
                if hasattr(p, "details") and p.details:
                    if p.details.card_brand:
                        last4 = p.details.card_number_last4 or ""
                        ci = f" — {p.details.card_brand} ****{last4}"
                bg = "#dcfce7" if p.status == "completed" else "#fef9c3"
                clr = "#15803d" if p.status == "completed" else "#a16207"
                amt = f"  Bs. {float(p.amount):,.2f}"
                parts.append(
                    '<div class="pay">'
                    f"<span><b>{mt}{ci}</b></span>"
                    f"<span><b>{amt}</b>"
                    f'<em style="background:{bg};color:{clr}">'
                    f"  {p.status}</em></span></div>"
                )
            pay_html = (
                f'<div class="mt"><h3 class="sm">Desglose de Pagos</h3>{"".join(parts)}</div>'
            )

        # Printer info
        prn_html = ""
        if cnr_printer:
            prn_html = (
                '<div class="fn">'
                "<p><b>Imprenta Digital Autorizada</b></p>"
                f"<p>{cnr_printer.business_name} | RIF: {cnr_printer.rif}</p>"
                f"<p>Providencia: {cnr_printer.authorization_providence}</p>"
                "</div>"
            )

        # Client info
        client_name = invoice.client_business_name or (
            f"{invoice.client_document_type}-{invoice.client_document_number}"
            if invoice.client_document_type and invoice.client_document_number
            else invoice.client_rif or "Cliente"
        )
        client_doc = ""
        if invoice.client_document_type and invoice.client_document_number:
            client_doc = f"{invoice.client_document_type}-{invoice.client_document_number}"
        elif invoice.client_rif:
            client_doc = invoice.client_rif

        fiscal_addr_html = ""
        if invoice.client_fiscal_address:
            fiscal_addr_html = (
                f'<p class="xs">  Domicilio Fiscal</p><p><b>{invoice.client_fiscal_address}</b></p>'
            )

        # Footer
        ft = ""
        if c:
            ft = f"<p>{c.business_name} | RIF: {c.rif}</p>"

        num = invoice.invoice_number
        ctrl = invoice.control_number
        ddt = _format_date_ddmmyyyy(invoice.issue_date)
        ttm = _format_time_hhmmss_am_pm(invoice.issue_time)
        st = invoice.status

        html = f"""<html><head><meta charset="utf-8">
        <style>
        @page {{ size: letter; margin: 2cm 2.5cm; }}
        body {{
            font-family: Helvetica, Arial, sans-serif;
            font-size: 14px; color: #1f2937;
            line-height: 1.5;
        }}
        .hdr {{
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 16px; margin-bottom: 16px;
        }}
        .co {{ text-align: right; }}
        .co p {{ margin: 0; font-size: 12px; color: #555; }}
        .co p:first-child {{ font-weight: bold; font-size: 14px; color: #1f2937; }}
        .mg {{
            display: flex; gap: 16px;
            background: #f9fafb; padding: 12px;
            border-radius: 8px; font-size: 12px;
            margin-bottom: 16px;
        }}
        .mg > div {{ flex: 1; }}
        .mg p {{ margin: 0; }}
        .sm {{
            font-size: 10px; text-transform: uppercase;
            color: #888; margin: 0 0 4px;
        }}
        .box {{
            background: #f3f4f6; padding: 12px;
            border-radius: 8px; margin-bottom: 16px;
            font-size: 12px;
        }}
        .box p {{ margin: 0; }}
        .xs {{ font-size: 10px; color: #888; }}
        table {{
            width: 100%; border-collapse: collapse;
            margin-bottom: 20px;
        }}
        th {{
            text-transform: uppercase; font-size: 12px;
            color: #888; border-bottom: 2px solid #e5e7eb;
            padding: 8px; text-align: left;
        }}
        td {{
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }}
        .l {{ text-align: left; }}
        .r {{ text-align: right; }}
        .c {{ text-align: center; }}
        .m {{ color: #888; }}
        .b {{ font-weight: 600; }}
        .cc {{
            background: #f9fafb; border: 1px solid #e5e7eb;
            border-radius: 8px; padding: 16px;
            margin-bottom: 16px;
        }}
        .cc h3 {{
            font-size: 12px; text-transform: uppercase;
            color: #888; margin: 0 0 8px;
        }}
        .cc p {{ margin: 0; }}
        .mb {{ margin-bottom: 16px; }}
        .mb > div {{
            display: flex; justify-content: space-between;
            padding: 4px 0;
        }}
        .tot {{ display: flex; justify-content: flex-end; }}
        .tot > div {{
            display: flex; justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            width: 280px;
        }}
        .tot .g {{ color: #16a34a; }}
        .tot .gr {{
            background: #fef2f2; border-radius: 8px;
            padding: 12px 16px; margin-top: 8px;
            border-bottom: none;
        }}
        .tot .gr span {{
            font-weight: 700; color: #dc2626;
        }}
        .tot .gr b {{
            font-size: 18px; font-weight: 700;
            color: #dc2626;
        }}
        .mt {{
            margin-top: 24px; padding-top: 16px;
            border-top: 1px solid #e5e7eb;
        }}
        .pay {{
            display: flex; justify-content: space-between;
            align-items: center; padding: 8px 16px;
            background: #f3f4f6; border-radius: 8px;
            margin-bottom: 4px;
        }}
        .pay em {{
            font-size: 10px; padding: 2px 8px;
            border-radius: 999px; font-style: normal;
        }}
        .fn {{
            margin-top: 24px; padding-top: 16px;
            border-top: 2px solid #e5e7eb;
            font-size: 10px; color: #888;
        }}
        .fn p {{ margin: 2px 0; }}
        .ftr {{
            margin-top: 32px; padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center; font-size: 10px;
            color: #999;
        }}
        </style></head><body>
        <div class="hdr">
        <div style="display:flex;justify-content:space-between;">
        <div>
        <h1 style="margin:0;font-size:28px;color:#dc2626;">
          FACTURA</h1>
        <p style="margin:4px 0 0;color:#888;">
          N° {num}</p>
        </div>{co_html}</div></div>
        <div class="mg">
        <div><p class="sm">N° Control</p>
        <p style="font-family:monospace;font-weight:600;">
          {ctrl}</p></div>
        <div><p class="sm">Fecha</p>
        <p><b>{ddt}</b></p></div>
        <div><p class="sm">Hora</p>
        <p><b>{ttm}</b></p></div>
        <div style="text-align:right;">
        <p class="sm">Estado</p>
        <span style="padding:2px 12px;border-radius:999px;
          font-size:11px;background:#dcfce7;color:#15803d;
          font-weight:600;">{st}</span></div></div>
        {range_html}
        <div class="cc">
        <h3>Datos del Cliente</h3>
        <div style="display:flex;gap:16px;">
        <div style="flex:1;">
        <p class="xs">Nombre / Razón Social</p>
        <p><b>{client_name}</b></p></div>
        <div style="flex:1;">
        <p class="xs">RIF / Cédula / Pasaporte</p>
        <p><b>{client_doc or "N/A"}</b></p></div></div>
        {fiscal_addr_html}</div>
        {lines_html}{adj_html}{totals_html}
        {pay_html}{prn_html}
        <div class="ftr">{ft}</div>
        </body></html>"""

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
