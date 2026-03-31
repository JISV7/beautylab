"""add updated_at to payment_methods

Revision ID: 89c2ae197a4b
Revises: 014_fix_fiscal_column_lengths
Create Date: 2026-03-31 18:04:30.223732

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89c2ae197a4b'
down_revision: Union[str, None] = '014_fix_fiscal_column_lengths'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payment_methods",
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("payment_methods", "updated_at")
