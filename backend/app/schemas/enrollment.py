"""Enrollment schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID
    course_id: UUID
    course_title: str | None = None
    course_slug: str | None = None
    course_image_url: str | None = None
    invoice_id: UUID | None = None
    status: str
    progress: int
    enrolled_at: datetime
    completed_at: datetime | None = None


class EnrollmentWithDetails(EnrollmentResponse):
    """Enrollment with course details."""

    course_description: str | None = None
    course_duration_hours: int | None = None
    instructor_name: str | None = None


class EnrollmentListResponse(BaseModel):
    """Schema for enrollment list response."""

    enrollments: list[EnrollmentResponse]
    total: int


class EnrollmentCreate(BaseModel):
    """Schema for creating an enrollment."""

    user_id: UUID
    course_id: UUID
    invoice_id: UUID | None = None


class EnrollmentUpdate(BaseModel):
    """Schema for updating enrollment."""

    status: Literal["active", "completed", "cancelled"] | None = None
    progress: int | None = Field(None, ge=0, le=100)
