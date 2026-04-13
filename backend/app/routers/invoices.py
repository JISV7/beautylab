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
        """Generate a single invoice PDF matching the browser print version."""

        # ==================== Helpers ====================

        def _format_money(value: float) -> str:
            """Venezuelan format: 28.440,00"""
            return f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        def _translate_invoice_status(status: str) -> str:
            return {
                "issued": "Emitida",
                "paid": "Pagada",
                "partial": "Pago Parcial",
                "cancelled": "Cancelada",
            }.get(status, status.capitalize())

        def _translate_payment_status(status: str) -> str:
            return {
                "completed": "Completado",
            }.get(status, status.capitalize())

        # ==================== Data extraction ====================

        c = invoice.company
        cnr = invoice.control_number_range
        cnr_printer = cnr.printer if cnr else None
        num = invoice.invoice_number
        ctrl = invoice.control_number
        ddt = _format_date_ddmmyyyy(invoice.issue_date)
        ttm = _format_time_hhmmss_am_pm(invoice.issue_time)
        st = _translate_invoice_status(invoice.status)

        # ==================== Company info ====================

        co_html = ""
        if c:
            phone_part = f'<p class="text-sm muted">Tel: {c.phone}</p>' if c.phone else ""
            co_html = (
                '<div class="co-info">'
                f'<p class="co-name">{c.business_name} — RIF: {c.rif}</p>'
                f'<p class="text-sm muted">{c.fiscal_address or ""}</p>'
                f"{phone_part}"
                "</div>"
            )

        # ==================== Info bar (no background, no border) ====================

        info_bar_html = (
            '<div class="info-bar">'
            '<div class="info-item">'
            '<p class="info-label">N° Control</p>'
            f'<p class="mono">{ctrl}</p></div>'
            '<div class="info-item">'
            '<p class="info-label">Fecha de Emisión</p>'
            f'<p class="val">{ddt}</p></div>'
            '<div class="info-item">'
            '<p class="info-label">Hora de Emisión</p>'
            f'<p class="val">{ttm}</p></div>'
            '<div class="info-item info-status">'
            '<p class="info-label">Estado</p>'
            f'<span class="status-text">{st}</span></div>'
            "</div>"
        )

        # ==================== Client info (no background, no border) ====================

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
            client_doc = "N/A"

        fiscal_addr_html = ""
        if _addr:
            fiscal_addr_html = (
                '<div class="client-addr">'
                '<p class="info-label">Domicilio Fiscal</p>'
                f'<p class="val">{_addr}</p></div>'
            )

        client_html = (
            '<div class="client-section">'
            '<h3 class="section-title">Datos del Cliente</h3>'
            '<div class="client-grid">'
            '<div><p class="info-label">Nombre / Razón Social</p>'
            f'<p class="val">{client_name}</p></div>'
            '<div><p class="info-label">RIF / Cédula / Pasaporte</p>'
            f'<p class="val">{client_doc}</p></div>'
            "</div>"
            f"{fiscal_addr_html}"
            "</div>"
        )

        # ==================== Line items ====================

        lines_html = ""
        if invoice.lines:
            rows = ""
            for ln in invoice.lines:
                ex = '<span class="muted"> (E)</span>' if ln.is_exempt else ""
                price = f"Bs. {_format_money(float(ln.unit_price))}"
                rate = f"{_format_money(float(ln.tax_rate))}%" if ln.tax_rate else "16%"
                total = f"Bs. {_format_money(float(ln.line_total))}"
                rows += (
                    "<tr>"
                    f'<td class="td-desc">{ln.description}{ex}</td>'
                    f'<td class="td-num">{ln.quantity}</td>'
                    f'<td class="td-num">{price}</td>'
                    f'<td class="td-num muted">{rate}</td>'
                    f'<td class="td-num td-total">{total}</td>'
                    "</tr>"
                )
            lines_html = (
                '<table class="line-table">'
                "<thead><tr>"
                '<th class="th">Descripción</th>'
                '<th class="th th-center">Cant.</th>'
                '<th class="th th-right">Precio Unit.</th>'
                '<th class="th th-right">Alícuota</th>'
                '<th class="th th-right">Total</th>'
                "</tr></thead>"
                f"<tbody>{rows}</tbody></table>"
            )

        # ==================== Adjustments ====================

        if invoice.adjustments and len(invoice.adjustments) > 0:
            adj_parts = []
            for a in invoice.adjustments:
                sign = "-" if a.adjustment_type == "discount" else ""
                amt = f"{sign}Bs. {_format_money(float(a.amount))}"
                adj_parts.append(
                    '<div class="adj-row">'
                    f'<p class="val">{a.description}</p>'
                    f'<p class="adj-amount">{amt}</p></div>'
                )
            adj_html = "\n".join(adj_parts)
        else:
            adj_html = '<p class="muted adj-none">Ninguno</p>'

        # ==================== Totals panel (no background) ====================

        sub = f"Bs. {_format_money(float(invoice.subtotal))}"
        tax = f"Bs. {_format_money(float(invoice.tax_total))}"
        tot = f"Bs. {_format_money(float(invoice.total))}"

        disc_html = ""
        if float(invoice.discount_total) > 0:
            d = f"-Bs. {_format_money(float(invoice.discount_total))}"
            disc_html = (
                '<div class="tot-row">'
                '<span class="tot-label">Descuentos</span>'
                f'<span class="tot-val tot-green">{d}</span></div>'
            )

        totals_html = (
            '<div class="totals-panel">'
            '<div class="tot-row">'
            '<span class="tot-label">Base Imponible</span>'
            f'<span class="tot-val">{sub}</span></div>'
            '<div class="tot-row">'
            '<span class="tot-label">IVA</span>'
            f'<span class="tot-val">{tax}</span></div>'
            f"{disc_html}"
            '<div class="tot-row tot-grand">'
            '<span class="tot-label tot-grand-label">Total</span>'
            f'<span class="tot-grand-val">{tot}</span></div>'
            "</div>"
        )

        # ==================== Payments (no background, no badges) ====================

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
                amt = f"Bs. {_format_money(float(p.amount))}"
                p_status = _translate_payment_status(p.status)
                parts.append(
                    '<div class="pay-row">'
                    f'<span class="pay-method">{mt}'
                    f'<span class="pay-detail">{ci}</span></span>'
                    '<span class="pay-right">'
                    f'<span class="pay-amount">{amt}</span>'
                    f'<span class="pay-status">{p_status}</span>'
                    "</span></div>"
                )
            pay_html = (
                '<div class="payments-section">'
                '<h3 class="section-title">Desglose de Pagos</h3>'
                '<div class="pay-list">'
                f"{'\n'.join(parts)}"
                "</div></div>"
            )

        # ==================== Printer / Control range ====================

        range_html = ""
        if cnr:
            s = cnr.start_number.zfill(12)
            e = cnr.end_number.zfill(12)
            ad = cnr.assigned_date.strftime("%d/%m/%Y")
            p_name = cnr_printer.business_name if cnr_printer else "Imprenta"
            p_rif = cnr_printer.rif if cnr_printer else "N/A"
            p_prov = cnr_printer.authorization_providence if cnr_printer else "N/A"
            range_html = (
                '<div class="printer-section">'
                '<div class="printer-info">'
                f'<p class="val text-sm">{p_name} | RIF: {p_rif}</p>'
                f'<p class="muted text-sm">Providencia Administrativa: {p_prov}</p>'
                "</div>"
                '<div class="control-range">'
                f'<p class="val text-sm">Rango de Números de Control:'
                f" desde el N° {s} hasta el N° {e}</p>"
                f'<p class="muted text-sm">Fecha de asignación: {ad}</p></div>'
                "</div>"
            )
        elif cnr_printer:
            range_html = (
                '<div class="printer-section">'
                '<div class="printer-info">'
                f'<p class="val text-sm">{cnr_printer.business_name}'
                f" | RIF: {cnr_printer.rif}</p>"
                '<p class="muted text-sm">Providencia Administrativa: '
                f"{cnr_printer.authorization_providence}</p></div></div>"
            )

        # ==================== Footer ====================

        footer_html = ""
        if c:
            footer_html = f'<div class="footer"><p>{c.business_name} | RIF: {c.rif}</p></div>'

        # ==================== Assemble full HTML ====================

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
  @page {{
      size: legal;
      margin: 1.5cm 2cm;
  }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
      font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      color: #1A1A1A;
      line-height: 1.4;
  }}

  /* ---- Colors ---- */
  :root {{
      --primary: #F83A3A;
      --muted: rgba(26, 26, 26, 0.6);
      --green-text: #15803d;
  }}

  /* ---- Typography ---- */
  h1 {{
      font-size: 24pt;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.2;
  }}
  h3 {{
      font-size: 12pt;
      font-weight: 600;
      color: #1A1A1A;
      text-transform: uppercase;
      opacity: 0.75;
      margin-bottom: 8px;
  }}
  .text-sm {{ font-size: 8pt; }}
  .muted {{ color: var(--muted); font-size: 8pt; }}
  .val {{ font-weight: 500; font-size: 9pt; }}

  /* ---- Layout ---- */
  .invoice {{ padding: 4px 0; }}
  .header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #DDD;
      padding-bottom: 12px;
      margin-bottom: 12px;
  }}
  .header-left h1 {{ margin-bottom: 2px; }}
  .header-left .inv-num {{ color: var(--muted); font-size: 9pt; }}

  .co-info {{ text-align: right; min-width: 200px; }}
  .co-name {{ font-weight: 600; font-size: 10pt; color: #1A1A1A; }}

  /* ---- Info bar (transparent, no border) ---- */
  .info-bar {{
      display: flex;
      gap: 16px;
      padding: 8px 0;
      margin-bottom: 14px;
  }}
  .info-item {{ flex: 1; }}
  .info-label {{
      font-size: 8pt;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1px;
  }}
  .info-status {{ text-align: right; }}
  .status-text {{ font-weight: 500; font-size: 9pt; }}

  /* ---- Client section (transparent, no border) ---- */
  .client-section {{
      margin-bottom: 14px;
  }}
  .client-grid {{
      display: flex;
      gap: 24px;
  }}
  .client-grid > div {{ flex: 1; }}
  .client-addr {{ margin-top: 6px; }}

  /* ---- Line items table ---- */
  .line-table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
  }}
  .th {{
      text-align: left;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--muted);
      border-bottom: 1px solid #DDD;
      padding: 6px 4px;
  }}
  .th-center {{ text-align: center; }}
  .th-right {{ text-align: right; }}
  .line-table tbody tr {{
      border-bottom: 1px solid #EEE;
  }}
  .line-table td {{
      padding: 6px 4px;
      vertical-align: top;
      font-size: 9pt;
  }}
  .td-desc {{ text-align: left; }}
  .td-num {{ text-align: right; font-weight: 500; }}
  .td-total {{ font-weight: 600; }}

  /* ---- Adj + Totals row ---- */
  .details-row {{
      display: flex;
      gap: 24px;
      margin-bottom: 14px;
  }}
  .adj-block {{ flex: 1; }}
  .adj-row {{
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
  }}
  .adj-amount {{ font-weight: 500; font-size: 9pt; }}
  .adj-none {{ font-style: italic; padding: 3px 0; }}

  /* ---- Totals panel (transparent, no background) ---- */
  .totals-panel {{
      width: 200px;
      flex-shrink: 0;
  }}
  .tot-row {{
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
  }}
  .tot-label {{ color: var(--muted); font-size: 9pt; }}
  .tot-val {{ font-weight: 500; font-size: 9pt; }}
  .tot-green {{ color: var(--green-text); }}
  .tot-grand {{
      padding: 6px 0;
      margin-top: 4px;
      border-top: 1px solid #DDD;
  }}
  .tot-grand-label {{ font-weight: 700; color: var(--primary); font-size: 10pt; }}
  .tot-grand-val {{
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
  }}

  /* ---- Payments (transparent, no border, no badges) ---- */
  .payments-section {{
      border-top: 1px solid #DDD;
      padding-top: 12px;
      margin-top: 8px;
  }}
  .pay-list {{ display: flex; flex-direction: column; gap: 6px; }}
  .pay-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #EEE;
  }}
  .pay-method {{ font-weight: 600; font-size: 9pt; white-space: nowrap; }}
  .pay-detail {{ font-weight: 400; color: var(--muted); font-size: 8pt; }}
  .pay-right {{
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
  }}
  .pay-amount {{ font-weight: 600; font-size: 9pt; white-space: nowrap; }}
  .pay-status {{ font-size: 8pt; color: var(--green-text); white-space: nowrap; }}

  /* ---- Printer info ---- */
  .printer-section {{
      display: flex;
      gap: 24px;
      border-top: 1px solid #DDD;
      padding-top: 10px;
      margin-top: 14px;
  }}
  .printer-info {{ flex: 1; }}
  .control-range {{ flex: 1; text-align: right; }}

  /* ---- Footer ---- */
  .footer {{
      text-align: center;
      font-size: 7pt;
      color: #999;
      border-top: 1px solid #DDD;
      padding-top: 8px;
      margin-top: 14px;
  }}
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="header-left">
        <h1>FACTURA</h1>
        <p class="inv-num">N° {num}</p>
      </div>
      {co_html}
    </div>

    {info_bar_html}
    {client_html}
    {lines_html}

    <div class="details-row">
      <div class="adj-block">
        <h3 class="section-title">Ajustes</h3>
        {adj_html}
      </div>
      {totals_html}
    </div>

    {pay_html}
    {range_html}
    {footer_html}
  </div>
</body>
</html>"""

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
