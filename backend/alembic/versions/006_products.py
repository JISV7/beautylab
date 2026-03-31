"""Add products table for billable items

Revision ID: 006_add_products_table
Revises: 005_add_company_info_and_billing_tables
Create Date: 2026-03-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006_products"
down_revision: str | None = "005_company_billing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "tax_rate", sa.Numeric(5, 2), nullable=False, comment="IVA percentage (e.g., 16.00)"
        ),
        sa.Column(
            "tax_type",
            sa.String(length=20),
            nullable=False,
            server_default="gravado",
            comment="gravado, exento, exonerado",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku"),
    )
    op.create_index("idx_products_name", "products", ["name"], unique=False)
    op.create_index("idx_products_active", "products", ["is_active"], unique=False)

    # Triggers
    op.execute("""
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Comments
    op.execute("COMMENT ON TABLE products IS 'Billable products and services';")
    op.execute(
        "COMMENT ON COLUMN products.tax_type IS "
        "'Tax treatment type: gravado (with IVA), exento (without IVA), "
        "exonerado (without IVA but with justification)';"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_products_updated_at ON products")
    op.drop_table("products")
