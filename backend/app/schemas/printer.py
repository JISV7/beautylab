"""Printer schemas."""

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class PrinterBase(BaseModel):
    """Base schema for printer information."""

    business_name: str = Field(..., max_length=255, description="Printer business name")
    rif: str = Field(..., max_length=20, description="Tax identification number (RIF)")
    authorization_providence: str = Field(
        ..., max_length=255, description="Authorization providence number"
    )


class PrinterCreate(PrinterBase):
    """Schema for creating printer."""

    pass


class PrinterUpdate(BaseModel):
    """Schema for updating printer."""

    business_name: str | None = Field(None, max_length=255)
    rif: str | None = Field(None, max_length=20)
    authorization_providence: str | None = Field(None, max_length=255)


class PrinterResponse(PrinterBase):
    """Schema for printer response."""

    id: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )
