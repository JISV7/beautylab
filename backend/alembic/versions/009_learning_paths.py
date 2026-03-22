"""Add learning paths and path-courses association

Revision ID: 009_add_learning_paths
Revises: 008_add_educational_catalog
Create Date: 2026-03-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009_learning_paths"
down_revision: str | None = "008_educational_catalog"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Learning paths table
    op.create_table(
        "learning_paths",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=280), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        # product_id is mandatory: each learning path must have a corresponding product
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("idx_learning_paths_product", "learning_paths", ["product_id"], unique=True)
    op.create_index("idx_learning_paths_published", "learning_paths", ["published"], unique=False)

    # 2. Association table: learning_path_courses
    op.create_table(
        "learning_path_courses",
        sa.Column("learning_path_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["learning_path_id"], ["learning_paths.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("learning_path_id", "course_id"),
    )
    op.create_index(
        "idx_lp_courses_path", "learning_path_courses", ["learning_path_id"], unique=False
    )
    op.create_index("idx_lp_courses_course", "learning_path_courses", ["course_id"], unique=False)

    # 3. Triggers for updated_at
    op.execute("""
        CREATE TRIGGER update_learning_paths_updated_at
        BEFORE UPDATE ON learning_paths
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON learning_paths")
    op.drop_table("learning_path_courses")
    op.drop_table("learning_paths")
