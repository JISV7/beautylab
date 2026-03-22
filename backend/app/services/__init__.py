"""Business logic services."""

from app.services.auth_service import AuthService
from app.services.cart_service import CartService
from app.services.catalog_service import CatalogService
from app.services.coupon_service import CouponService
from app.services.email_service import EmailService, get_email_service
from app.services.enrollment_service import EnrollmentService
from app.services.invoice_service import InvoiceService
from app.services.license_service import LicenseService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService
from app.services.user_service import UserService

__all__ = [
    "AuthService",
    "UserService",
    "ProductService",
    "CatalogService",
    "LicenseService",
    "PaymentService",
    "InvoiceService",
    "CartService",
    "EnrollmentService",
    "CouponService",
    "EmailService",
    "get_email_service",
]
