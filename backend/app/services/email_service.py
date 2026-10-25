"""Email service for sending notifications and invoices."""

import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

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
        self.from_name = settings.from_name

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
        msg["From"] = f"{self.from_name} <{self.from_email}>"
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
        """Send invoice email with full invoice detail matching web view."""
        # Set up Jinja2 template environment
        _template_dir = Path(__file__).parent.parent / "templates"
        _env = Environment(loader=FileSystemLoader(_template_dir))

        # Custom filters
        def _fmt_money(value: str | float) -> str:
            fval = float(value) if isinstance(value, str) else value
            return f"{fval:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        def _fmt_date_ddmmyyyy(d: str) -> str:
            try:
                from datetime import datetime

                dt = datetime.fromisoformat(d)
                return f"{dt.day:02d}{dt.month:02d}{dt.year}"
            except Exception:
                return d

        def _fmt_time_hhmmss(t: str) -> str:
            if not t:
                return ""
            try:
                from datetime import datetime

                parsed = datetime.fromisoformat(t) if "T" in t else datetime.strptime(t, "%H:%M:%S")
                h = parsed.hour
                ampm = "p.m." if h >= 12 else "a.m."
                h = h % 12 or 12
                return f"{h:02d}.{parsed.minute:02d}.{parsed.second:02d} {ampm}"
            except Exception:
                return t

        def _fmt_date_display(d: str) -> str:
            try:
                from datetime import datetime

                dt = datetime.fromisoformat(d)
                return dt.strftime("%d/%m/%Y")
            except Exception:
                return d

        _env.filters["money"] = _fmt_money
        _env.filters["invoice_status"] = lambda s: {
            "issued": "Emitida",
            "paid": "Pagada",
            "partial": "Pago Parcial",
            "cancelled": "Cancelada",
        }.get(s, (s or "").capitalize())
        _env.filters["payment_status"] = lambda s: {
            "completed": "Completado",
        }.get(s, (s or "").capitalize())
        _env.filters["payment_method"] = lambda s: (s or "Pago").replace("_", " ")
        _env.filters["tax_rate"] = lambda r: f"{float(r):,.2f}%" if r else "16%"
        _env.filters["format_date_ddmmyyyy"] = _fmt_date_ddmmyyyy
        _env.filters["format_time_hhmmss"] = _fmt_time_hhmmss
        _env.filters["format_date_display"] = _fmt_date_display
        _env.filters["zfill"] = lambda s, n: str(s).zfill(n) if s else ""

        template = _env.get_template("email_invoice.html")

        # Normalize adjustments
        norm_adjustments = []
        if adjustments:
            for adj in adjustments:
                norm_adjustments.append(
                    {
                        "description": adj.get("description", ""),
                        "amount": adj.get("amount", "0"),
                        "adjustment_type": adj.get("adjustment_type", "other"),
                    }
                )

        # Normalize payments
        norm_payments = []
        if payments:
            for p in payments:
                norm_payments.append(
                    {
                        "method_type": p.get("method_type", "Pago"),
                        "amount": p.get("amount", "0"),
                        "status": p.get("status", ""),
                        "card_brand": p.get("card_brand"),
                        "card_number_last4": p.get("card_last4") or p.get("card_number_last4"),
                    }
                )

        # Normalize lines (items)
        norm_lines = []
        for item in items:
            norm_lines.append(
                {
                    "description": item.get("description", ""),
                    "quantity": item.get("quantity", 1),
                    "unit_price": item.get("unit_price", "0"),
                    "line_total": item.get("line_total", "0"),
                    "tax_rate": item.get("tax_rate"),
                    "is_exempt": item.get("is_exempt", False),
                }
            )

        # Client fallbacks
        display_client_name = client_name or "Cliente"
        display_client_doc = client_doc or "N/A"

        html_content = template.render(
            invoice_number=invoice_number,
            control_number=control_number or "N/A",
            status=status or "issued",
            issue_date=issue_date,
            issue_time=issue_time or "",
            company=company,
            client_name=display_client_name,
            client_doc=display_client_doc,
            client_fiscal_address=client_address,
            lines=norm_lines,
            adjustments=norm_adjustments,
            subtotal=float(subtotal) if subtotal else 0,
            tax_total=float(tax_total) if tax_total else 0,
            discount_total=float(discount_total) if discount_total else 0,
            total=float(total) if total else 0,
            payments=norm_payments,
            printer_info=printer_info,
            control_range=control_range,
            download_url=download_url,
            support_email=settings.support_email,
            current_year=datetime.now().year,
        )

        # Plain text version
        date_display = _fmt_date_display(issue_date) if issue_date else "N/A"
        status_display = {
            "issued": "Emitida",
            "paid": "Pagada",
            "partial": "Pago Parcial",
            "cancelled": "Cancelada",
        }.get(status, (status or "").capitalize())

        sub_text = f"Bs. {_fmt_money(subtotal)}" if subtotal else "N/A"
        tax_text = f"Bs. {_fmt_money(tax_total)}" if tax_total else "N/A"
        dl_text = f"Descargar PDF: {download_url}" if download_url else ""

        items_text = "\n".join(
            f"- {i.get('description', '')} x{i.get('quantity', 1)}: "
            f"Bs. {i.get('line_total', '0.00')}"
            for i in items
        )

        text_content = (
            f"Factura {invoice_number}\n"
            f"Fecha: {date_display}\n"
            f"N° Control: {control_number or 'N/A'}\n"
            f"Estado: {status_display}\n\n"
            f"Cliente: {display_client_name}\n"
            f"RIF/Cédula: {display_client_doc}\n\n"
            f"Detalle:\n{items_text}\n\n"
            f"Base Imponible: {sub_text}\n"
            f"IVA: {tax_text}\n"
            f"Total: Bs. {_fmt_money(total)}\n\n"
            f"{dl_text}\n\n"
            "Gracias por su compra.\n"
            f"Cursorg - {settings.support_email}"
        )

        co_name = (company or {}).get("business_name") or "Cursorg"
        subject = f"Factura {invoice_number} - {co_name}"

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
        if not lines:
            lines.append("- Sin conceptos registrados")
        return "\n".join(lines)

    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send the Cursorg welcome email to a new user."""
        subject = "Bienvenido a Cursorg"
        year = datetime.now().year

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Montserrat, Arial, Helvetica, sans-serif;
                        line-height: 1.6; color: #0D2B4D; background-color: #FBFBFE; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0D2B4D; color: #FFFFFF; padding: 28px 20px;
                           text-align: center; border-bottom: 4px solid #55C7E8; }}
                .header h1 {{ margin: 0; font-size: 26px; letter-spacing: 0.5px; }}
                .header p {{ margin: 8px 0 0; color: #D7EEF7; font-size: 13px; }}
                .content {{ padding: 24px; background-color: #F1F5F9; }}
                .content p {{ color: #334155; }}
                .content ul {{ color: #334155; padding-left: 20px; }}
                .content li {{ margin-bottom: 8px; }}
                .button {{ background-color: #1E5AA8; color: #FFFFFF !important;
                           padding: 14px 24px; text-decoration: none; border-radius: 6px;
                           display: inline-block; font-weight: 600; }}
                .footer {{ text-align: center; padding: 20px; color: #6E7882; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Bienvenido a Cursorg</h1>
                    <p>Plataforma de Capacitación Corporativa</p>
                </div>

                <div class="content">
                    <p>Hola {user_name},</p>
                    <p>Gracias por unirte a Cursorg, la plataforma de capacitación corporativa
                       diseñada para equipos y organizaciones en Latinoamérica.</p>
                    <p>Con Cursorg puedes:</p>
                    <ul>
                        <li>Acceder a programas de formación práctica para tu equipo.</li>
                        <li>Gestionar compras, pagos y facturas desde el panel.</li>
                        <li>Recibir acompañamiento en español de nuestro equipo de soporte.</li>
                        <li>Organizar el avance de tu equipo en rutas de aprendizaje.</li>
                    </ul>
                    <p>Nuestro lema: <strong>Capacitación corporativa sin barreras.</strong></p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{settings.website_url}/dashboard" class="button">
                            Explorar la plataforma
                        </a>
                    </p>
                </div>

                <div class="footer">
                    <p>&copy; {year} Cursorg. Todos los derechos reservados.</p>
                    <p>¿Necesitas ayuda? Escríbenos a {settings.support_email}.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
Bienvenido a Cursorg

Hola {user_name},

Gracias por unirte a Cursorg, la plataforma de capacitación corporativa
diseñada para equipos y organizaciones en Latinoamérica.

Con Cursorg puedes acceder a formación práctica para tu equipo, gestionar
compras, pagos y facturas, recibir acompañamiento en español y organizar el
avance de tu equipo en rutas de aprendizaje.

Capacitación corporativa sin barreras.

Explora la plataforma: {settings.website_url}/dashboard

© {year} Cursorg. Todos los derechos reservados.
¿Necesitas ayuda? Escríbenos a {settings.support_email}.
        """

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
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
        Send a Spanish purchase confirmation email with payment details.

        Args:
            to_email: Customer email
            invoice_number: Invoice number
            course_name: Name of purchased course
            total: Total amount paid
            issue_date: Purchase date
            items: List of line items
            payment_breakdown: List of payment methods used (for split payments)
            subtotal: Subtotal before tax
            tax_total: Tax amount
        """
        subject = f"Confirmación de compra - {course_name} - Cursorg"
        year = datetime.now().year

        # Build items HTML
        items_html = ""
        for item in items:
            desc = item.get("description", "")
            qty = item.get("quantity", 1)
            price = item.get("unit_price", "0.00")
            line_total = item.get("line_total", "0.00")
            items_html += (
                f"<tr>"
                f'<td style="padding: 8px; border-bottom: 1px solid #D9E2EC;">{desc}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #D9E2EC; '
                f'text-align: center;">{qty}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #D9E2EC; '
                f'text-align: right;">Bs. {price}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #D9E2EC; '
                f'text-align: right;">Bs. {line_total}</td>'
                f"</tr>"
            )

        # Build payment breakdown HTML
        payment_html = ""
        if payment_breakdown:
            payment_html = """
            <div style="margin-top: 20px;">
                <h3 style="color: #0D2B4D; font-size: 16px; margin-bottom: 10px;">
                    Desglose de pagos
                </h3>
                <table style="width: 100%; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="background-color: #1E5AA8;
                                color: #FFFFFF; padding: 8px; text-align: left;">Método</th>
                            <th style="background-color: #1E5AA8;
                                color: #FFFFFF; padding: 8px; text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            for payment in payment_breakdown:
                method = payment.get("method", "No especificado")
                amount = payment.get("amount", "0.00")
                reference = payment.get("reference", "")
                ref_display = f" ({reference})" if reference else ""
                payment_html += (
                    f"<tr>"
                    f'<td style="padding: 8px; border-bottom: 1px solid #D9E2EC;">'
                    f"{method}{ref_display}</td>"
                    f'<td style="padding: 8px; border-bottom: 1px solid #D9E2EC; '
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
                body {{ font-family: Montserrat, Arial, Helvetica, sans-serif;
                        line-height: 1.6; color: #0D2B4D; background-color: #FBFBFE; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0D2B4D; color: #FFFFFF; padding: 24px;
                           text-align: center; border-bottom: 4px solid #55C7E8; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .header p {{ margin: 6px 0 0; color: #D7EEF7; font-size: 13px; }}
                .content {{ padding: 20px; background-color: #F1F5F9; }}
                .invoice-details {{ background-color: #FFFFFF; padding: 20px; margin: 20px 0;
                                   border-radius: 6px; border: 1px solid #D9E2EC; }}
                .success-banner {{ background-color: #E6F7FC; border: 1px solid #55C7E8;
                                   color: #0D2B4D; padding: 15px; border-radius: 6px;
                                   margin: 20px 0; text-align: center; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background-color: #1E5AA8; color: #FFFFFF; padding: 10px;
                      text-align: left; }}
                .total {{ font-size: 18px; font-weight: bold; text-align: right;
                         margin-top: 20px; padding-top: 10px;
                         border-top: 2px solid #1E5AA8; color: #0D2B4D; }}
                .footer {{ text-align: center; padding: 20px; color: #6E7882;
                           font-size: 12px; }}
                .access-info {{ background-color: #F1F5F9; border: 1px solid #55C7E8;
                               color: #0D2B4D; padding: 15px; border-radius: 6px;
                               margin: 20px 0; }}
                .access-info h3 {{ margin-top: 0; color: #0D2B4D; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Cursorg</h1>
                    <p>Confirmación de compra</p>
                </div>

                <div class="content">
                    <div class="success-banner">
                        <strong>✓ ¡Pago exitoso!</strong><br>
                        Tu compra ha sido confirmada.
                    </div>

                    <p>Estimado(a) cliente,</p>
                    <p>Gracias por tu compra. Tu inscripción ha sido confirmada.</p>

                    <div class="invoice-details">
                        <p><strong>N° de factura:</strong> {invoice_number}</p>
                        <p><strong>Fecha de compra:</strong> {issue_date}</p>
                        <p><strong>Curso:</strong> {course_name}</p>

                        <table>
                            <thead>
                                <tr>
                                    <th>Descripción</th>
                                    <th style="text-align: center;">Cant.</th>
                                    <th style="text-align: right;">Precio</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items_html}
                            </tbody>
                        </table>

                        {payment_html}

                        <div style="margin-top: 20px;
                            padding-top: 10px; border-top: 1px solid #D9E2EC;">
                            <div style="display: flex;
                                justify-content: space-between; padding: 5px 0;">
                                <span>Subtotal:</span>
                                <span>Bs. {subtotal or "0.00"}</span>
                            </div>
                            <div style="display: flex;
                                justify-content: space-between; padding: 5px 0;">
                                <span>Impuestos:</span>
                                <span>Bs. {tax_total or "0.00"}</span>
                            </div>
                            <div class="total">
                                Total pagado: Bs. {total}
                            </div>
                        </div>
                    </div>

                    <div class="access-info">
                        <h3>📚 Accede a tu curso</h3>
                        <p>Ya puedes acceder a los materiales del curso desde tu panel:</p>
                        <p style="text-align: center; margin: 15px 0;">
                            <a href="{settings.website_url}/dashboard"
                               style="background-color: #1E5AA8; color: #FFFFFF;
                                      padding: 12px 24px; text-decoration: none;
                                      border-radius: 6px; display: inline-block;
                                      font-weight: 600;">
                                Ir al panel
                            </a>
                        </p>
                        <p style="font-size: 14px; margin-top: 10px;">
                            Ve a "Mis cursos" para comenzar.
                        </p>
                    </div>

                    <p>Si tienes preguntas o necesitas asistencia,
                       escríbenos a {settings.support_email}.</p>

                    <p>Saludos cordiales,<br><strong>El equipo de Cursorg</strong></p>
                </div>

                <div class="footer">
                    <p>&copy; {year} Cursorg. Todos los derechos reservados.</p>
                    <p>¿Necesitas ayuda? Escríbenos a {settings.support_email}</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
Confirmación de compra - {course_name}

N° de factura: {invoice_number}
Fecha de compra: {issue_date}
Curso: {course_name}

Detalle:
{self._format_items_text(items)}

{"Desglose de pagos:" if payment_breakdown else ""}
{self._format_payments_text(payment_breakdown) if payment_breakdown else ""}

Resumen:
  Subtotal: Bs. {subtotal or "0.00"}
  Impuestos: Bs. {tax_total or "0.00"}
  Total pagado: Bs. {total}

✓ ¡Tu pago fue exitoso!

Accede a tu curso:
Ya puedes acceder a los materiales del curso desde tu panel.
Ve a "Mis cursos" para comenzar.

Si tienes preguntas, escríbenos a {settings.support_email}.

Saludos cordiales,
El equipo de Cursorg
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
            method = payment.get("method", "No especificado")
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
