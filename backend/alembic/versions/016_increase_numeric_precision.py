"""Increase numeric precision for monetary columns

Revision ID: 016_increase_numeric_precision
Revises: 015_add_multi_entity_invoicing
Create Date: 2026-04-11

"""

from collections.abc import Sequence

from sqlalchemy.dialects.postgresql import NUMERIC

from alembic import op

revision: str = "016_increase_numeric_precision"
down_revision: str | None = "015_add_multi_entity_invoicing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Invoice columns: NUMERIC(10, 2) -> NUMERIC(15, 2)
    op.alter_column("invoices", "subtotal", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))
    op.alter_column(
        "invoices", "discount_total", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2)
    )
    op.alter_column("invoices", "tax_total", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))
    op.alter_column("invoices", "total", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))

    # InvoiceLine columns: NUMERIC(10, 2) -> NUMERIC(15, 2)
    op.alter_column("invoice_lines", "quantity", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))
    op.alter_column(
        "invoice_lines", "unit_price", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2)
    )
    op.alter_column(
        "invoice_lines", "tax_amount", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2)
    )
    op.alter_column("invoice_lines", "discount", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))
    op.alter_column(
        "invoice_lines", "line_total", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2)
    )

    # InvoiceAdjustment column: NUMERIC(10, 2) -> NUMERIC(15, 2)
    op.alter_column(
        "invoice_adjustments", "amount", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2)
    )

    # Payment column: NUMERIC(10, 2) -> NUMERIC(15, 2)
    op.alter_column("payments", "amount", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))

    # Coupon columns: NUMERIC(10, 2) -> NUMERIC(15, 2)
    op.alter_column("coupons", "discount_value", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))
    op.alter_column("coupons", "min_purchase", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))

    # Product column: NUMERIC(10, 2) -> NUMERIC(15, 2)
    op.alter_column("products", "price", existing_type=NUMERIC(10, 2), type_=NUMERIC(15, 2))


def downgrade() -> None:
    # Invoice columns: NUMERIC(15, 2) -> NUMERIC(10, 2)
    op.alter_column("invoices", "subtotal", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))
    op.alter_column(
        "invoices", "discount_total", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2)
    )
    op.alter_column("invoices", "tax_total", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))
    op.alter_column("invoices", "total", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))

    # InvoiceLine columns: NUMERIC(15, 2) -> NUMERIC(10, 2)
    op.alter_column("invoice_lines", "quantity", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))
    op.alter_column(
        "invoice_lines", "unit_price", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2)
    )
    op.alter_column(
        "invoice_lines", "tax_amount", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2)
    )
    op.alter_column("invoice_lines", "discount", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))
    op.alter_column(
        "invoice_lines", "line_total", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2)
    )

    # InvoiceAdjustment column: NUMERIC(15, 2) -> NUMERIC(10, 2)
    op.alter_column(
        "invoice_adjustments", "amount", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2)
    )

    # Payment column: NUMERIC(15, 2) -> NUMERIC(10, 2)
    op.alter_column("payments", "amount", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))

    # Coupon columns: NUMERIC(15, 2) -> NUMERIC(10, 2)
    op.alter_column("coupons", "discount_value", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))
    op.alter_column("coupons", "min_purchase", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))

    # Product column: NUMERIC(15, 2) -> NUMERIC(10, 2)
    op.alter_column("products", "price", existing_type=NUMERIC(15, 2), type_=NUMERIC(10, 2))
