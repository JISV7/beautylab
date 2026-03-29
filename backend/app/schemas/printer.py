"""Printer schemas."""

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from app.utils.rif import validate_rif


class PrinterBase(BaseModel):
    """Base schema for printer information."""

    business_name: str = Field(..., max_length=255, description="Printer business name")
    rif: str = Field(..., max_length=20, description="Tax identification number (RIF)")
    authorization_providence: str = Field(
        ..., max_length=255, description="Authorization providence number"
    )

    @field_validator("rif")
    @classmethod
    def validate_rif(cls, v: str) -> str:
        """Validate RIF format and check digit, return normalized format."""
        is_valid, error_msg, normalized_rif = validate_rif(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_rif


class PrinterCreate(PrinterBase):
    """Schema for creating printer."""

    pass


class PrinterUpdate(BaseModel):
    """Schema for updating printer."""

    business_name: str | None = Field(None, max_length=255)
    rif: str | None = Field(None, max_length=20)
    authorization_providence: str | None = Field(None, max_length=255)

    @field_validator("rif")
    @classmethod
    def validate_rif(cls, v: str | None) -> str | None:
        """Validate RIF format and check digit, return normalized format."""
        if v is None:
            return None
        is_valid, error_msg, normalized_rif = validate_rif(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_rif


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
