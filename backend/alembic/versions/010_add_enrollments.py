"""Add enrollments table to track user course subscriptions

Revision ID: 010_enrollments
Revises: 009_learning_paths
Create Date: 2026-03-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "010_enrollments"
down_revision: str | None = "009_learning_paths"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "enrollments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default=sa.text("'active'")
        ),
        sa.Column("progress", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "enrolled_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),
    )
    op.create_index("idx_enrollments_user", "enrollments", ["user_id"], unique=False)
    op.create_index("idx_enrollments_course", "enrollments", ["course_id"], unique=False)
    op.create_index("idx_enrollments_status", "enrollments", ["status"], unique=False)

    # Comments separados
    op.execute("COMMENT ON TABLE enrollments IS 'Inscripciones de usuarios a cursos';")
    op.execute("COMMENT ON COLUMN enrollments.status IS 'active, completed, cancelled';")
    op.execute("COMMENT ON COLUMN enrollments.progress IS 'Porcentaje completado (0-100)';")


def downgrade() -> None:
    op.drop_table("enrollments")
