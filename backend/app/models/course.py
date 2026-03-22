"""Course model."""

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.enrollment import Enrollment
    from app.models.learning_path_course import LearningPathCourse
    from app.models.level import Level
    from app.models.license import License
    from app.models.product import Product


class Course(Base, TimestampMixin):
    """Course model for educational content."""

    __tablename__ = "courses"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    duration_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    level_id: Mapped[int | None] = mapped_column(
        ForeignKey("levels.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        unique=True,
    )
    published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    level: Mapped[Optional["Level"]] = relationship("Level", back_populates="courses")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="courses")
    product: Mapped["Product"] = relationship("Product", back_populates="course")
    learning_path_courses: Mapped[list["LearningPathCourse"]] = relationship(
        "LearningPathCourse", back_populates="course", cascade="all, delete-orphan"
    )
    enrollments: Mapped[list["Enrollment"]] = relationship("Enrollment", back_populates="course")
    licenses: Mapped[list["License"]] = relationship("License", back_populates="course")

    def __repr__(self) -> str:
        return f"<Course(id={self.id}, title={self.title}, slug={self.slug})>"
