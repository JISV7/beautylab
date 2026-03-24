"""Add shopping cart tables

Revision ID: 011_shopping_cart
Revises: 010_enrollments
Create Date: 2026-03-20

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "011_shopping_cart"
down_revision: str | None = "010_enrollments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cart_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),
    )
    op.create_index("idx_cart_items_user", "cart_items", ["user_id"], unique=False)

    op.execute("""
        CREATE TRIGGER update_cart_items_updated_at
        BEFORE UPDATE ON cart_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Comments separated
    op.execute("COMMENT ON TABLE cart_items IS 'Shopping cart items for each user';")
    op.execute(
        "COMMENT ON COLUMN cart_items.quantity IS "
        "'Product quantity (normally 1 for courses, "
        "but allowed for other products)';"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items")
    op.drop_table("cart_items")
