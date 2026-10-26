"""Course class (lesson) model."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.course_module import CourseModule


class CourseClass(Base, TimestampMixin):
    """A class or lesson inside a course module."""

    __tablename__ = "course_classes"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    module_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_evaluation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    module: Mapped["CourseModule"] = relationship("CourseModule", back_populates="classes")

    def __repr__(self) -> str:
        return f"<CourseClass(id={self.id}, title={self.title})>"
