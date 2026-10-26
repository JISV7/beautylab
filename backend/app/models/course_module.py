"""Course module model."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.course_class import CourseClass


class CourseModule(Base, TimestampMixin):
    """A module groups classes inside a course."""

    __tablename__ = "course_modules"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    course_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    classes: Mapped[list["CourseClass"]] = relationship(
        "CourseClass",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="CourseClass.position",
    )

    def __repr__(self) -> str:
        return f"<CourseModule(id={self.id}, title={self.title})>"
