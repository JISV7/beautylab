"""Add company info, printers, control number ranges and point of sale

Revision ID: 005_add_company_info_and_billing_tables
Revises: 004_add_fiscal_fields_to_users
Create Date: 2026-03-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005_add_company_info_and_billing_tables"
down_revision: Union[str, None] = "004_add_fiscal_fields_to_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Company information (emisor)
    op.create_table(
        "company_info",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("rif", sa.String(length=20), nullable=False),
        sa.Column("fiscal_address", sa.String(length=500), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("logo_url", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_company_info_rif", "company_info", ["rif"], unique=True)

    # 2. Printers (imprentas digitales autorizadas)
    op.create_table(
        "printers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("rif", sa.String(length=20), nullable=False),
        sa.Column("authorization_providence", sa.String(length=255), nullable=False, comment="Nomenclatura y fecha de la Providencia Administrativa de autorización"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_printers_rif", "printers", ["rif"], unique=True)

    # 3. Control Number Ranges (rangos asignados por imprenta)
    op.create_table(
        "control_number_ranges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("printer_id", sa.Integer(), nullable=False),
        sa.Column("start_number", sa.String(length=20), nullable=False),
        sa.Column("end_number", sa.String(length=20), nullable=False),
        sa.Column("current_number", sa.String(length=20), nullable=False),
        sa.Column("assigned_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["printer_id"], ["printers.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_control_ranges_active", "control_number_ranges", ["is_active"], unique=False)

    # 4. Point of Sale (puntos de emisión)
    op.create_table(
        "point_of_sale",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("prefix", sa.String(length=10), nullable=True),
        sa.Column("current_invoice_number", sa.BigInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_pos_prefix", "point_of_sale", ["prefix"], unique=True)

    # Insert default company data (placeholder, actualizar en producción)
    op.execute("""
        INSERT INTO company_info (business_name, rif, fiscal_address, phone, email)
        VALUES ('Academia Online de Programación e IA', 'J-123456789', 'Av. Principal, Caracas, Venezuela', '0212-1234567', 'info@academia.com')
    """)

    # Insert default point of sale
    op.execute("""
        INSERT INTO point_of_sale (name, prefix, current_invoice_number)
        VALUES ('Principal', 'A', 0)
    """)

    # Triggers for updated_at
    op.execute("""
        CREATE TRIGGER update_company_info_updated_at
        BEFORE UPDATE ON company_info
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_printers_updated_at
        BEFORE UPDATE ON printers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_control_number_ranges_updated_at
        BEFORE UPDATE ON control_number_ranges
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_point_of_sale_updated_at
        BEFORE UPDATE ON point_of_sale
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_point_of_sale_updated_at ON point_of_sale")
    op.execute("DROP TRIGGER IF EXISTS update_control_number_ranges_updated_at ON control_number_ranges")
    op.execute("DROP TRIGGER IF EXISTS update_printers_updated_at ON printers")
    op.execute("DROP TRIGGER IF EXISTS update_company_info_updated_at ON company_info")

    # Drop tables in reverse order
    op.drop_table("point_of_sale")
    op.drop_table("control_number_ranges")
    op.drop_table("printers")
    op.drop_table("company_info")