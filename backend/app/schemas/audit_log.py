"""Audit log schemas."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    """Base audit log schema."""

    action: str
    resource_type: str
    resource_id: UUID | None = None
    changes: dict[str, Any] | None = None
    ip_address: str | None = None


class AuditLogCreate(AuditLogBase):
    """Schema for creating an audit log entry."""

    user_id: UUID | None = None


class AuditLogResponse(BaseModel):
    """Schema for audit log response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID | None = None
    action: str
    resource_type: str
    resource_id: UUID | None = None
    changes: dict[str, Any] | None = None
    ip_address: str | None = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log list response."""

    logs: list[AuditLogResponse]
    total: int
    page: int = 1
    page_size: int = 10
