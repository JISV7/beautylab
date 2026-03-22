"""Coupon schemas for discount codes."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CouponBase(BaseModel):
    """Base coupon schema."""

    code: str = Field(..., min_length=3, max_length=50, description="Coupon code")
    discount_type: Literal["percentage", "fixed"] = Field(
        ..., description="Discount type: percentage or fixed amount"
    )
    discount_value: Decimal = Field(..., gt=0, description="Discount value")
    min_purchase: Decimal = Field(
        default=Decimal("0.00"), ge=0, description="Minimum purchase required"
    )
    max_uses: int | None = Field(None, ge=1, description="Maximum uses (NULL = unlimited)")
    expires_at: datetime | None = Field(None, description="Expiration date")
    is_active: bool = Field(default=True, description="Whether coupon is active")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Validate coupon code format."""
        if not v.replace("-", "_").isalnum():
            raise ValueError(
                "Code must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v.upper()


class CouponCreate(CouponBase):
    """Schema for creating a coupon."""

    pass


class CouponUpdate(BaseModel):
    """Schema for updating a coupon."""

    discount_value: Decimal | None = Field(None, gt=0)
    min_purchase: Decimal | None = Field(None, ge=0)
    max_uses: int | None = Field(None, ge=1)
    expires_at: datetime | None = None
    is_active: bool | None = None


class CouponResponse(BaseModel):
    """Schema for coupon response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    discount_type: str
    discount_value: Decimal
    min_purchase: Decimal
    max_uses: int | None = None
    used_count: int
    expires_at: datetime | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CouponValidateRequest(BaseModel):
    """Request to validate a coupon code."""

    code: str
    cart_total: Decimal = Field(..., gt=0, description="Current cart total")


class CouponValidateResponse(BaseModel):
    """Response from coupon validation."""

    valid: bool
    coupon: CouponResponse | None = None
    discount_amount: Decimal = Decimal("0.00")
    message: str
    final_total: Decimal | None = None


class CouponListResponse(BaseModel):
    """Schema for coupon list response."""

    coupons: list[CouponResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class CouponUsageResponse(BaseModel):
    """Schema for coupon usage response."""

    coupon_id: UUID
    coupon_code: str
    invoice_id: UUID
    used_at: datetime
