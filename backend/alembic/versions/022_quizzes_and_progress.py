"""Add quizzes, quiz attempts and class completion tracking

Revision ID: 022_quizzes_and_progress
Revises: 021_company_workspace
Create Date: 2026-10-26

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "022_quizzes_and_progress"
down_revision: str | None = "021_company_workspace"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "course_classes",
        sa.Column(
            "content_type",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'video'"),
        ),
    )
    op.add_column(
        "course_classes",
        sa.Column(
            "is_required",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    op.create_table(
        "quizzes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column(
            "passing_score", sa.Integer(), nullable=False, server_default=sa.text("70")
        ),
        sa.Column("max_attempts", sa.Integer(), nullable=True),
        sa.Column("time_limit_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "show_answers_after_submit",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["class_id"], ["course_classes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("class_id", name="uq_quizzes_class_id"),
    )
    op.create_index("idx_quizzes_class", "quizzes", ["class_id"], unique=False)

    op.create_table(
        "quiz_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prompt", sa.String(length=2000), nullable=False),
        sa.Column(
            "question_type",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'single_choice'"),
        ),
        sa.Column("points", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("explanation", sa.String(length=1000), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_quiz_questions_quiz", "quiz_questions", ["quiz_id"], unique=False
    )

    op.create_table(
        "quiz_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("text", sa.String(length=500), nullable=False),
        sa.Column(
            "is_correct", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["question_id"], ["quiz_questions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_quiz_options_question", "quiz_options", ["question_id"], unique=False
    )

    op.create_table(
        "quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enrollment_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'in_progress'"),
        ),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("passed", sa.Boolean(), nullable=True),
        sa.Column(
            "started_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["enrollment_id"], ["enrollments.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_quiz_attempts_quiz", "quiz_attempts", ["quiz_id"], unique=False)
    op.create_index("idx_quiz_attempts_user", "quiz_attempts", ["user_id"], unique=False)

    op.create_table(
        "quiz_attempt_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("question_prompt", sa.String(length=2000), nullable=False),
        sa.Column("question_type", sa.String(length=20), nullable=False),
        sa.Column(
            "selected_option_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "is_correct", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "points_awarded", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "points_possible", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
        sa.ForeignKeyConstraint(
            ["attempt_id"], ["quiz_attempts.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["question_id"], ["quiz_questions.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_quiz_attempt_answers_attempt",
        "quiz_attempt_answers",
        ["attempt_id"],
        unique=False,
    )

    op.create_table(
        "class_completions",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enrollment_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "source", sa.String(length=20), nullable=False, server_default=sa.text("'video'")
        ),
        sa.Column("quiz_attempt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "completed_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["class_id"], ["course_classes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["enrollment_id"], ["enrollments.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["quiz_attempt_id"], ["quiz_attempts.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "class_id", name="uq_class_completions_user_class"
        ),
    )
    op.create_index(
        "idx_class_completions_user", "class_completions", ["user_id"], unique=False
    )
    op.create_index(
        "idx_class_completions_class", "class_completions", ["class_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("idx_class_completions_class", table_name="class_completions")
    op.drop_index("idx_class_completions_user", table_name="class_completions")
    op.drop_table("class_completions")

    op.drop_index("idx_quiz_attempt_answers_attempt", table_name="quiz_attempt_answers")
    op.drop_table("quiz_attempt_answers")

    op.drop_index("idx_quiz_attempts_user", table_name="quiz_attempts")
    op.drop_index("idx_quiz_attempts_quiz", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")

    op.drop_index("idx_quiz_options_question", table_name="quiz_options")
    op.drop_table("quiz_options")

    op.drop_index("idx_quiz_questions_quiz", table_name="quiz_questions")
    op.drop_table("quiz_questions")

    op.drop_index("idx_quizzes_class", table_name="quizzes")
    op.drop_table("quizzes")

    op.drop_column("course_classes", "is_required")
    op.drop_column("course_classes", "content_type")
