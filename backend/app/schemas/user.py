"""User schemas for request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    preferred_theme_id: Optional[UUID] = None


class UserUpdateAdmin(BaseModel):
    """Schema for admin updating user."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    preferred_theme_id: Optional[UUID] = None


class UserResponse(BaseModel):
    """Schema for user response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    preferred_theme_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class UserInDB(UserResponse):
    """Schema for user with password hash (internal use)."""

    password_hash: str


class UserWithRoles(UserResponse):
    """Schema for user with roles."""

    roles: list[str] = []
