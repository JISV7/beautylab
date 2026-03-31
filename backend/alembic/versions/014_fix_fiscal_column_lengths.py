"""Fix fiscal column lengths in users table

Revision ID: 014_fix_fiscal_column_lengths
Revises: 013_add_coupons
Create Date: 2026-03-31

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "014_fix_fiscal_column_lengths"
down_revision: str | None = "013_add_coupons"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Alter rif column from String(10) to String(20) to match migration 004
    op.alter_column(
        "users",
        "rif",
        existing_type=sa.String(length=10),
        type_=sa.String(length=20),
        existing_nullable=True,
    )

    # Alter phone column from String(12) to String(20) to accommodate international format
    op.alter_column(
        "users",
        "phone",
        existing_type=sa.String(length=12),
        type_=sa.String(length=20),
        existing_nullable=True,
    )


def downgrade() -> None:
    # Revert phone column to String(12)
    op.alter_column(
        "users",
        "phone",
        existing_type=sa.String(length=20),
        type_=sa.String(length=12),
        existing_nullable=True,
    )

    # Revert rif column to String(10)
    op.alter_column(
        "users",
        "rif",
        existing_type=sa.String(length=20),
        type_=sa.String(length=10),
        existing_nullable=True,
    )
