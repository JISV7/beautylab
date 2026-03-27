"""User schemas for request/response validation."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.utils.rif import validate_rif


class UserFiscalMixin(BaseModel):
    """Mixin for fiscal information fields."""

    rif: str | None = Field(None, max_length=20)
    document_type: str | None = Field(None, max_length=10)
    document_number: str | None = Field(None, max_length=20)
    business_name: str | None = Field(None, max_length=255)
    fiscal_address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=20)
    is_contributor: bool | None = None


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    full_name: str | None = Field(None, max_length=100)


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str | None = Field(None, max_length=100)
    # Fiscal fields for Venezuelan compliance
    document_type: str = Field(..., max_length=10, description="Document type: V, E, J, P")
    document_number: str = Field(..., max_length=20, description="ID card, passport, or RIF number")
    rif: str = Field(..., max_length=20, description="Tax Information Registry (RIF)")
    business_name: str | None = Field(
        None, max_length=255, description="Business name for legal entities"
    )
    fiscal_address: str = Field(..., max_length=500, description="Fiscal address for invoices")
    phone: str = Field(..., max_length=20, description="Contact phone number")
    is_contributor: bool = Field(
        default=False, description="Indicates if client requires invoice with RIF"
    )

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, v: str) -> str:
        """Validate document type is one of the allowed values."""
        valid_types = ["V", "E", "J", "P", "G"]
        v_upper = v.upper().strip()
        if v_upper not in valid_types:
            raise ValueError(f"Document type must be one of: {', '.join(valid_types)}")
        return v_upper

    @field_validator("rif")
    @classmethod
    def validate_rif(cls, v: str) -> str:
        """Validate RIF format and check digit."""
        is_valid, error_msg = validate_rif(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v.upper().strip()


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=100)
    preferred_theme_id: UUID | None = None


class UserUpdateFiscal(UserFiscalMixin):
    """Schema for updating user fiscal information."""

    pass


class UserUpdateAdmin(BaseModel):
    """Schema for admin updating user."""

    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=100)
    is_active: bool | None = None
    is_verified: bool | None = None
    preferred_theme_id: UUID | None = None


class UserResponse(BaseModel):
    """Schema for user response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    is_verified: bool
    preferred_theme_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    # Fiscal fields
    rif: str | None = None
    document_type: str | None = None
    document_number: str | None = None
    business_name: str | None = None
    fiscal_address: str | None = None
    phone: str | None = None
    is_contributor: bool = False


class UserInDB(UserResponse):
    """Schema for user with password hash (internal use)."""

    password_hash: str


class UserWithRoles(UserResponse):
    """Schema for user with roles."""

    roles: list[str] = []


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""

    model_config = ConfigDict(from_attributes=True)

    users: list[UserWithRoles]
    total: int
    skip: int
    limit: int


class UserStats(BaseModel):
    """Schema for user statistics."""

    total_users: int
    active_users: int
    inactive_users: int
    verified_users: int
    contributor_users: int
