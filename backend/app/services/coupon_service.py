"""Coupon service for discount code management."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coupon import Coupon, CouponUsage
from app.models.invoice import Invoice
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponValidateRequest


class CouponNotFoundError(ValueError):
    """Raised when a coupon is not found."""

    pass


class CouponInvalidError(ValueError):
    """Raised when a coupon is invalid (expired, inactive, etc.)."""

    pass


class CouponMaxUsesError(ValueError):
    """Raised when coupon has reached maximum uses."""

    pass


class CouponMinPurchaseError(ValueError):
    """Raised when cart total doesn't meet minimum purchase requirement."""

    pass


class CouponAlreadyUsedError(ValueError):
    """Raised when user has already used a one-time coupon."""

    pass


class CouponService:
    """Service for coupon management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_coupon_by_id(self, coupon_id: UUID) -> Coupon | None:
        """Get coupon by ID."""
        result = await self.db.execute(select(Coupon).where(Coupon.id == coupon_id))
        return result.scalar_one_or_none()

    async def get_coupon_by_code(self, code: str) -> Coupon | None:
        """Get coupon by code."""
        result = await self.db.execute(select(Coupon).where(Coupon.code == code.upper()))
        return result.scalar_one_or_none()

    async def validate_coupon(
        self,
        request: CouponValidateRequest,
        user_id: UUID | None = None,
    ) -> dict:
        """
        Validate a coupon code for use.

        Args:
            request: Validation request with code and cart_total
            user_id: Optional user ID to check usage limits

        Returns:
            dict with valid, coupon, discount_amount, message, final_total

        Raises:
            CouponNotFoundError: If coupon doesn't exist
            CouponInvalidError: If coupon is inactive or expired
            CouponMaxUsesError: If coupon has reached max uses
            CouponMinPurchaseError: If cart total is below minimum
            CouponAlreadyUsedError: If user already used this coupon
        """
        code = request.code.upper()
        cart_total = request.cart_total

        # Get coupon
        coupon = await self.get_coupon_by_code(code)
        if not coupon:
            raise CouponNotFoundError(f"Coupon '{code}' not found")

        # Check if active
        if not coupon.is_active:
            raise CouponInvalidError("Coupon is no longer active")

        # Check expiration
        if coupon.expires_at and coupon.expires_at < datetime.now():
            raise CouponInvalidError("Coupon has expired")

        # Check max uses
        if coupon.max_uses and coupon.used_count >= coupon.max_uses:
            raise CouponMaxUsesError("Coupon has reached maximum uses")

        # Check minimum purchase
        if cart_total < coupon.min_purchase:
            raise CouponMinPurchaseError(f"Minimum purchase of ${coupon.min_purchase} required")

        # Check if user already used this coupon (if user_id provided)
        if user_id:
            usage = await self.db.execute(
                select(CouponUsage)
                .where(CouponUsage.coupon_id == coupon.id)
                .where(CouponUsage.user_id == user_id)
            )
            if usage.scalar_one_or_none():
                raise CouponAlreadyUsedError("You have already used this coupon")

        # Calculate discount
        discount_amount = await self.calculate_discount(coupon, cart_total)
        final_total = cart_total - discount_amount

        return {
            "valid": True,
            "coupon": coupon,
            "discount_amount": discount_amount,
            "message": "Coupon is valid",
            "final_total": final_total,
        }

    async def calculate_discount(
        self,
        coupon: Coupon,
        cart_total: Decimal,
    ) -> Decimal:
        """Calculate discount amount based on coupon type."""
        if coupon.discount_type == "percentage":
            discount = cart_total * (coupon.discount_value / Decimal("100"))
        else:  # fixed
            discount = coupon.discount_value

        # Ensure discount doesn't exceed cart total
        return min(discount, cart_total)

    async def create_coupon(self, coupon_data: CouponCreate) -> Coupon:
        """Create a new coupon."""
        # Check if code already exists
        existing = await self.get_coupon_by_code(coupon_data.code)
        if existing:
            raise ValueError(f"Coupon code '{coupon_data.code}' already exists")

        coupon = Coupon(
            code=coupon_data.code.upper(),
            discount_type=coupon_data.discount_type,
            discount_value=coupon_data.discount_value,
            min_purchase=coupon_data.min_purchase,
            max_uses=coupon_data.max_uses,
            expires_at=coupon_data.expires_at,
            is_active=coupon_data.is_active,
        )

        self.db.add(coupon)
        await self.db.commit()
        await self.db.refresh(coupon)
        return coupon

    async def update_coupon(
        self,
        coupon_id: UUID,
        coupon_data: CouponUpdate,
    ) -> Coupon:
        """Update an existing coupon."""
        coupon = await self.get_coupon_by_id(coupon_id)
        if not coupon:
            raise CouponNotFoundError(f"Coupon {coupon_id} not found")

        if coupon_data.discount_value is not None:
            coupon.discount_value = coupon_data.discount_value
        if coupon_data.min_purchase is not None:
            coupon.min_purchase = coupon_data.min_purchase
        if coupon_data.max_uses is not None:
            coupon.max_uses = coupon_data.max_uses
        if coupon_data.expires_at is not None:
            coupon.expires_at = coupon_data.expires_at
        if coupon_data.is_active is not None:
            coupon.is_active = coupon_data.is_active

        await self.db.commit()
        await self.db.refresh(coupon)
        return coupon

    async def apply_coupon(
        self,
        coupon_id: UUID,
        user_id: UUID,
        invoice_id: UUID,
    ) -> CouponUsage:
        """
        Mark a coupon as used by a user for an invoice.

        This should be called after successful checkout.
        """
        coupon = await self.get_coupon_by_id(coupon_id)
        if not coupon:
            raise CouponNotFoundError(f"Coupon {coupon_id} not found")

        # Verify invoice exists
        invoice_result = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        if not invoice_result.scalar_one_or_none():
            raise ValueError(f"Invoice {invoice_id} not found")

        # Create usage record
        usage = CouponUsage(
            coupon_id=coupon_id,
            user_id=user_id,
            invoice_id=invoice_id,
        )
        self.db.add(usage)

        # Increment used_count
        coupon.used_count += 1

        await self.db.commit()
        await self.db.refresh(usage)
        return usage

    async def get_all_coupons(
        self,
        page: int = 1,
        page_size: int = 10,
        is_active: bool | None = None,
    ) -> tuple[list[Coupon], int]:
        """Get all coupons with pagination."""
        query = select(Coupon)

        if is_active is not None:
            query = query.where(Coupon.is_active == is_active)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Coupon.created_at.desc())

        result = await self.db.execute(query)
        coupons = list(result.scalars().all())

        return coupons, total

    async def get_user_coupon_usage(
        self,
        user_id: UUID,
    ) -> list[CouponUsage]:
        """Get all coupons used by a user."""
        result = await self.db.execute(select(CouponUsage).where(CouponUsage.user_id == user_id))
        return list(result.scalars().all())

    async def delete_coupon(self, coupon_id: UUID) -> bool:
        """Delete a coupon (soft delete by deactivating)."""
        coupon = await self.get_coupon_by_id(coupon_id)
        if not coupon:
            raise CouponNotFoundError(f"Coupon {coupon_id} not found")

        coupon.is_active = False
        await self.db.commit()
        return True
