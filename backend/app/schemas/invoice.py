"""Invoice schemas for request/response validation."""

from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.payment import PaymentResponse


class CompanyInfoResponse(BaseModel):
    """Schema for company info response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_name: str
    rif: str
    fiscal_address: str | None = None
    email: str | None = None
    phone: str | None = None


class InvoiceLineBase(BaseModel):
    """Base invoice line schema."""

    product_id: UUID | None = Field(None, description="Product ID (optional for custom items)")
    description: str = Field(..., max_length=500, description="Line item description")
    quantity: Decimal = Field(..., ge=0, description="Quantity")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    tax_rate: Decimal = Field(default=Decimal("16.00"), ge=0, le=100, description="Tax rate %")
    is_exempt: bool = Field(default=False, description="Whether item is tax-exempt")


class InvoiceLineCreate(InvoiceLineBase):
    """Schema for creating an invoice line."""

    pass


class InvoiceLineResponse(BaseModel):
    """Schema for invoice line response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: UUID
    product_id: UUID | None = None
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount: Decimal
    line_total: Decimal
    is_exempt: bool
    created_at: datetime


class InvoiceAdjustmentBase(BaseModel):
    """Base invoice adjustment schema."""

    adjustment_type: Literal["discount", "bonus", "surcharge"]
    description: str
    amount: Decimal = Field(..., ge=0)
    is_percentage: bool = Field(default=False)


class InvoiceAdjustmentCreate(InvoiceAdjustmentBase):
    """Schema for creating an invoice adjustment."""

    pass


class InvoiceAdjustmentResponse(BaseModel):
    """Schema for invoice adjustment response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: UUID
    adjustment_type: str
    description: str
    amount: Decimal
    is_percentage: bool
    created_at: datetime


class InvoiceBase(BaseModel):
    """Base invoice schema."""

    client_id: UUID | None = Field(None, description="Client user ID")
    client_rif: str | None = Field(None, max_length=20)
    client_business_name: str | None = Field(None, max_length=255)
    client_document_type: str | None = Field(None, max_length=10)
    client_document_number: str | None = Field(None, max_length=20)
    client_fiscal_address: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, description="Invoice notes")


class InvoiceCreate(InvoiceBase):
    """Schema for creating an invoice."""

    lines: list[InvoiceLineCreate] = Field(..., min_length=1)
    adjustments: list[InvoiceAdjustmentCreate] = Field(default=[])


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice."""

    notes: str | None = None
    status: str | None = None


class InvoiceResponse(BaseModel):
    """Schema for invoice response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    invoice_number: str
    control_number: str
    issue_date: date
    issue_time: time
    client_id: UUID | None = None
    client_rif: str | None = None
    client_business_name: str | None = None
    client_document_type: str | None = None
    client_document_number: str | None = None
    client_fiscal_address: str | None = None
    company_info_id: int | None = None
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    total: Decimal
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class InvoiceWithDetails(InvoiceResponse):
    """Invoice with lines, adjustments, payments, and company info."""

    lines: list[InvoiceLineResponse] = []
    adjustments: list[InvoiceAdjustmentResponse] = []
    payments: list[PaymentResponse] = []
    company: CompanyInfoResponse | None = None


class InvoiceListResponse(BaseModel):
    """Schema for invoice list response."""

    invoices: list[InvoiceResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class InvoiceTotals(BaseModel):
    """Schema for invoice totals calculation."""

    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    total: Decimal
