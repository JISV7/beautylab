"""Company Info schemas."""

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CompanyInfoBase(BaseModel):
    """Base schema for company information."""

    business_name: str = Field(..., max_length=255, description="Company business name")
    rif: str = Field(..., max_length=20, description="Tax identification number (RIF)")
    fiscal_address: str = Field(..., max_length=500, description="Fiscal address")
    phone: str | None = Field(None, max_length=20, description="Phone number")
    email: str | None = Field(None, max_length=255, description="Email address")
    logo_url: str | None = Field(None, max_length=255, description="Logo URL")


class CompanyInfoCreate(CompanyInfoBase):
    """Schema for creating company info."""

    pass


class CompanyInfoUpdate(BaseModel):
    """Schema for updating company info."""

    business_name: str | None = Field(None, max_length=255)
    rif: str | None = Field(None, max_length=20)
    fiscal_address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    logo_url: str | None = Field(None, max_length=255)


class CompanyInfoResponse(CompanyInfoBase):
    """Schema for company info response."""

    id: int
    created_at: str
    updated_at: str

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )
