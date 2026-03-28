"""Catalog schemas for categories, levels, courses, and learning paths."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# ==================== Category Schemas ====================


class CategoryBase(BaseModel):
    """Base category schema."""

    name: str = Field(..., max_length=100, description="Category name")
    slug: str = Field(..., max_length=120, description="URL-friendly slug")
    description: str | None = Field(None, description="Category description")
    parent_id: int | None = Field(None, description="Parent category ID for hierarchy")
    order: int = Field(default=0, ge=0, description="Display order")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""

    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""

    name: str | None = Field(None, max_length=100)
    slug: str | None = Field(None, max_length=120)
    description: str | None = None
    parent_id: int | None = None
    order: int | None = Field(None, ge=0)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class CategoryResponse(BaseModel):
    """Schema for category response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None = None
    parent_id: int | None = None
    order: int
    created_at: datetime
    updated_at: datetime


class CategoryWithChildren(CategoryResponse):
    """Schema for category with nested children."""

    children: list["CategoryWithChildren"] = []


class CategoryListResponse(BaseModel):
    """Schema for category list response."""

    categories: list[CategoryResponse]
    total: int


# ==================== Level Schemas ====================


class LevelBase(BaseModel):
    """Base level schema."""

    name: str = Field(..., max_length=50, description="Level name")
    slug: str = Field(..., max_length=60, description="URL-friendly slug")
    description: str | None = Field(None, description="Level description")
    order: int = Field(default=0, ge=0, description="Display order")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class LevelCreate(LevelBase):
    """Schema for creating a level."""

    pass


class LevelUpdate(BaseModel):
    """Schema for updating a level."""

    name: str | None = Field(None, max_length=50)
    slug: str | None = Field(None, max_length=60)
    description: str | None = None
    order: int | None = Field(None, ge=0)

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class LevelResponse(BaseModel):
    """Schema for level response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None = None
    order: int
    created_at: datetime | None = None


class LevelListResponse(BaseModel):
    """Schema for level list response."""

    levels: list[LevelResponse]
    total: int


# ==================== Course Schemas ====================


class CourseBase(BaseModel):
    """Base course schema."""

    title: str = Field(..., max_length=255, description="Course title")
    slug: str = Field(..., max_length=280, description="URL-friendly slug")
    description: str | None = Field(None, description="Course description")
    image_url: str | None = Field(None, max_length=500, description="Course image URL")
    duration_hours: int | None = Field(None, ge=1, description="Course duration in hours")
    level_id: int | None = Field(None, description="Level ID")
    category_id: int | None = Field(None, description="Category ID")
    product_id: UUID = Field(..., description="Associated product ID")
    published: bool = Field(default=False, description="Whether course is published")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class CourseCreate(CourseBase):
    """Schema for creating a course."""

    pass


class CourseUpdate(BaseModel):
    """Schema for updating a course."""

    title: str | None = Field(None, max_length=255)
    slug: str | None = Field(None, max_length=280)
    description: str | None = None
    image_url: str | None = Field(None, max_length=500)
    duration_hours: int | None = Field(None, ge=1)
    level_id: int | None = None
    category_id: int | None = None
    product_id: UUID | None = None
    published: bool | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class CourseResponse(BaseModel):
    """Schema for course response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    duration_hours: int | None = None
    level_id: int | None = None
    category_id: int | None = None
    product_id: UUID
    published: bool
    created_at: datetime
    updated_at: datetime
    product_name: str | None = None
    product_price: str | None = None
    product_sku: str | None = None


class CourseWithDetails(CourseResponse):
    """Schema for course with level, category, and product details."""

    level_name: str | None = None
    level_slug: str | None = None
    category_name: str | None = None
    category_slug: str | None = None
    product_name: str | None = None
    product_price: Decimal | None = None
    product_sku: str | None = None


class CourseListResponse(BaseModel):
    """Schema for course list response."""

    courses: list[CourseResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


# ==================== Learning Path Schemas ====================


class LearningPathCourseBase(BaseModel):
    """Base learning path course association schema."""

    course_id: UUID = Field(..., description="Course ID")
    order: int = Field(default=0, ge=0, description="Course order in path")


class LearningPathCourseCreate(LearningPathCourseBase):
    """Schema for adding a course to a learning path."""

    pass


class LearningPathCourseResponse(BaseModel):
    """Schema for learning path course association response."""

    model_config = ConfigDict(from_attributes=True)

    course_id: UUID
    order: int
    created_at: datetime
    # Nested course info
    course_title: str | None = None
    course_slug: str | None = None
    course_duration_hours: int | None = None


class LearningPathBase(BaseModel):
    """Base learning path schema."""

    title: str = Field(..., max_length=255, description="Learning path title")
    slug: str = Field(..., max_length=280, description="URL-friendly slug")
    description: str | None = Field(None, description="Learning path description")
    image_url: str | None = Field(None, max_length=500, description="Learning path image URL")
    product_id: UUID = Field(..., description="Associated product ID")
    published: bool = Field(default=False, description="Whether learning path is published")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class LearningPathCreate(LearningPathBase):
    """Schema for creating a learning path."""

    courses: list[LearningPathCourseCreate] = Field(
        default=[],
        description="Initial courses to add to the path",
    )


class LearningPathUpdate(BaseModel):
    """Schema for updating a learning path."""

    title: str | None = Field(None, max_length=255)
    slug: str | None = Field(None, max_length=280)
    description: str | None = None
    image_url: str | None = Field(None, max_length=500)
    product_id: UUID | None = None
    published: bool | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-safe."""
        # Remove hyphens and underscores, then check if rest is alphanumeric
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Slug must contain only alphanumeric characters, hyphens, and underscores"
            )
        return v


class LearningPathResponse(BaseModel):
    """Schema for learning path response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    description: str | None = None
    image_url: str | None = None
    product_id: UUID
    published: bool
    created_at: datetime
    updated_at: datetime


class LearningPathWithCourses(LearningPathResponse):
    """Schema for learning path with associated courses."""

    courses: list[LearningPathCourseResponse] = []
    total_courses: int = 0
    total_duration_hours: int | None = None


class LearningPathListResponse(BaseModel):
    """Schema for learning path list response."""

    learning_paths: list[LearningPathResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


# Rebuild forward references
CategoryWithChildren.model_rebuild()
