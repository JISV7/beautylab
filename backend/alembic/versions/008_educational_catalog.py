"""Add educational catalog: categories, levels, courses

Revision ID: 008_add_educational_catalog
Revises: 007_add_invoices_and_lines
Create Date: 2026-03-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "008_educational_catalog"
down_revision: Union[str, None] = "007_invoices"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["parent_id"], ["categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("idx_categories_parent", "categories", ["parent_id"], unique=False)

    # 2. Levels table
    op.create_table(
        "levels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("slug", sa.String(length=60), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    # 3. Courses table
    op.create_table(
        "courses",
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
        sa.Column("duration_hours", sa.Integer(), nullable=True),
        sa.Column("level_id", sa.Integer(), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=True),
        # product_id is mandatory: each course must have a corresponding product
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["level_id"], ["levels.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("idx_courses_category", "courses", ["category_id"], unique=False)
    op.create_index("idx_courses_level", "courses", ["level_id"], unique=False)
    op.create_index("idx_courses_product", "courses", ["product_id"], unique=True)
    op.create_index("idx_courses_published", "courses", ["published"], unique=False)

    # 4. Triggers for updated_at
    op.execute("""
        CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_courses_updated_at
        BEFORE UPDATE ON courses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Insert default levels
    op.execute("""
        INSERT INTO levels (name, slug, description, "order") VALUES
        ('Básico', 'basico', 'Conocimientos fundamentales', 1),
        ('Intermedio', 'intermedio', 'Conocimientos prácticos y aplicados', 2),
        ('Avanzado', 'avanzado', 'Especialización y temas complejos', 3);
    """)

    # Insert some sample categories
    op.execute("""
        INSERT INTO categories (name, slug, "order") VALUES
        ('Programación', 'programacion', 1),
        ('Inteligencia Artificial', 'inteligencia-artificial', 2),
        ('Data Science', 'data-science', 3),
        ('Desarrollo Web', 'desarrollo-web', 4);
    """)


def downgrade() -> None:
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_courses_updated_at ON courses")
    op.execute("DROP TRIGGER IF EXISTS update_categories_updated_at ON categories")

    # Drop tables
    op.drop_table("courses")
    op.drop_table("levels")
    op.drop_table("categories")
