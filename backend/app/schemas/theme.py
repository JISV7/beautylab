"""Theme schemas for request/response validation."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ThemeConfigBase(BaseModel):
    """Base theme configuration schema."""

    light: Optional[dict[str, Any]] = None
    dark: Optional[dict[str, Any]] = None
    components: Optional[dict[str, Any]] = None


class ThemeBase(BaseModel):
    """Base theme schema."""

    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    type: str = Field(default="custom", pattern="^(preset|custom)$")
    config: dict[str, Any]
    is_active: bool = False
    is_default: bool = False


class ThemeCreate(BaseModel):
    """Schema for creating a theme."""

    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    type: str = Field(default="custom", pattern="^(preset|custom)$")
    config: dict[str, Any]
    is_active: bool = False
    is_default: bool = False


class ThemeUpdate(BaseModel):
    """Schema for updating a theme."""

    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    config: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class ThemeResponse(BaseModel):
    """Schema for theme response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    type: str
    config: dict[str, Any]
    is_active: bool
    is_default: bool
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class ThemeListResponse(BaseModel):
    """Schema for paginated theme list response."""

    themes: list[ThemeResponse]
    total: int
    page: int = 1
    page_size: int = 10
