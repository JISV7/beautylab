"""Schemas for companies, departments, classes and company users."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.utils.phone import validate_phone
from app.utils.rif import validate_rif


class CompanyResponse(BaseModel):
    """Company data for the company dashboard."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    rif: str
    sector: str | None = None
    email: str | None = None
    phone: str | None = None
    logo_url: str | None = None
    is_active: bool


class DepartmentCreate(BaseModel):
    """Create a department."""

    name: str = Field(..., min_length=2, max_length=120)
    description: str | None = Field(None, max_length=500)


class DepartmentUpdate(BaseModel):
    """Update a department."""

    name: str | None = Field(None, min_length=2, max_length=120)
    description: str | None = Field(None, max_length=500)


class DepartmentResponse(BaseModel):
    """Department with aggregate metrics."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    employee_count: int = 0
    courses_assigned: int = 0
    average_progress: int = 0


class CompanyRegisterRequest(BaseModel):
    """Company onboarding wizard payload."""

    name: str = Field(..., min_length=2, max_length=255)
    rif: str = Field(..., max_length=20)
    sector: str | None = Field(None, max_length=120)
    email: EmailStr
    phone: str = Field(..., max_length=20)
    admin_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    departments: list[str] = Field(default_factory=list)

    @field_validator("rif")
    @classmethod
    def validate_company_rif(cls, v: str) -> str:
        is_valid, error_msg, normalized_rif = validate_rif(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_rif

    @field_validator("phone")
    @classmethod
    def validate_company_phone(cls, v: str) -> str:
        is_valid, error_msg, normalized_phone = validate_phone(v)
        if not is_valid:
            raise ValueError(error_msg)
        return normalized_phone

    @field_validator("departments")
    @classmethod
    def clean_departments(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            name = value.strip()
            if not name:
                continue
            if name.lower() in {item.lower() for item in cleaned}:
                continue
            cleaned.append(name[:120])
        return cleaned


class CompanySummary(BaseModel):
    """KPIs for the company dashboard home."""

    company_name: str
    departments: int
    employees: int
    active_employees: int
    courses_assigned: int
    completion_rate: int


class ActivityItem(BaseModel):
    """Recent activity row."""

    id: str
    user_name: str
    action: str
    detail: str
    created_at: datetime


class CompanyUserResponse(BaseModel):
    """Employee row for the company directory."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str | None = None
    email: EmailStr
    role: str
    department_id: UUID | None = None
    department_name: str | None = None
    is_active: bool
    created_at: datetime


class CompanyUserCreate(BaseModel):
    """Create an employee inside a company."""

    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    department_id: UUID | None = None
    role: Literal["company_admin", "user"] = "user"


class CompanyUserUpdate(BaseModel):
    """Update an employee."""

    full_name: str | None = Field(None, min_length=2, max_length=100)
    department_id: UUID | None = None
    role: Literal["company_admin", "user"] | None = None
    is_active: bool | None = None


class CourseClassResponse(BaseModel):
    """A class inside a module."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    duration_minutes: int | None = None
    has_evaluation: bool
    content_type: str = "video"
    is_required: bool = True
    position: int


class CourseModuleResponse(BaseModel):
    """A module with its classes."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    position: int
    classes: list[CourseClassResponse] = Field(default_factory=list)


class CourseClassesResponse(BaseModel):
    """A course with modules and classes."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    image_url: str | None = None
    modules: list[CourseModuleResponse] = Field(default_factory=list)


class CourseModuleCreate(BaseModel):
    """Create a course module."""

    course_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = Field(None, max_length=1000)
    position: int = 1


class CourseModuleUpdate(BaseModel):
    """Update a course module."""

    title: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = Field(None, max_length=1000)
    position: int | None = None


class CourseClassCreate(BaseModel):
    """Create a class."""

    module_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = Field(None, max_length=1000)
    video_url: str | None = Field(None, max_length=1000)
    thumbnail_url: str | None = Field(None, max_length=1000)
    duration_minutes: int | None = Field(None, ge=1, le=10000)
    has_evaluation: bool = False
    content_type: Literal["video", "quiz", "mixed"] = "video"
    is_required: bool = True
    position: int = 1


class CourseClassUpdate(BaseModel):
    """Update a class."""

    title: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = Field(None, max_length=1000)
    video_url: str | None = Field(None, max_length=1000)
    thumbnail_url: str | None = Field(None, max_length=1000)
    duration_minutes: int | None = Field(None, ge=1, le=10000)
    has_evaluation: bool | None = None
    content_type: Literal["video", "quiz", "mixed"] | None = None
    is_required: bool | None = None
    position: int | None = None
