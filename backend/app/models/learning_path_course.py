"""Learning Path Course association model."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.learning_path import LearningPath


class LearningPathCourse(Base):
    """Association table between learning paths and courses."""

    __tablename__ = "learning_path_courses"

    learning_path_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        primary_key=True,
    )
    course_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        primary_key=True,
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now,
        nullable=False,
    )

    # Relationships
    learning_path: Mapped["LearningPath"] = relationship(
        "LearningPath", back_populates="learning_path_courses"
    )
    course: Mapped["Course"] = relationship("Course", back_populates="learning_path_courses")

    def __repr__(self) -> str:
        return (
            f"<LearningPathCourse(path={self.learning_path_id}, "
            f"course={self.course_id}, order={self.order})>"
        )
