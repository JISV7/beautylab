"""Role schemas for request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RoleBase(BaseModel):
    """Base role schema."""

    name: str = Field(..., max_length=50)


class RoleCreate(BaseModel):
    """Schema for creating a role."""

    name: str = Field(..., max_length=50)


class RoleResponse(BaseModel):
    """Schema for role response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime


class RoleWithPermissions(RoleResponse):
    """Schema for role with permissions."""

    permissions: list[str] = []


class PermissionBase(BaseModel):
    """Base permission schema."""

    name: str = Field(..., max_length=50)
    resource: str = Field(..., max_length=50)


class PermissionCreate(BaseModel):
    """Schema for creating a permission."""

    name: str = Field(..., max_length=50)
    resource: str = Field(..., max_length=50)


class PermissionResponse(BaseModel):
    """Schema for permission response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    resource: str


class RolePermissionAssign(BaseModel):
    """Schema for assigning permissions to a role."""

    permission_ids: list[int]
