"""Quiz models for class evaluations."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.course_class import CourseClass
    from app.models.enrollment import Enrollment
    from app.models.user import User


class Quiz(Base, TimestampMixin):
    """One optional quiz attached to a course class."""

    __tablename__ = "quizzes"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    class_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("course_classes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    passing_score: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    show_answers_after_submit: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    course_class: Mapped["CourseClass"] = relationship("CourseClass", back_populates="quiz")
    questions: Mapped[list["QuizQuestion"]] = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.position",
    )
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        "QuizAttempt",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Quiz(id={self.id}, class_id={self.class_id})>"


class QuizQuestion(Base, TimestampMixin):
    """Question inside a quiz."""

    __tablename__ = "quiz_questions"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    quiz_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    prompt: Mapped[str] = mapped_column(String(2000), nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="single_choice"
    )
    points: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    explanation: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")
    options: Mapped[list["QuizOption"]] = relationship(
        "QuizOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuizOption.position",
    )

    def __repr__(self) -> str:
        return f"<QuizQuestion(id={self.id}, type={self.question_type})>"


class QuizOption(Base, TimestampMixin):
    """Selectable option for a quiz question."""

    __tablename__ = "quiz_options"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    question_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    question: Mapped["QuizQuestion"] = relationship(
        "QuizQuestion", back_populates="options"
    )

    def __repr__(self) -> str:
        return f"<QuizOption(id={self.id}, correct={self.is_correct})>"


class QuizAttempt(Base):
    """A student's attempt at a quiz."""

    __tablename__ = "quiz_attempts"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    quiz_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrollment_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("enrollments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="in_progress"
    )
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
    user: Mapped["User"] = relationship("User")
    enrollment: Mapped[Optional["Enrollment"]] = relationship("Enrollment")
    answers: Mapped[list["QuizAttemptAnswer"]] = relationship(
        "QuizAttemptAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<QuizAttempt(id={self.id}, status={self.status})>"


class QuizAttemptAnswer(Base):
    """Snapshot of a student's answer for an attempt."""

    __tablename__ = "quiz_attempt_answers"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    attempt_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quiz_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("quiz_questions.id", ondelete="SET NULL"),
        nullable=True,
    )
    question_prompt: Mapped[str] = mapped_column(String(2000), nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False)
    selected_option_ids: Mapped[list[str]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    points_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    points_possible: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    attempt: Mapped["QuizAttempt"] = relationship("QuizAttempt", back_populates="answers")

    def __repr__(self) -> str:
        return f"<QuizAttemptAnswer(id={self.id}, correct={self.is_correct})>"
