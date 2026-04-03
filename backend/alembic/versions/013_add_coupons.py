"""Add coupons table for discount codes

Revision ID: 013_add_coupons
Revises: 012_license_system
Create Date: 2026-03-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "013_add_coupons"
down_revision: str | None = "012_license_system"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Coupons table
    op.create_table(
        "coupons",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column(
            "discount_type",
            sa.String(length=20),
            nullable=False,
            server_default="percentage",
        ),
        sa.Column(
            "discount_value",
            sa.Numeric(10, 2),
            nullable=False,
        ),
        sa.Column(
            "min_purchase",
            sa.Numeric(10, 2),
            nullable=False,
            server_default=sa.text("0.00"),
        ),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("idx_coupons_code", "coupons", ["code"], unique=True)
    op.create_index("idx_coupons_active", "coupons", ["is_active"], unique=False)

    # 2. Coupon usage tracking (which user used which coupon)
    op.create_table(
        "coupon_usages",
        sa.Column("coupon_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "used_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["coupon_id"], ["coupons.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("coupon_id", "user_id", "invoice_id"),
    )
    op.create_index("idx_coupon_usages_coupon", "coupon_usages", ["coupon_id"], unique=False)
    op.create_index("idx_coupon_usages_user", "coupon_usages", ["user_id"], unique=False)
    op.create_index("idx_coupon_usages_invoice", "coupon_usages", ["invoice_id"], unique=False)

    # 3. Add discount_total to invoices (already exists, but ensure it's used)
    # Note: discount_total already exists in invoices table from migration 007

    # Triggers
    op.execute("""
        CREATE TRIGGER update_coupons_updated_at
        BEFORE UPDATE ON coupons
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Comments
    op.execute("COMMENT ON TABLE coupons IS 'Discount coupons for promotions';")
    op.execute("COMMENT ON COLUMN coupons.discount_type IS 'percentage or fixed amount';")
    op.execute(
        "COMMENT ON COLUMN coupons.min_purchase IS "
        "'Minimum purchase amount required to use coupon';"
    )
    op.execute("COMMENT ON COLUMN coupons.max_uses IS 'Maximum total uses (NULL = unlimited)';")
    op.execute("COMMENT ON TABLE coupon_usages IS 'Track which users have used which coupons';")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons")
    op.drop_index("idx_coupon_usages_invoice", table_name="coupon_usages")
    op.drop_index("idx_coupon_usages_user", table_name="coupon_usages")
    op.drop_index("idx_coupon_usages_coupon", table_name="coupon_usages")
    op.drop_table("coupon_usages")
    op.drop_index("idx_coupons_active", table_name="coupons")
    op.drop_index("idx_coupons_code", table_name="coupons")
    op.drop_table("coupons")
