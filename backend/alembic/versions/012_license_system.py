"""Add license system for gifts and corporate licenses

Revision ID: 012_license_system
Revises: 011_shopping_cart
Create Date: 2026-03-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "012_license_system"
down_revision: str | None = "011_shopping_cart"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Licenses table (redeemable codes)
    op.create_table(
        "licenses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "license_code",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("learning_path_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("invoice_line_id", sa.BigInteger(), nullable=True),
        sa.Column("purchased_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("redeemed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "license_type",
            sa.String(length=20),
            nullable=False,
            server_default="gift",
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("redeemed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invoice_line_id"], ["invoice_lines.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["learning_path_id"], ["learning_paths.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["purchased_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["redeemed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("license_code"),
    )
    op.create_index("idx_licenses_code", "licenses", ["license_code"], unique=False)
    op.create_index("idx_licenses_status", "licenses", ["status"], unique=False)
    op.create_index("idx_licenses_purchased_by", "licenses", ["purchased_by_user_id"], unique=False)
    op.create_index("idx_licenses_redeemed_by", "licenses", ["redeemed_by_user_id"], unique=False)
    op.create_index("idx_licenses_product", "licenses", ["product_id"], unique=False)

    # 2. License assignments (corporate management)
    op.create_table(
        "license_assignments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("license_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_to_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("corporate_note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["license_id"], ["licenses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_to_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_license_assignments_license",
        "license_assignments",
        ["license_id"],
        unique=False,
    )
    op.create_index(
        "idx_license_assignments_assigned_to",
        "license_assignments",
        ["assigned_to_user_id"],
        unique=False,
    )

    # 3. Payment methods
    op.create_table(
        "payment_methods",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "method_type",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_payment_methods_user", "payment_methods", ["user_id"], unique=False)

    # 4. Payments (split payment support)
    op.create_table(
        "payments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payment_method_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("transaction_reference", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_method_id"], ["payment_methods.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_payments_invoice", "payments", ["invoice_id"], unique=False)
    op.create_index("idx_payments_status", "payments", ["status"], unique=False)

    # 5. Payment details (card info, deposit info)
    op.create_table(
        "payment_details",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("card_holder_name", sa.String(length=255), nullable=True),
        sa.Column("card_number_last4", sa.CHAR(length=4), nullable=True),
        sa.Column("card_number_hash", sa.String(length=255), nullable=True),
        sa.Column("card_expiry_month", sa.Integer(), nullable=True),
        sa.Column("card_expiry_year", sa.Integer(), nullable=True),
        sa.Column("card_cvv_hash", sa.String(length=255), nullable=True),
        sa.Column("card_brand", sa.String(length=50), nullable=True),
        sa.Column("bank_name", sa.String(length=255), nullable=True),
        sa.Column("deposit_reference", sa.String(length=100), nullable=True),
        sa.Column("deposit_bank", sa.String(length=255), nullable=True),
        sa.Column("deposit_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_payment_details_payment", "payment_details", ["payment_id"], unique=False)

    # Triggers
    op.execute("""
        CREATE TRIGGER update_licenses_updated_at
        BEFORE UPDATE ON licenses
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Comments
    op.execute("COMMENT ON TABLE licenses IS 'Licenses redeemable for courses or learning paths';")
    op.execute(
        "COMMENT ON COLUMN licenses.license_code IS 'UUID-based license code for redemption';"
    )
    op.execute("COMMENT ON COLUMN licenses.license_type IS 'gift, corporate, or bulk';")
    op.execute(
        "COMMENT ON COLUMN licenses.status IS 'pending, active, redeemed, expired, or cancelled';"
    )
    op.execute(
        "COMMENT ON TABLE license_assignments IS 'Corporate license assignments to employees';"
    )
    op.execute("COMMENT ON TABLE payment_methods IS 'User saved payment methods';")
    op.execute(
        "COMMENT ON COLUMN payment_methods.method_type IS "
        "'credit_card, debit_card, cash_deposit, or bank_transfer';"
    )
    op.execute(
        "COMMENT ON TABLE payments IS 'Individual payment transactions (supports split payments)';"
    )
    op.execute(
        "COMMENT ON TABLE payment_details IS "
        "'Sensitive payment information (hashed card numbers, etc.)';"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses")

    op.drop_table("payment_details")
    op.drop_index("idx_payments_status", table_name="payments")
    op.drop_index("idx_payments_invoice", table_name="payments")
    op.drop_table("payments")
    op.drop_index("idx_payment_methods_user", table_name="payment_methods")
    op.drop_table("payment_methods")
    op.drop_index("idx_license_assignments_assigned_to", table_name="license_assignments")
    op.drop_index("idx_license_assignments_license", table_name="license_assignments")
    op.drop_table("license_assignments")
    op.drop_index("idx_licenses_product", table_name="licenses")
    op.drop_index("idx_licenses_redeemed_by", table_name="licenses")
    op.drop_index("idx_licenses_purchased_by", table_name="licenses")
    op.drop_index("idx_licenses_status", table_name="licenses")
    op.drop_index("idx_licenses_code", table_name="licenses")
    op.drop_table("licenses")
