"""Company Info schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from app.utils.phone import validate_phone
from app.utils.rif import validate_rif


class CompanyInfoBase(BaseModel):
    """Base schema for company information."""

    business_name: str = Field(..., max_length=255, description="Company business name")
    rif: str = Field(..., max_length=20, description="Tax identification number (RIF)")
    fiscal_address: str = Field(..., max_length=500, description="Fiscal address")
    phone: str | None = Field(None, max_length=20, description="Phone number")
    email: str | None = Field(None, max_length=255, description="Email address")
    logo_url: str | None = Field(None, max_length=255, description="Logo URL")

    @field_validator("rif")
    @classmethod
    def validate_rif(cls, v: str) -> str:
        """Validate RIF format and check digit, return normalized format."""
        is_valid, error_msg, normalized_rif = validate_rif(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_rif

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Validate phone number format, return normalized format."""
        if v is None or v == "":
            return None
        is_valid, error_msg, normalized_phone = validate_phone(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_phone


class CompanyInfoCreate(CompanyInfoBase):
    """Schema for creating company info."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class CompanyInfoUpdate(BaseModel):
    """Schema for updating company info."""

    business_name: str | None = Field(None, max_length=255)
    rif: str | None = Field(None, max_length=20)
    fiscal_address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    logo_url: str | None = Field(None, max_length=255)

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

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

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Validate phone number format, return normalized format."""
        if v is None or v == "":
            return None
        is_valid, error_msg, normalized_phone = validate_phone(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_phone


class CompanyInfoResponse(BaseModel):
    """Schema for company info response."""

    id: int
    business_name: str
    rif: str
    fiscal_address: str
    phone: str | None = None
    email: str | None = None
    logo_url: str | None = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    @field_validator("rif", mode="before")
    @classmethod
    def skip_rif_validation_for_response(cls, v):
        """Skip RIF validation for responses (data already in DB)."""
        return v

    @field_validator("phone", mode="before")
    @classmethod
    def skip_phone_validation_for_response(cls, v):
        """Skip phone validation for responses (data already in DB)."""
        return v
