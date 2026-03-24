"""Add company info, printers, control number ranges and point of sale

Revision ID: 005_company_billing
Revises: 004_fiscal_fields
Create Date: 2026-03-20

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "005_company_billing"
down_revision: str | None = "004_fiscal_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Company information (emisor)
    op.create_table(
        "company_info",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("rif", sa.String(length=20), nullable=False),
        sa.Column("fiscal_address", sa.String(length=500), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("logo_url", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_company_info_rif", "company_info", ["rif"], unique=True)

    # Printers (authorized digital printers)
    op.create_table(
        "printers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("rif", sa.String(length=20), nullable=False),
        sa.Column("authorization_providence", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_printers_rif", "printers", ["rif"], unique=True)

    # Control Number Ranges
    op.create_table(
        "control_number_ranges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("printer_id", sa.Integer(), nullable=False),
        sa.Column("start_number", sa.String(length=20), nullable=False),
        sa.Column("end_number", sa.String(length=20), nullable=False),
        sa.Column("current_number", sa.String(length=20), nullable=False),
        sa.Column("assigned_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["printer_id"], ["printers.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_control_ranges_active", "control_number_ranges", ["is_active"], unique=False
    )

    # Point of Sale
    op.create_table(
        "point_of_sale",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("prefix", sa.String(length=10), nullable=True),
        sa.Column(
            "current_invoice_number", sa.BigInteger(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_pos_prefix", "point_of_sale", ["prefix"], unique=True)

    # Insert default company data
    op.execute("""
        INSERT INTO company_info (business_name, rif, fiscal_address, phone, email)
        VALUES (
            'Online Programming and AI Academy',
            'J-123456789',
            'Main Avenue, Caracas, Venezuela',
            '0212-1234567',
            'info@academy.com'
        )
    """)

    op.execute("""
        INSERT INTO point_of_sale (name, prefix, current_invoice_number)
        VALUES ('Principal', 'A', 0)
    """)

    # Triggers
    op.execute(
        "CREATE TRIGGER update_company_info_updated_at "
        "BEFORE UPDATE ON company_info "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_printers_updated_at "
        "BEFORE UPDATE ON printers "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_control_number_ranges_updated_at "
        "BEFORE UPDATE ON control_number_ranges "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )
    op.execute(
        "CREATE TRIGGER update_point_of_sale_updated_at "
        "BEFORE UPDATE ON point_of_sale "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_point_of_sale_updated_at ON point_of_sale")
    op.execute(
        "DROP TRIGGER IF EXISTS update_control_number_ranges_updated_at ON control_number_ranges"
    )
    op.execute("DROP TRIGGER IF EXISTS update_printers_updated_at ON printers")
    op.execute("DROP TRIGGER IF EXISTS update_company_info_updated_at ON company_info")
    op.drop_table("point_of_sale")
    op.drop_table("control_number_ranges")
    op.drop_table("printers")
    op.drop_table("company_info")
