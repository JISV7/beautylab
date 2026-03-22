"""Cart item schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CartItemBase(BaseModel):
    """Base cart item schema."""

    product_id: UUID
    quantity: int = Field(default=1, ge=1, description="Quantity (supports bulk purchases)")


class CartItemCreate(CartItemBase):
    """Schema for adding item to cart."""

    pass


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity."""

    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    """Schema for cart item response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    product_id: UUID
    quantity: int
    created_at: datetime
    updated_at: datetime
    # Product info
    product_name: str | None = None
    product_price: Decimal | None = None
    product_sku: str | None = None


class CartResponse(BaseModel):
    """Schema for full cart response."""

    items: list[CartItemResponse]
    total_items: int
    subtotal: Decimal
    tax_total: Decimal
    total: Decimal


class CheckoutRequest(BaseModel):
    """Schema for checkout request."""

    license_type: str = Field(default="gift", description="gift or corporate")
    payment_method: str = Field(default="split", description="single or split")


class CheckoutResponse(BaseModel):
    """Schema for checkout response."""

    invoice_id: UUID
    licenses: list[UUID]
    message: str
