"""Add products table for billable items

Revision ID: 006_add_products_table
Revises: 005_add_company_info_and_billing_tables
Create Date: 2026-03-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006_products"
down_revision: Union[str, None] = "005_company_billing"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


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
            "tax_rate", sa.Numeric(5, 2), nullable=False, comment="Porcentaje de IVA (ej: 16.00)"
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

    # Insert sample products
    op.execute("""
        INSERT INTO products (name, description, sku, price, tax_rate, tax_type)
        VALUES
            ('Curso de Python', 'Curso básico de programación en Python', 'PY-101', 150.00, 16.00, 'gravado'),
            ('Curso de IA', 'Introducción a la Inteligencia Artificial', 'AI-101', 200.00, 16.00, 'gravado'),
            ('Suscripción mensual', 'Acceso a toda la plataforma', 'SUB-MONTH', 50.00, 16.00, 'gravado'),
            ('Material de estudio (libro)', 'Libro electrónico de fundamentos', 'BOOK-001', 30.00, 0.00, 'exento')
    """)

    # Triggers
    op.execute("""
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Comments
    op.execute("COMMENT ON TABLE products IS 'Productos y servicios facturables';")
    op.execute(
        "COMMENT ON COLUMN products.tax_type IS 'Tipo de tratamiento fiscal: gravado (con IVA), exento (sin IVA), exonerado (sin IVA pero con justificación)';"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_products_updated_at ON products")
    op.drop_table("products")
