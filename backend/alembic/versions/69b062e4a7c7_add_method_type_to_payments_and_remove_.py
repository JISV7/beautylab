"""add method_type to payments and remove payment_method_id

Revision ID: 69b062e4a7c7
Revises: 89c2ae197a4b
Create Date: 2026-03-31 18:23:31.610378

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "69b062e4a7c7"
down_revision: str | None = "89c2ae197a4b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add method_type column
    op.add_column(
        "payments",
        sa.Column("method_type", sa.String(length=20), nullable=True),
    )

    # Copy method_type from payment_methods table
    op.execute("""
        UPDATE payments p
        SET method_type = pm.method_type
        FROM payment_methods pm
        WHERE p.payment_method_id = pm.id
    """)

    # Make method_type NOT NULL
    op.alter_column("payments", "method_type", nullable=False)

    # Drop foreign key constraint
    op.drop_constraint(
        "payments_payment_method_id_fkey",
        "payments",
        type_="foreignkey",
    )

    # Drop payment_method_id column
    op.drop_column("payments", "payment_method_id")

    # Create index on method_type
    op.create_index("idx_payments_method_type", "payments", ["method_type"])


def downgrade() -> None:
    # Recreate payment_method_id column
    op.add_column(
        "payments",
        sa.Column("payment_method_id", sa.UUID(), nullable=True),
    )

    # Drop method_type column
    op.drop_column("payments", "method_type")

    # Recreate foreign key (will be NULL for all rows)
    op.create_foreign_key(
        "payments_payment_method_id_fkey",
        "payments",
        "payment_methods",
        ["payment_method_id"],
        ["id"],
        ondelete="SET NULL",
    )
