"""Add authorization_date to printers

Revision ID: 017_printer_auth_date
Revises: 016_increase_numeric_precision
Create Date: 2026-04-15

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "017_printer_auth_date"
down_revision: str | None = "016_increase_numeric_precision"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "printers",
        sa.Column("authorization_date", sa.String(length=10), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("printers", "authorization_date")
