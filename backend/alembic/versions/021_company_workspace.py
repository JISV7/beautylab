"""Add companies, departments, course modules and classes

Revision ID: 021_company_workspace
Revises: 020_course_video_url
Create Date: 2026-10-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "021_company_workspace"
down_revision: str | None = "020_course_video_url"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("rif", sa.String(length=20), nullable=False),
        sa.Column("sector", sa.String(length=120), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rif", name="uq_companies_rif"),
    )
    op.create_index("idx_companies_rif", "companies", ["rif"], unique=False)
    op.create_index("idx_companies_is_active", "companies", ["is_active"], unique=False)

    op.create_table(
        "departments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
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
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_departments_company_name"),
    )
    op.create_index("idx_departments_company", "departments", ["company_id"], unique=False)

    op.add_column(
        "users",
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("department_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_company_id",
        "users",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_users_department_id",
        "users",
        "departments",
        ["department_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("idx_users_company", "users", ["company_id"], unique=False)
    op.create_index("idx_users_department", "users", ["department_id"], unique=False)

    op.create_table(
        "course_modules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
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
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_course_modules_course", "course_modules", ["course_id"], unique=False)

    op.create_table(
        "course_classes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("video_url", sa.String(length=1000), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=1000), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "has_evaluation",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
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
        sa.ForeignKeyConstraint(["module_id"], ["course_modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_course_classes_module", "course_classes", ["module_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_course_classes_module", table_name="course_classes")
    op.drop_table("course_classes")
    op.drop_index("idx_course_modules_course", table_name="course_modules")
    op.drop_table("course_modules")

    op.drop_index("idx_users_department", table_name="users")
    op.drop_index("idx_users_company", table_name="users")
    op.drop_constraint("fk_users_department_id", "users", type_="foreignkey")
    op.drop_constraint("fk_users_company_id", "users", type_="foreignkey")
    op.drop_column("users", "department_id")
    op.drop_column("users", "company_id")

    op.drop_index("idx_departments_company", table_name="departments")
    op.drop_table("departments")
    op.drop_index("idx_companies_is_active", table_name="companies")
    op.drop_index("idx_companies_rif", table_name="companies")
    op.drop_table("companies")
