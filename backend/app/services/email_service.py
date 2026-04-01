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
    ) -> bool:
        """
        Send invoice email.

        Args:
            to_email: Customer email
            invoice_number: Invoice number
            total: Total amount
            issue_date: Issue date
            items: List of line items
            download_url: Optional PDF download URL
        """
        subject = f"Invoice {invoice_number} - Codyn Academy"

        # Build items HTML
        items_html = ""
        for item in items:
            desc = item.get("description", "")
            qty = item.get("quantity", 1)
            price = item.get("unit_price", "0.00")
            total = item.get("line_total", "0.00")
            items_html += (
                f"<tr>"
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd;">{desc}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: center;">{qty}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: right;">${price}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: right;">${total}</td>'
                f"</tr>"
            )

        download_button = ""
        if download_url:
            download_button = f"""
            <div style="margin-top: 30px; text-align: center;">
                <a href="{download_url}"
                   style="background-color: #4CAF50; color: white; padding: 14px 20px;
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                    Download PDF Invoice
                </a>
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
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background-color: #4CAF50; color: white; padding: 10px; text-align: left; }}
                .total {{ font-size: 18px; font-weight: bold; text-align: right;
                         margin-top: 20px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Codyn Academy</h1>
                    <p>Invoice {invoice_number}</p>
                </div>

                <div class="content">
                    <p>Dear Customer,</p>
                    <p>Thank you for your purchase! Please find your invoice details below.</p>

                    <div class="invoice-details">
                        <p><strong>Invoice Number:</strong> {invoice_number}</p>
                        <p><strong>Issue Date:</strong> {issue_date}</p>

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

                        <div class="total">
                            Total: ${total}
                        </div>
                    </div>

                    {download_button}

                    <p>If you have any questions, please don't hesitate to contact us.</p>

                    <p>Best regards,<br>The Codyn Academy Team</p>
                </div>

                <div class="footer">
                    <p>&copy; 2026 Codyn Academy. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Invoice {invoice_number}

        Issue Date: {issue_date}

        Items:
        {self._format_items_text(items)}

        Total: ${total}

        Thank you for your purchase!

        Best regards,
        The Codyn Academy Team
        """

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
            lines.append(f"- {desc} x{qty}: ${total}")
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
                f'text-align: right;">${price}</td>'
                f'<td style="padding: 8px; border-bottom: 1px solid #ddd; '
                f'text-align: right;">${line_total}</td>'
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
                    f'text-align: right;">${amount}</td>'
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

                        <div class="total">
                            Total Paid: ${total}
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

        Total Paid: ${total}

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
            lines.append(f"- {method}{ref_display}: ${amount}")
        return "\n".join(lines)


# Singleton instance
_email_service = None


def get_email_service() -> EmailService:
    """Get or create email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
