"""Add name and is_active to home_configs

Revision ID: 019_multi_home_config
Revises: 018_add_home_config
Create Date: 2026-05-22

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "019_multi_home_config"
down_revision: str | None = "018_add_home_config"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add columns with defaults
    op.add_column(
        "home_configs",
        sa.Column(
            "name",
            sa.String(length=100),
            nullable=False,
            server_default=sa.text("'Default Config'"),
        ),
    )
    op.add_column(
        "home_configs",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Set the existing config (id=1) as active
    op.execute("UPDATE home_configs SET is_active = true WHERE id = 1")


def downgrade() -> None:
    op.drop_column("home_configs", "is_active")
    op.drop_column("home_configs", "name")
