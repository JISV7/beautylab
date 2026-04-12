"""Email service for sending notifications and invoices."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings

settings = get_settings()


class EmailService:
    """Service for sending emails via SMTP."""

    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.from_email

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str | None = None,
    ) -> bool:
        """
        Send an email.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body content
            text_content: Plain text body (optional, auto-generated from HTML if not provided)

        Returns:
            True if sent successfully, False otherwise
        """
        if not text_content:
            # Simple HTML to text conversion (strip tags)
            import re

            text_content = re.sub(r"<[^>]+>", "", html_content)

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to_email

        # Attach parts
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        try:
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.smtp_user and self.smtp_password:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"Error sending email to {to_email}: {e}")
            return False

    def send_invoice_email(
        self,
        to_email: str,
        invoice_number: str,
        total: str,
        issue_date: str,
        items: list[dict],
        download_url: str | None = None,
        control_number: str | None = None,
        issue_time: str | None = None,
        status: str | None = None,
        company: dict | None = None,
        client_name: str | None = None,
        client_doc: str | None = None,
        client_address: str | None = None,
        subtotal: str | None = None,
        tax_total: str | None = None,
        discount_total: str | None = None,
        adjustments: list[dict] | None = None,
        payments: list[dict] | None = None,
        printer_info: dict | None = None,
        control_range: dict | None = None,
    ) -> bool:
        """Send invoice email matching website InvoiceDetail style."""
        # Format date DDMMYYYY
        try:
            from datetime import datetime

            dt = datetime.fromisoformat(issue_date)
            date_fmt = f"{dt.day:02d}{dt.month:02d}{dt.year}"
            date_display = dt.strftime("%d/%m/%Y")
        except Exception:
            date_fmt = issue_date
            date_display = issue_date

        # Format time
        time_fmt = ""
        if issue_time:
            try:
                from datetime import datetime

                t = datetime.strptime(issue_time, "%H:%M:%S")
                h = t.hour
                ampm = "p.m." if h >= 12 else "a.m."
                h = h % 12 or 12
                time_fmt = f"{h:02d}.{t.minute:02d}.{t.second:02d} {ampm}"
            except Exception:
                time_fmt = issue_time

        status_display = status or "issued"
        if status_display == "issued":
            status_display = "Emitida"
        status_display = status_display.capitalize()

        # Company info
        co_name = company.get("business_name", "") if company else ""
        co_rif = company.get("rif", "") if company else ""
        co_address = company.get("fiscal_address", "") if company else ""
        co_phone = company.get("phone", "") if company else ""
        co_html = ""
        if co_name:
            phone_p = "Tel: " + co_phone if co_phone else ""
            co_html = (
                '<div class="co">'
                f'<p class="fw600">{co_name} \u2014 RIF: {co_rif}</p>'
                f"<p>{co_address}</p>"
                f"<p>{phone_p}</p>"
                "</div>"
            )

        # Client name fallback
        display_client_name = client_name or "Cliente"
        display_client_doc = client_doc or "N/A"

        # Line items
        items_html = ""
        for item in items:
            desc = item.get("description", "")
            qty = item.get("quantity", 1)
            price = item.get("unit_price", "0.00")
            line_total = item.get("line_total", "0.00")
            tax_rate = item.get("tax_rate")
            is_exempt = item.get("is_exempt")
            ex = ' <span class="op75">(E)</span>' if is_exempt else ""
            rate_val = f"{float(tax_rate):,.2f}%" if tax_rate else "16%"
            items_html += "<tr>"
            items_html += f'<td class="tl">{desc}{ex}</td>'
            items_html += f'<td class="tc">{qty}</td>'
            items_html += f'<td class="tr">Bs. {float(price):,.2f}</td>'
            items_html += f'<td class="tr op75">{rate_val}</td>'
            items_html += '<td class="tr fw500">'
            items_html += f"Bs. {float(line_total):,.2f}</td>"
            items_html += "</tr>"

        # Adjustments
        adj_html = ""
        if adjustments and len(adjustments) > 0:
            adj_rows = ""
            for adj in adjustments:
                sign = "-" if adj.get("adjustment_type") == "discount" else ""
                amt = f"{sign}Bs. {float(adj['amount']):,.2f}"
                dsc = adj.get("description", "")
                adj_rows += (
                    f'<div class="adj-row"><span>{dsc}</span><span class="fw500">{amt}</span></div>'
                )
            adj_html = (
                f'<div class="adj-section"><h4 class="sec-title">Ajustes</h4>{adj_rows}</div>'
            )
        else:
            adj_html = (
                '<div class="adj-section">'
                '<h4 class="sec-title">Ajustes</h4>'
                '<p class="ninguno">Ninguno</p>'
                "</div>"
            )

        # Totals
        sub_val = f"Bs. {float(subtotal):,.2f}" if subtotal else ""
        tax_val = f"Bs. {float(tax_total):,.2f}" if tax_total else ""
        disc_html = ""
        if discount_total and float(discount_total) > 0:
            disc_html = (
                '<div class="tot-row">'
                '<span class="op75">Descuentos</span>'
                f'<span class="green">-Bs. {float(discount_total):,.2f}</span>'
                "</div>"
            )
        total_val = f"Bs. {float(total):,.2f}"
        totals_html = (
            '<div class="totals-sec">'
            '<div class="tot-row">'
            '<span class="op75">Base Imponible</span>'
            f'<span class="fw500">{sub_val}</span>'
            "</div>"
            '<div class="tot-row">'
            '<span class="op75">IVA</span>'
            f'<span class="fw500">{tax_val}</span>'
            "</div>"
            f"{disc_html}"
            '<div class="tot-gr">'
            '<span class="fw700 primary">Total</span>'
            f'<span class="total-amount">{total_val}</span>'
            "</div>"
            "</div>"
        )

        # Payments
        pay_html = ""
        if payments and len(payments) > 0:
            pay_rows = ""
            for p in payments:
                mt = (p.get("method_type", "Pago") or "Pago").replace("_", " ")
                ci = ""
                if p.get("card_brand"):
                    last4 = p.get("card_last4", "")
                    ci = f" \u2014 {p['card_brand']} ****{last4}"
                bg = "#dcfce7" if p.get("status") == "completed" else "#fef9c3"
                clr = "#15803d" if p.get("status") == "completed" else "#a16207"
                amt = f"Bs. {float(p.get('amount', 0)):,.2f}"
                st = p.get("status", "")
                pay_rows += (
                    '<div class="pay-row">'
                    f'<span class="fw700">{mt}'
                    f'<span class="fw600 op80">{ci}</span></span>'
                    '<div class="pay-right">'
                    f'<span class="fw700">{amt}</span>'
                    f'<span class="badge" style="background:{bg};'
                    f'color:{clr};">{st}</span>'
                    "</div></div>"
                )
            pay_html = (
                '<div class="pay-section">'
                '<h3 class="sec-title">Desglose de Pagos</h3>'
                f"{pay_rows}"
                "</div>"
            )

        # Printer info
        prn_html = ""
        if printer_info:
            prn_name = printer_info.get("business_name", "Imprenta")
            prn_rif = printer_info.get("rif", "N/A")
            prn_prov = printer_info.get("authorization_providence", "N/A")
            prn_html = (
                '<div class="printer-sec">'
                f"<p>{prn_name} | RIF: {prn_rif}</p>"
                f"<p>Providencia Administrativa: {prn_prov}</p>"
                "</div>"
            )

        # Control range
        range_html = ""
        if control_range:
            s = control_range.get("start_number", "").zfill(12)
            e = control_range.get("end_number", "").zfill(12)
            ad = control_range.get("assigned_date", "")
            range_html = (
                '<div class="range-sec">'
                '<p class="fw500">Rango de N\u00fameros'
                f" de Control: desde el N\u00b0 {s}"
                f" hasta el N\u00b0 {e}</p>"
                f"<p>Fecha de asignaci\u00f3n: {ad}</p>"
                "</div>"
            )

        # Download button
        download_html = ""
        if download_url:
            download_html = (
                '<div class="dl-sec">'
                f'<a href="{download_url}" class="dl-btn">'
                "Descargar Factura PDF</a>"
                "</div>"
            )

        # Fiscal address
        fiscal_addr_html = ""
        if client_address:
            fiscal_addr_html = (
                '<div class="fiscal-sec">'
                '<p class="op75">Domicilio Fiscal</p>'
                f'<p class="fw500">{client_address}</p>'
                "</div>"
            )

        subject = f"Factura {invoice_number} - {co_name or 'Beautylab'}"

        # Build the time column separately
        time_col = ""
        if time_fmt:
            time_col = (
                "<div>"
                '<p class="label">Hora de Emisi\u00f3n</p>'
                f'<p class="fw500">{time_fmt}</p>'
                "</div>"
            )

        # Build table header separately
        tbl_hdr = (
            "<thead><tr>"
            "<th>Descripci\u00f3n</th>"
            "<th>Cant.</th>"
            "<th>Precio Unit.</th>"
            "<th>Al\u00edcuota</th>"
            "<th>Total</th>"
            "</tr></thead>"
        )

        table_block = ""
        if items_html:
            table_block = f"<table>{tbl_hdr}<tbody>{items_html}</tbody></table>"

        html_content = (
            "<!DOCTYPE html>\n<html>\n<head>\n"
            '<meta charset="utf-8">\n'
            "<style>\n"
            "body { font-family: Roboto, Arial, sans-serif;\n"
            "  font-size: 16px; color: #1A1A1A;\n"
            "  line-height: 1.5; margin: 0; padding: 0;\n"
            "  background-color: #FBFBFE; }\n"
            ".email-wrapper { max-width: 680px;\n"
            "  margin: 0 auto; padding: 32px; }\n"
            ".invoice-content { background-color: #EEEEF0;\n"
            "  border: 1px solid #DDDDDD;\n"
            "  border-radius: 12px; padding: 32px; }\n"
            ".hdr { border-bottom: 2px solid #DDDDDD;\n"
            "  padding-bottom: 24px; margin-bottom: 24px; }\n"
            ".hdr-top { display: flex;\n"
            "  justify-content: space-between;\n"
            "  align-items: flex-start; }\n"
            ".co { text-align: right; }\n"
            ".co p { margin: 0; }\n"
            ".info-grid { display: flex; gap: 16px;\n"
            "  background-color: #EEEEF0;\n"
            "  padding: 16px; border-radius: 8px; }\n"
            ".info-grid > div { flex: 1; min-width: 0; }\n"
            ".info-grid p { margin: 0; }\n"
            ".label { font-size: 16px; color: #1A1A1A;\n"
            "  opacity: 0.75; text-transform: uppercase; }\n"
            ".client-card { background-color: #EEEEF0;\n"
            "  border: 1px solid #DDDDDD;\n"
            "  border-radius: 8px; padding: 16px;\n"
            "  margin-bottom: 24px; margin-top: 24px; }\n"
            ".client-grid { display: flex; gap: 16px; }\n"
            ".client-grid > div { flex: 1; }\n"
            "table { width: 100%; border-collapse: collapse;\n"
            "  margin-bottom: 24px; }\n"
            "th { text-transform: uppercase; font-size: 16px;\n"
            "  color: #1A1A1A;\n"
            "  border-bottom: 2px solid #DDDDDD;\n"
            "  padding: 12px 8px; text-align: left;\n"
            "  font-weight: 600; opacity: 0.75; }\n"
            "td { padding: 12px 8px;\n"
            "  border-bottom: 1px solid #DDDDDD; }\n"
            ".tl { text-align: left; }\n"
            ".tc { text-align: center; }\n"
            ".tr { text-align: right; }\n"
            ".totals-row { display: flex; gap: 24px;\n"
            "  margin-bottom: 24px; }\n"
            ".adj-section { flex: 1; }\n"
            ".adj-row { display: flex;\n"
            "  justify-content: space-between;\n"
            "  padding: 8px 0; }\n"
            ".ninguno { opacity: 0.5; padding: 8px 0; }\n"
            ".totals-sec { margin-left: auto; width: 280px; }\n"
            ".tot-row { display: flex;\n"
            "  justify-content: space-between;\n"
            "  padding: 8px 0;\n"
            "  border-bottom: 1px solid #DDDDDD; }\n"
            ".tot-gr { display: flex;\n"
            "  justify-content: space-between;\n"
            "  padding: 12px 16px;\n"
            "  border-radius: 8px; margin-top: 8px;\n"
            "  background-color: rgba(248,58,58,0.1); }\n"
            ".total-amount { font-family: Roboto, sans-serif;\n"
            "  font-size: 27.68px; color: #F83A3A;\n"
            "  font-weight: 700; }\n"
            ".green { color: #16a34a; }\n"
            ".primary { color: #F83A3A; }\n"
            ".pay-section { margin-top: 24px;\n"
            "  padding-top: 24px;\n"
            "  border-top: 1px solid #DDDDDD; }\n"
            ".pay-row { display: flex;\n"
            "  justify-content: space-between;\n"
            "  align-items: center;\n"
            "  padding: 12px 16px;\n"
            "  border-radius: 8px; margin-bottom: 8px;\n"
            "  background-color: #EEEEF0;\n"
            "  border: 1px solid #DDDDDD; }\n"
            ".pay-right { display: flex;\n"
            "  align-items: center; gap: 12px; }\n"
            ".badge { padding: 2px 8px;\n"
            "  border-radius: 999px; font-size: 12px;\n"
            "  font-weight: 500; }\n"
            ".printer-sec { margin-top: 24px;\n"
            "  padding-top: 24px;\n"
            "  border-top: 2px solid #DDDDDD; }\n"
            ".range-sec { text-align: right;\n"
            "  margin-top: 24px; padding-top: 24px;\n"
            "  border-top: 2px solid #DDDDDD; }\n"
            ".dl-sec { margin-top: 32px;\n"
            "  text-align: center; }\n"
            ".dl-btn { background-color: #F83A3A;\n"
            "  color: #FFFFFF; padding: 14px 28px;\n"
            "  text-decoration: none; border-radius: 8px;\n"
            "  display: inline-block;\n"
            "  font-family: Roboto, sans-serif;\n"
            "  font-size: 16px; font-weight: 600; }\n"
            ".fiscal-sec { margin-top: 12px; }\n"
            ".sec-title { font-family: Roboto, sans-serif;\n"
            "  font-size: 16px; color: #1A1A1A;\n"
            "  font-weight: 600;\n"
            "  text-transform: uppercase;\n"
            "  opacity: 0.75; margin: 0 0 12px; }\n"
            "h1 { font-family: Roboto, sans-serif;\n"
            "  font-size: 39.87px; color: #F83A3A;\n"
            "  font-weight: 700; margin: 0; }\n"
            "h3 { font-family: Roboto, sans-serif;\n"
            "  font-size: 27.68px; color: #D73359;\n"
            "  font-weight: 600; margin: 0 0 16px; }\n"
            "h4 { font-family: Roboto, sans-serif;\n"
            "  font-size: 23.04px; color: #8F1D1D;\n"
            "  font-weight: 600; margin: 0 0 8px; }\n"
            ".fw700 { font-weight: 700; }\n"
            ".fw600 { font-weight: 600; }\n"
            ".fw500 { font-weight: 500; }\n"
            ".op75 { opacity: 0.75; }\n"
            ".op80 { opacity: 0.8; }\n"
            "p { margin: 0; font-size: 16px;\n"
            "  color: #1A1A1A; }\n"
            ".footer { margin-top: 32px;\n"
            "  padding-top: 16px;\n"
            "  border-top: 1px solid #DDDDDD;\n"
            "  text-align: center; font-size: 12px;\n"
            "  color: #999; }\n"
            "</style>\n</head>\n<body>\n"
            '<div class="email-wrapper">\n'
            "<p>Estimado cliente,</p>\n"
            "<p>Gracias por su compra. A continuaci\u00f3n "
            "encontrar\u00e1 el detalle de su factura.</p>\n"
            '\n<div class="invoice-content">\n'
            '<div class="hdr">\n'
            '<div class="hdr-top">\n'
            "<div>\n"
            "<h1>FACTURA</h1>\n"
            f'<p class="op75" style="margin:4px 0 0;">'
            f"N\u00b0 {invoice_number}</p>\n"
            "</div>\n"
            f"{co_html}"
            "</div>\n</div>\n"
            '\n<div class="info-grid">\n'
            "<div>\n"
            '<p class="label">N\u00b0 Control</p>\n'
            f'<p class="fw500" style="font-family:monospace;">'
            f"{control_number or 'N/A'}</p>\n"
            "</div>\n"
            "<div>\n"
            '<p class="label">Fecha de Emisi\u00f3n</p>\n'
            f'<p class="fw500">{date_fmt}</p>\n'
            "</div>\n"
            f"{time_col}"
            '<div style="text-align:right;">\n'
            '<p class="label">Estado</p>\n'
            '<span class="status-badge">'
            f"{status_display}</span>\n"
            "</div>\n</div>\n"
            '\n<div class="client-card">\n'
            '<h3 class="sec-title">Datos del Cliente</h3>\n'
            '<div class="client-grid">\n'
            "<div>\n"
            '<p class="op75">Nombre / Raz\u00f3n Social</p>\n'
            f'<p class="fw500">{display_client_name}</p>\n'
            "</div>\n"
            "<div>\n"
            '<p class="op75">RIF / C\u00e9dula / Pasaporte</p>\n'
            f'<p class="fw500">{display_client_doc}</p>\n'
            "</div>\n</div>\n"
            f"{fiscal_addr_html}"
            "</div>\n"
            f"\n{table_block}\n"
            '\n<div class="totals-row">\n'
            '<div class="adj-section">'
            f"{adj_html}</div>\n"
            f"{totals_html}"
            "</div>\n"
            f"{pay_html}{prn_html}{range_html}"
            f"{download_html}"
            "\n</div>\n"
            '\n<div class="footer">\n'
            f"<p>\u00a9 2026 {co_name or 'Beautylab'}."
            " Todos los derechos reservados.</p>\n"
            "<p>\u00bfNecesita ayuda? Cont\u00e1ctenos en "
            f"{settings.support_email}</p>\n"
            "</div>\n</div>\n</body>\n</html>"
        )

        sub_text = f"Bs. {float(subtotal):,.2f}" if subtotal else "N/A"
        tax_text = f"Bs. {float(tax_total):,.2f}" if tax_total else "N/A"
        dl_text = f"Descargar PDF: {download_url}" if download_url else ""

        text_content = (
            f"Factura {invoice_number}\n"
            f"Fecha: {date_display}\n"
            f"N\u00b0 Control: {control_number or 'N/A'}\n"
            f"Estado: {status_display}\n\n"
            f"Cliente: {display_client_name}\n"
            f"RIF/C\u00e9dula: {display_client_doc}\n\n"
            f"Detalle:\n{self._format_items_text(items)}\n\n"
            f"Base Imponible: {sub_text}\n"
            f"IVA: {tax_text}\n"
            f"Total: Bs. {float(total):,.2f}\n\n"
            f"{dl_text}\n\n"
            "Gracias por su compra.\n"
            f"Beautylab - {settings.support_email}"
        )

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

    def _format_items_text(self, items: list[dict]) -> str:
        """Format invoice items as text."""
        lines = []
        for item in items:
            desc = item.get("description", "")
            qty = item.get("quantity", 1)
            total = item.get("line_total", "0.00")
            lines.append(f"- {desc} x{qty}: Bs. {total}")
        return "\n".join(lines)

    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email to new user."""
        subject = "Welcome to Codyn Academy!"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px;
                           text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .button {{ background-color: #4CAF50; color: white; padding: 14px 20px;
                           text-decoration: none; border-radius: 4px;
                           display: inline-block; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Codyn Academy!</h1>
                </div>

                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>Thank you for joining Codyn Academy - your online learning platform.</p>
                    <p>Get started by exploring our features:</p>
                    <ul>
                        <li>Browse programming courses</li>
                        <li>Manage your profile</li>
                        <li>Purchase courses and learning paths</li>
                    </ul>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{settings.website_url}/dashboard" class="button">To Dashboard</a>
                    </p>
                </div>

                <div class="footer">
                    <p>&copy; 2026 Codyn Academy. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
        )

    def send_purchase_confirmation_email(
        self,
        to_email: str,
        invoice_number: str,
        course_name: str,
        total: str,
        issue_date: str,
        items: list[dict],
        payment_breakdown: list[dict] | None = None,
        subtotal: str | None = None,
        tax_total: str | None = None,
    ) -> bool:
        """
        Send purchase confirmation email with payment details.

        Args:
            to_email: Customer email
            invoice_number: Invoice number
            course_name: Name of purchased course
            total: Total amount paid
            issue_date: Purchase date
            items: List of line items
            payment_breakdown: List of payment methods used (for split payments)
            subtotal: Subtotal before tax
            tax_total: Tax amount (IVA)
        """
        subject = f"Purchase Confirmation - {course_name} - Codyn Academy"

        # Build items HTML
        items_html = ""
        for item in items:
            desc = item.get("description", "")
            qty = item.get("quantity", 1)
            price = item.get("unit_price", "0.00")
            line_total = item.get("line_total", "0.00")
            items_html += (
                f"<tr>"
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd;">{desc}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: center;">{qty}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: right;">Bs. {price}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: right;">Bs. {line_total}</td>'
                f"</tr>"
            )

        # Build payment breakdown HTML
        payment_html = ""
        if payment_breakdown:
            payment_html = """
            <div style="margin-top: 20px;">
                <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">
                    Payment Breakdown
                </h3>
                <table style="width: 100%; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="background-color: #4CAF50;
                                color: white; padding: 8px; text-align: left;">Method</th>
                            <th style="background-color: #4CAF50;
                                color: white; padding: 8px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            for payment in payment_breakdown:
                method = payment.get("method", "Unknown")
                amount = payment.get("amount", "0.00")
                reference = payment.get("reference", "")
                ref_display = f" ({reference})" if reference else ""
                payment_html += (
                    f"<tr>"
                    f'<td style="padding: 8px; border-bottom: 1px solid #ddd;">'
                    f"{method}{ref_display}</td>"
                    f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                    f'text-align: right;">Bs. {amount}</td>'
                    f"</tr>"
                )
            payment_html += """
                    </tbody>
                </table>
            </div>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px;
                           text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .invoice-details {{ background-color: white; padding: 20px; margin: 20px 0;
                                   border-radius: 4px; }}
                .success-banner {{ background-color: #d4edda; border: 1px solid #c3e6cb;
                                   color: #155724; padding: 15px; border-radius: 4px;
                                   margin: 20px 0; text-align: center; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background-color: #4CAF50; color: white; padding: 10px; text-align: left; }}
                .total {{ font-size: 18px; font-weight: bold; text-align: right;
                         margin-top: 20px; padding-top: 10px; border-top: 2px solid #4CAF50; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .access-info {{ background-color: #e7f3ff; border: 1px solid #b3d9ff;
                               color: #004085; padding: 15px; border-radius: 4px;
                               margin: 20px 0; }}
                .access-info h3 {{ margin-top: 0; color: #004085; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Codyn Academy</h1>
                    <p>Purchase Confirmation</p>
                </div>

                <div class="content">
                    <div class="success-banner">
                        <strong>✓ Payment Successful!</strong><br>
                        Your purchase has been confirmed.
                    </div>

                    <p>Dear Valued Customer,</p>
                    <p>Thank you for your purchase! Your enrollment has been confirmed.</p>

                    <div class="invoice-details">
                        <p><strong>Invoice Number:</strong> {invoice_number}</p>
                        <p><strong>Purchase Date:</strong> {issue_date}</p>
                        <p><strong>Course:</strong> {course_name}</p>

                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: center;">Qty</th>
                                    <th style="text-align: right;">Price</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items_html}
                            </tbody>
                        </table>

                        {payment_html}

                        <div style="margin-top: 20px;
                            padding-top: 10px; border-top: 1px solid #ddd;">
                            <div style="display: flex;
                                justify-content: space-between; padding: 5px 0;">
                                <span>Base Price:</span>
                                <span>Bs. {subtotal or "0.00"}</span>
                            </div>
                            <div style="display: flex;
                                justify-content: space-between; padding: 5px 0;">
                                <span>IVA (16%):</span>
                                <span>Bs. {tax_total or "0.00"}</span>
                            </div>
                            <div class="total">
                                Total Paid: Bs. {total}
                            </div>
                        </div>
                    </div>

                    <div class="access-info">
                        <h3>📚 Access Your Course</h3>
                        <p>You can now access your course materials
                           from your dashboard:</p>
                        <p style="text-align: center; margin: 15px 0;">
                            <a href="{settings.website_url}"
                               style="background-color: #4CAF50; color: white;
                                      padding: 12px 24px; text-decoration: none;
                                      border-radius: 4px; display: inline-block;">
                                Go to Dashboard
                            </a>
                        </p>
                        <p style="font-size: 14px; margin-top: 10px;">
                            Navigate to "My Courses" to start learning!
                        </p>
                    </div>

                    <p>If you have questions or need assistance,
                       please contact our support team at {settings.support_email}.</p>

                    <p>Best regards,<br><strong>The Codyn Academy Team</strong></p>
                </div>

                <div class="footer">
                    <p>&copy; 2026 Codyn Academy. All rights reserved.</p>
                    <p>Need help? Contact us at {settings.support_email}</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
Purchase Confirmation - {course_name}

Invoice Number: {invoice_number}
Purchase Date: {issue_date}
Course: {course_name}

Items:
{self._format_items_text(items)}

{"Payment Breakdown:" if payment_breakdown else ""}
{self._format_payments_text(payment_breakdown) if payment_breakdown else ""}

Pricing:
  Base Price: Bs. {subtotal or "0.00"}
  IVA (16%):  Bs. {tax_total or "0.00"}
  Total Paid: Bs. {total}

✓ Your payment was successful!

Access Your Course:
You can now access your course materials from your dashboard.
Navigate to "My Courses" to start learning!

If you have any questions, please contact us at {settings.support_email}

Best regards,
The Codyn Academy Team
        """

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

    def _format_payments_text(self, payments: list[dict]) -> str:
        """Format payment breakdown as text."""
        lines = []
        for payment in payments:
            method = payment.get("method", "Unknown")
            amount = payment.get("amount", "0.00")
            reference = payment.get("reference", "")
            ref_display = f" ({reference})" if reference else ""
            lines.append(f"- {method}{ref_display}: Bs. {amount}")
        return "\n".join(lines)


# Singleton instance
_email_service = None


def get_email_service() -> EmailService:
    """Get or create email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
