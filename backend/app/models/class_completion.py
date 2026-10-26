"""Class completion tracking."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.course_class import CourseClass
    from app.models.enrollment import Enrollment
    from app.models.quiz import QuizAttempt
    from app.models.user import User


class ClassCompletion(Base):
    """Marks a required class as completed by a user."""

    __tablename__ = "class_completions"
    __table_args__ = (
        UniqueConstraint("user_id", "class_id", name="uq_class_completions_user_class"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    class_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrollment_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("enrollments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="video")
    quiz_attempt_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quiz_attempts.id", ondelete="SET NULL"),
        nullable=True,
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    course_class: Mapped["CourseClass"] = relationship("CourseClass")
    enrollment: Mapped[Optional["Enrollment"]] = relationship("Enrollment")
    quiz_attempt: Mapped[Optional["QuizAttempt"]] = relationship("QuizAttempt")

    def __repr__(self) -> str:
        return f"<ClassCompletion(user={self.user_id}, class={self.class_id})>"
