"""Add invoices, lines, adjustments and numbering functions

Revision ID: 007_invoices
Revises: 006_products
Create Date: 2026-03-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "007_invoices"
down_revision: str | None = "006_products"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Invoices table
    op.create_table(
        "invoices",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
        sa.Column("control_number", sa.String(length=20), nullable=False),
        sa.Column("control_number_range_id", sa.Integer(), nullable=False),
        sa.Column("point_of_sale_id", sa.Integer(), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("issue_time", sa.Time(), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("client_rif", sa.String(length=20), nullable=True),
        sa.Column("client_business_name", sa.String(length=255), nullable=True),
        sa.Column("client_document_type", sa.String(length=10), nullable=True),
        sa.Column("client_document_number", sa.String(length=20), nullable=True),
        sa.Column("client_fiscal_address", sa.String(length=500), nullable=True),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "discount_total", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")
        ),
        sa.Column("tax_total", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="issued"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["client_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["control_number_range_id"], ["control_number_ranges.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["point_of_sale_id"], ["point_of_sale.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_invoices_number", "invoices", ["invoice_number"], unique=True)
    op.create_index("idx_invoices_control_number", "invoices", ["control_number"], unique=True)
    op.create_index("idx_invoices_client", "invoices", ["client_id"], unique=False)
    op.create_index("idx_invoices_date", "invoices", ["issue_date"], unique=False)

    # 2. Invoice lines
    op.create_table(
        "invoice_lines",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("discount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("line_total", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_exempt", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_invoice_lines_invoice", "invoice_lines", ["invoice_id"], unique=False)

    # 3. Invoice adjustments
    op.create_table(
        "invoice_adjustments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "adjustment_type",
            sa.String(length=20),
            nullable=False,
            comment="discount, bonus, surcharge",
        ),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_percentage", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_invoice_adjustments_invoice", "invoice_adjustments", ["invoice_id"], unique=False
    )

    # 4. Function to get next invoice number
    op.execute("""
        CREATE OR REPLACE FUNCTION next_invoice_number(pos_id INTEGER)
        RETURNS TEXT LANGUAGE plpgsql AS $$
        DECLARE
            next_num BIGINT;
            prefix_val TEXT;
            result TEXT;
        BEGIN
            SELECT current_invoice_number, prefix INTO next_num, prefix_val
            FROM point_of_sale
            WHERE id = pos_id
            FOR UPDATE;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Point of sale % not found', pos_id;
            END IF;
            next_num := next_num + 1;
            UPDATE point_of_sale SET current_invoice_number = next_num WHERE id = pos_id;
            result := COALESCE(prefix_val, '') || LPAD(next_num::TEXT, 8, '0');
            RETURN result;
        END;
        $$;
    """)

    # 5. Function to get next control number
    op.execute("""
        CREATE OR REPLACE FUNCTION next_control_number(range_id INTEGER)
        RETURNS TEXT LANGUAGE plpgsql AS $$
        DECLARE
            current_val TEXT;
            start_val TEXT;
            end_val TEXT;
        BEGIN
            SELECT current_number, start_number, end_number INTO current_val, start_val, end_val
            FROM control_number_ranges
            WHERE id = range_id AND is_active = TRUE
            FOR UPDATE;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Control number range % not found or inactive', range_id;
            END IF;
            IF current_val >= end_val THEN
                RAISE EXCEPTION 'Control number range exhausted (max = %)', end_val;
            END IF;
            UPDATE control_number_ranges
            SET current_number = (
                SELECT LPAD((CAST(current_val AS BIGINT) + 1)::TEXT, LENGTH(current_val), '0')
            )
            WHERE id = range_id
            RETURNING current_number INTO current_val;
            RETURN current_val;
        END;
        $$;
    """)

    # 6. Trigger for updated_at
    op.execute("""
        CREATE TRIGGER update_invoices_updated_at
        BEFORE UPDATE ON invoices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Comments for compliance (separados en ejecuciones individuales)
    op.execute(
        "COMMENT ON TABLE invoices IS "
        "'Facturas emitidas, cumple con los requisitos de la "
        "Providencia Administrativa venezolana.';"
    )
    op.execute(
        "COMMENT ON COLUMN invoices.invoice_number IS 'Numeración consecutiva y única (Art. 7.2)';"
    )
    op.execute(
        "COMMENT ON COLUMN invoices.control_number IS "
        "'Número de control asignado por imprenta digital "
        "autorizada (Art. 7.4)';"
    )
    op.execute(
        "COMMENT ON COLUMN invoices.issue_date IS "
        "'Fecha de emisión en formato DDMMAAAA (Art. 7.6)';"
    )
    op.execute(
        "COMMENT ON COLUMN invoices.issue_time IS "
        "'Hora de emisión en formato HH.MM.SS con AM/PM (Art. 7.6)';"
    )
    op.execute("COMMENT ON COLUMN invoices.client_rif IS 'RIF del adquirente (Art. 7.7)';")
    op.execute("COMMENT ON COLUMN invoices.subtotal IS 'Base imponible total (Art. 7.11)';")
    op.execute("COMMENT ON COLUMN invoices.tax_total IS 'Monto total del IVA (Art. 7.12)';")
    op.execute("COMMENT ON COLUMN invoices.total IS 'Valor total de las operaciones (Art. 7.13)';")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices")
    op.execute("DROP FUNCTION IF EXISTS next_invoice_number(INTEGER)")
    op.execute("DROP FUNCTION IF EXISTS next_control_number(INTEGER)")
    op.drop_table("invoice_adjustments")
    op.drop_table("invoice_lines")
    op.drop_table("invoices")
