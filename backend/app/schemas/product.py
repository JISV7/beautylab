"""Product schemas for request/response validation."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    """Base product schema with common fields."""

    name: str = Field(..., max_length=255, description="Product name")
    description: str | None = Field(None, description="Product description")
    sku: str = Field(..., max_length=100, description="Stock Keeping Unit (unique identifier)")
    price: Decimal = Field(..., ge=0, description="Product price")
    tax_rate: Decimal = Field(
        default=Decimal("16.00"),
        ge=0,
        le=100,
        description="Tax rate percentage (default 16% for Venezuela)",
    )
    tax_type: Literal["gravado", "exento", "exonerado"] = Field(
        default="gravado",
        description="Tax type: gravado (with IVA), exento (without IVA), exonerado (exempt)",
    )
    is_active: bool = Field(default=True, description="Whether product is active")

    @field_validator("price", "tax_rate", mode="before")
    @classmethod
    def convert_to_decimal(cls, v):
        """Convert string or float to Decimal."""
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        return v


class ProductCreate(ProductBase):
    """Schema for creating a product."""

    pass


class ProductUpdate(BaseModel):
    """Schema for updating a product."""

    name: str | None = Field(None, max_length=255)
    description: str | None = None
    sku: str | None = Field(None, max_length=100)
    price: Decimal | None = Field(None, ge=0)
    tax_rate: Decimal | None = Field(None, ge=0, le=100)
    tax_type: Literal["gravado", "exento", "exonerado"] | None = None
    is_active: bool | None = None

    @field_validator("price", "tax_rate", mode="before")
    @classmethod
    def convert_to_decimal(cls, v):
        """Convert string or float to Decimal."""
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        return v


class ProductResponse(BaseModel):
    """Schema for product response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    sku: str
    price: Decimal
    tax_rate: Decimal
    tax_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Frontend-only badge (calculated from created_at or sales)
    badge: str | None = None  # "new", "hot", or None


class ProductWithDetails(ProductResponse):
    """Schema for product with associated course or learning path info."""

    course_title: str | None = None
    learning_path_title: str | None = None


class ProductListResponse(BaseModel):
    """Schema for paginated product list response."""

    products: list[ProductResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class ProductStats(BaseModel):
    """Schema for product statistics."""

    total_products: int
    active_products: int
    inactive_products: int
    total_value: Decimal = Field(default=Decimal("0.00"), description="Total value of all products")
