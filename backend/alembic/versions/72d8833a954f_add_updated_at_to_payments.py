"""add updated_at to payments

Revision ID: 72d8833a954f
Revises: 69b062e4a7c7
Create Date: 2026-03-31 18:32:07.354900

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "72d8833a954f"
down_revision: str | None = "69b062e4a7c7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("payments", "updated_at")
