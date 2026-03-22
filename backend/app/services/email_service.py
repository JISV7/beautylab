"""Email service for sending notifications and invoices."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

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
        subject = f"Invoice {invoice_number} - BeautyLab"

        # Build items HTML
        items_html = ""
        for item in items:
            items_html += f"""
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item.get("description", "")}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">{item.get("quantity", 1)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.get("unit_price", "0.00")}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.get("line_total", "0.00")}</td>
            </tr>
            """

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
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .invoice-details {{ background-color: white; padding: 20px; margin: 20px 0; border-radius: 4px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background-color: #4CAF50; color: white; padding: 10px; text-align: left; }}
                .total {{ font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BeautyLab</h1>
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
                    
                    <p>Best regards,<br>The BeautyLab Team</p>
                </div>
                
                <div class="footer">
                    <p>&copy; 2026 BeautyLab. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Invoice {invoice_number}
        
        Issue Date: {issue_date}
        
        Items:
        {chr(10).join([f"- {item.get('description', '')} x{item.get('quantity', 1)}: ${item.get('line_total', '0.00')}" for item in items])}
        
        Total: ${total}
        
        Thank you for your purchase!
        
        Best regards,
        The BeautyLab Team
        """

        return self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email to new user."""
        subject = "Welcome to BeautyLab!"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .button {{ background-color: #4CAF50; color: white; padding: 14px 20px; 
                           text-decoration: none; border-radius: 4px; display: inline-block; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to BeautyLab!</h1>
                </div>
                
                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>Thank you for joining BeautyLab - your dynamic theming platform for beauty salons.</p>
                    <p>Get started by exploring our features:</p>
                    <ul>
                        <li>Create custom themes</li>
                        <li>Manage your profile</li>
                        <li>Purchase courses and learning paths</li>
                    </ul>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="https://beautylab.com/dashboard" class="button">Go to Dashboard</a>
                    </p>
                </div>
                
                <div class="footer">
                    <p>&copy; 2026 BeautyLab. All rights reserved.</p>
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


# Singleton instance
_email_service = None


def get_email_service() -> EmailService:
    """Get or create email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
