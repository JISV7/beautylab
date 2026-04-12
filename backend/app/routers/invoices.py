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

        # Company info — matches frontend: font-semibold (600) for business_name
        co_html = ""
        if c:
            phone = f'<p class="text-paragraph">Tel: {c.phone}</p>' if c.phone else ""
            co_html = (
                '<div class="co">'
                f'<p class="font-semibold text-paragraph">{c.business_name} — RIF: {c.rif}</p>'
                f'<p class="text-paragraph">{c.fiscal_address or ""}</p>'
                f"{phone}"
                "</div>"
            )

        # Control range — matches frontend structure
        range_html = ""
        if cnr:
            s = cnr.start_number.zfill(12)
            e = cnr.end_number.zfill(12)
            ad = _format_date_ddmmyyyy(cnr.assigned_date)
            range_html = (
                '<div class="fn printer-info">'
                '<p class="text-paragraph">'
                f"{cnr_printer.business_name if cnr_printer else 'Imprenta'}"
                f" | RIF: {cnr_printer.rif if cnr_printer else 'N/A'}"
                "</p>"
                '<p class="text-paragraph mt-1">'
                "Providencia Administrativa: "
                f"{cnr_printer.authorization_providence if cnr_printer else 'N/A'}"
                "</p>"
                '<div class="control-range text-right">'
                '<p class="font-medium">'
                f"Rango de Números de Control:"
                f" desde el N° {s} hasta el N° {e}"
                "</p>"
                f'<p class="mt-1">Fecha de asignación: {ad}</p>'
                "</div></div>"
            )

        # Line items — matches frontend: th font-semibold, td values font-medium
        lines_html = ""
        if invoice.lines:
            rows = ""
            for ln in invoice.lines:
                ex = '<span class="opacity-75"> (E)</span>' if ln.is_exempt else ""
                price = f"Bs. {float(ln.unit_price):,.2f}"
                rate = f"{float(ln.tax_rate):,.2f}%" if ln.tax_rate else "16%"
                total = f"Bs. {float(ln.line_total):,.2f}"
                rows += (
                    "<tr>"
                    f'<td class="l py-3">{ln.description}{ex}</td>'
                    f'<td class="c py-3">{ln.quantity}</td>'
                    f'<td class="r py-3">{price}</td>'
                    f'<td class="r py-3 opacity-75">{rate}</td>'
                    f'<td class="r py-3 font-medium">{total}</td>'
                    "</tr>"
                )
            lines_html = (
                '<div class="overflow-x-auto"><table class="w-full mb-6">'
                '<thead><tr class="border-b-2 text-paragraph uppercase opacity-75">'
                '<th class="l py-3 font-semibold">Descripción</th>'
                '<th class="c py-3 font-semibold">Cant.</th>'
                '<th class="r py-3 font-semibold">Precio Unit.</th>'
                '<th class="r py-3 font-semibold">Alícuota</th>'
                '<th class="r py-3 font-semibold">Total</th>'
                "</tr></thead>"
                f"<tbody>{rows}</tbody></table></div>"
            )

        # Adjustments — matches frontend: h4 font-semibold opacity-75 uppercase
        adj_html = ""
        if invoice.adjustments and len(invoice.adjustments) > 0:
            parts = []
            for a in invoice.adjustments:
                sign = "-" if a.adjustment_type == "discount" else ""
                amt = f"{sign}Bs. {float(a.amount):,.2f}"
                parts.append(
                    f'<div class="py-2">'
                    f'<p class="text-paragraph">{a.description}</p>'
                    f'<p class="font-medium text-paragraph">{amt}</p>'
                    "</div>"
                )
            adj_html = (
                '<div class="adj-section">'
                '<h4 class="font-semibold text-paragraph opacity-75 uppercase mb-2">Ajustes</h4>'
                f"{'\n'.join(parts)}"
                "</div>"
            )
        else:
            adj_html = (
                '<div class="adj-section">'
                '<h4 class="font-semibold text-paragraph opacity-75 uppercase mb-2">Ajustes</h4>'
                '<p class="text-paragraph opacity-50 py-2">Ninguno</p>'
                "</div>"
            )

        # Totals — matches frontend: labels opacity-75, values font-medium, total uses h3 font-bold
        sub = f"Bs. {float(invoice.subtotal):,.2f}"
        tax = f"Bs. {float(invoice.tax_total):,.2f}"
        disc = ""
        if float(invoice.discount_total) > 0:
            d = f"-Bs. {float(invoice.discount_total):,.2f}"
            disc = (
                '<div class="flex items-center justify-between py-2 border-b">'
                '<span class="text-paragraph opacity-75">Descuentos</span>'
                f'<span class="font-medium text-green-600">{d}</span>'
                "</div>"
            )
        tot = f"Bs. {float(invoice.total):,.2f}"
        totals_html = (
            '<div class="totals-section">'
            '<div class="flex items-center justify-between py-2 border-b">'
            '<span class="text-paragraph opacity-75">Base Imponible</span>'
            f'<span class="font-medium text-paragraph">{sub}</span>'
            "</div>"
            '<div class="flex items-center justify-between py-2 border-b">'
            '<span class="text-paragraph opacity-75">IVA</span>'
            f'<span class="font-medium text-paragraph">{tax}</span>'
            "</div>"
            f"{disc}"
            '<div class="flex items-center justify-between '
            'py-3 px-3 rounded-lg mt-2 bg-primary-soft">'
            '<span class="font-bold text-primary">Total</span>'
            f'<span class="text-h3 font-bold text-primary">{tot}</span>'
            "</div>"
            "</div>"
        )

        # Payments — matches frontend: font-bold for method and amount, status badge
        pay_html = ""
        if invoice.payments:
            parts = []
            for p in invoice.payments:
                mt = (p.method_type or "Pago").replace("_", " ")
                ci = ""
                if hasattr(p, "details") and p.details:
                    if p.details.card_brand:
                        last4 = p.details.card_number_last4 or ""
                        ci = f" — {p.details.card_brand} ****{last4}"
                bg = "#dcfce7" if p.status == "completed" else "#fef9c3"
                clr = "#15803d" if p.status == "completed" else "#a16207"
                amt = f"Bs. {float(p.amount):,.2f}"
                parts.append(
                    '<div class="pay-row flex flex-col sm:flex-row '
                    "items-start sm:items-center justify-between "
                    "py-3 px-4 rounded-lg palette-surface "
                    'palette-border border">'
                    f'<span class="font-bold text-paragraph">{mt}'
                    f'<span class="font-semibold text-paragraph opacity-80">{ci}</span></span>'
                    '<div class="flex items-center gap-3 mt-2 sm:mt-0">'
                    f'<span class="font-bold text-paragraph">{amt}</span>'
                    f'<span class="status-badge px-2 py-0.5 '
                    'rounded-full text-xs font-medium" '
                    f'style="background:{bg};color:{clr}">'
                    f"{p.status}</span></div></div>"
                )
            pay_html = (
                '<div class="mt pt-6 border-t">'
                '<h3 class="font-semibold text-paragraph '
                'opacity-75 uppercase mb-4">Desglose de Pagos</h3>'
                '<div class="space-y-2">'
                f"{'\n'.join(parts)}"
                "</div></div>"
            )

        # Printer info (if not included in range_html)
        prn_html = ""
        if cnr_printer and not cnr:
            prn_html = (
                '<div class="fn printer-only">'
                '<p class="text-paragraph">'
                f"{cnr_printer.business_name}"
                f" | RIF: {cnr_printer.rif}"
                "</p>"
                '<p class="mt-1 text-paragraph">'
                "Providencia Administrativa: "
                f"{cnr_printer.authorization_providence}"
                "</p>"
                "</div>"
            )

        # Client info — matches frontend: labels opacity-75, values font-medium
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

        if _dtype and _dnum:
            client_doc = f"{_dtype}-{_dnum}"
        elif _rif:
            client_doc = _rif
        else:
            client_doc = ""

        fiscal_addr_html = ""
        if _addr:
            fiscal_addr_html = (
                '<div class="sm:col-span-2">'
                '<p class="text-paragraph opacity-75">Domicilio Fiscal</p>'
                f'<p class="font-medium">{_addr}</p>'
                "</div>"
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
            font-family: Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px; color: #1A1A1A;
            line-height: 1.5;
        }}

        /* ===== Typography — matches config-jsonb.txt light theme ===== */
        h1 {{
            font-family: Roboto, sans-serif;
            font-size: 39.87px; /* 2.492rem */
            color: #F83A3A;
            font-weight: 400;
            line-height: 1.2;
            margin: 0;
        }}
        h3 {{
            font-family: Roboto, sans-serif;
            font-size: 27.68px; /* 1.73rem */
            color: #D73359;
            font-weight: 400;
            line-height: 1.3;
            margin: 0;
        }}
        h4 {{
            font-family: Roboto, sans-serif;
            font-size: 23.04px; /* 1.44rem */
            color: #8F1D1D;
            font-weight: 400;
            line-height: 1.4;
            margin: 0;
        }}
        p, span, div, td, th {{
            font-family: Roboto, sans-serif;
            font-size: 16px;
            color: #1A1A1A;
            font-weight: 400;
            line-height: 1.5;
        }}

        /* ===== Font weight utilities ===== */
        .font-bold {{ font-weight: 700; }}
        .font-semibold {{ font-weight: 600; }}
        .font-medium {{ font-weight: 500; }}

        /* ===== Opacity utilities ===== */
        .opacity-75 {{ opacity: 0.75; }}
        .opacity-50 {{ opacity: 0.5; }}
        .opacity-80 {{ opacity: 0.8; }}

        /* ===== Text utilities ===== */
        .uppercase {{ text-transform: uppercase; }}
        .text-right {{ text-align: right; }}
        .text-left {{ text-align: left; }}
        .text-center {{ text-align: center; }}
        .text-primary {{ color: #F83A3A; }}
        .text-green-600 {{ color: #16a34a; }}
        .text-paragraph {{ color: #1A1A1A; }}
        .mt-1 {{ margin-top: 4px; }}
        .mt-2 {{ margin-top: 8px; }}
        .mt-6 {{ margin-top: 24px; }}
        .mb-2 {{ margin-bottom: 8px; }}
        .mb-3 {{ margin-bottom: 12px; }}
        .mb-4 {{ margin-bottom: 16px; }}
        .mb-6 {{ margin-bottom: 24px; }}
        .py-2 {{ padding-top: 8px; padding-bottom: 8px; }}
        .py-3 {{ padding-top: 12px; padding-bottom: 12px; }}
        .px-3 {{ padding-left: 12px; padding-right: 12px; }}
        .px-4 {{ padding-left: 16px; padding-right: 16px; }}
        .p-4 {{ padding: 16px; }}
        .p-8 {{ padding: 32px; }}
        .gap-3 {{ gap: 12px; }}
        .gap-4 {{ gap: 16px; }}
        .gap-6 {{ gap: 24px; }}

        /* ===== Layout ===== */
        .flex {{ display: flex; }}
        .flex-col {{ flex-direction: column; }}
        .items-center {{ align-items: center; }}
        .items-start {{ align-items: flex-start; }}
        .justify-between {{ justify-content: space-between; }}
        .rounded-lg {{ border-radius: 8px; }}
        .rounded-full {{ border-radius: 9999px; }}
        .overflow-x-auto {{ overflow-x: auto; }}
        .w-full {{ width: 100%; }}
        .space-y-2 > * + * {{ margin-top: 8px; }}

        /* ===== Colors ===== */
        .bg-primary-soft {{ background-color: rgba(248, 58, 58, 0.1); }}
        .palette-surface {{ background-color: #EEEEF0; }}
        .palette-border {{ border-color: #DDDDDD; }}
        .border {{ border: 1px solid #DDDDDD; }}
        .border-b {{ border-bottom: 1px solid #DDDDDD; }}
        .border-b-2 {{ border-bottom: 2px solid #DDDDDD; }}
        .border-t {{ border-top: 1px solid #DDDDDD; }}

        /* ===== Header section ===== */
        .hdr {{
            border-bottom: 2px solid #DDDDDD;
            padding-bottom: 24px; margin-bottom: 24px;
        }}
        .hdr-top {{
            display: flex; flex-direction: column; gap: 16px;
        }}
        .hdr-main {{
            display: flex; justify-content: space-between; align-items: flex-start;
        }}
        .co {{ text-align: right; }}
        .co p {{ margin: 0; }}

        /* ===== Info grid (N° Control, Fecha, Hora, Estado) ===== */
        .mg {{
            display: flex; gap: 16px; flex-wrap: wrap;
            background: #EEEEF0; padding: 16px;
            border-radius: 8px; font-size: 16px;
        }}
        .mg > div {{ flex: 1; min-width: 0; }}
        .mg p {{ margin: 0; }}

        /* ===== Table ===== */
        table {{
            width: 100%; border-collapse: collapse;
            margin-bottom: 24px;
        }}
        th {{
            text-transform: uppercase; font-size: 16px;
            color: #1A1A1A; border-bottom: 2px solid #DDDDDD;
            padding: 12px 8px; text-align: left;
            font-weight: 600; opacity: 0.75;
        }}
        td {{
            padding: 12px 8px;
            border-bottom: 1px solid #DDDDDD;
        }}

        /* ===== Client card ===== */
        .cc {{
            background: #EEEEF0; border: 1px solid #DDDDDD;
            border-radius: 8px; padding: 16px;
            margin-bottom: 24px;
        }}
        .cc h3 {{
            font-size: 16px; text-transform: uppercase;
            color: #1A1A1A; opacity: 0.75; font-weight: 600;
            margin: 0 0 12px;
        }}
        .cc p {{ margin: 0; }}
        .client-grid {{ display: flex; gap: 16px; }}
        .client-grid > div {{ flex: 1; }}

        /* ===== Totals ===== */
        .totals-section {{ margin-left: auto; width: 280px; }}
        .totals-section > div {{
            display: flex; justify-content: space-between;
            padding: 8px 0;
        }}
        .text-h3 {{
            font-family: Roboto, sans-serif;
            font-size: 27.68px;
            color: #F83A3A;
            font-weight: 700;
        }}

        /* ===== Payments ===== */
        .pay-row {{
            display: flex; justify-content: space-between;
            align-items: center; padding: 12px 16px;
            background: #EEEEF0; border: 1px solid #DDDDDD;
            border-radius: 8px; margin-bottom: 8px;
        }}
        .status-badge {{
            font-size: 10px; padding: 2px 8px;
            border-radius: 999px; font-style: normal;
        }}

        /* ===== Printer / Footer ===== */
        .fn {{
            margin-top: 24px; padding-top: 16px;
            border-top: 2px solid #DDDDDD;
            font-size: 16px; color: #1A1A1A;
        }}
        .fn p {{ margin: 4px 0; }}
        .printer-info {{
            display: flex; flex-direction: column; gap: 4px;
        }}
        .control-range {{ margin-top: 8px; }}
        .ftr {{
            margin-top: 32px; padding-top: 16px;
            border-top: 1px solid #DDDDDD;
            text-align: center; font-size: 12px;
            color: #999;
        }}
        </style></head><body>
        <div class="p-8">
        <div class="hdr">
        <div class="hdr-main">
        <div>
        <h1 class="font-bold">FACTURA</h1>
        <p class="text-paragraph opacity-75 mt-1">N° {num}</p>
        </div>{co_html}</div></div>
        <div class="mg">
        <div><p class="text-paragraph opacity-75 uppercase">N° Control</p>
        <p class="font-medium" style="font-family:monospace;">{ctrl}</p></div>
        <div><p class="text-paragraph opacity-75 uppercase">Fecha de Emisión</p>
        <p class="font-medium">{ddt}</p></div>
        <div><p class="text-paragraph opacity-75 uppercase">Hora de Emisión</p>
        <p class="font-medium">{ttm}</p></div>
        <div class="text-right">
        <p class="text-paragraph opacity-75 uppercase">Estado</p>
        <span class="px-2 py-1 rounded-full font-medium"
              style="background:#dcfce7;color:#15803d;">{st}</span></div></div>
        </div>
        {range_html}
        <div class="cc">
        <h3 class="font-semibold text-paragraph opacity-75
            uppercase mb-3">Datos del Cliente</h3>
        <div class="client-grid">
        <div>
        <p class="text-paragraph opacity-75">Nombre / Razón Social</p>
        <p class="font-medium">{client_name}</p></div>
        <div>
        <p class="text-paragraph opacity-75">RIF / Cédula / Pasaporte</p>
        <p class="font-medium">{client_doc or "N/A"}</p></div></div>
        {fiscal_addr_html}</div>
        {lines_html}
        <div class="flex flex-col lg:flex-row gap-6 mb-6">
        <div class="flex-1">{adj_html}</div>
        <div>{totals_html}</div></div>
        {pay_html}{prn_html}
        <div class="ftr">{ft}</div>
        </div>
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
