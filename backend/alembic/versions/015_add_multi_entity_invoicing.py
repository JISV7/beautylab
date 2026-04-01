"""Add multi-entity invoicing support

Revision ID: 015_add_multi_entity_invoicing
Revises: 72d8833a954f
Create Date: 2026-03-31

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "015_add_multi_entity_invoicing"
down_revision: str | None = "72d8833a954f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add is_active column to company_info table
    op.add_column(
        "company_info",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    # Create index on is_active for quick lookups
    op.create_index("idx_company_info_is_active", "company_info", ["is_active"], unique=False)

    # Add is_active column to printers table
    op.add_column(
        "printers",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    # Create index on is_active for printers
    op.create_index("idx_printers_is_active", "printers", ["is_active"], unique=False)

    # Add company_info_id foreign key to invoices table
    op.add_column("invoices", sa.Column("company_info_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_invoices_company_info",
        "invoices",
        "company_info",
        ["company_info_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("idx_invoices_company_info_id", "invoices", ["company_info_id"], unique=False)

    # Add trigger for is_active field to ensure only one active company
    op.execute("""
        CREATE OR REPLACE FUNCTION ensure_single_active_company()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_active = true THEN
                UPDATE company_info
                SET is_active = false, updated_at = NOW()
                WHERE id != NEW.id AND is_active = true;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trg_ensure_single_active_company
        BEFORE INSERT OR UPDATE ON company_info
        FOR EACH ROW
        EXECUTE FUNCTION ensure_single_active_company();
    """)

    # Set the first company info as active if exists
    op.execute("""
        UPDATE company_info
        SET is_active = true
        WHERE id = (SELECT MIN(id) FROM company_info);
    """)

    # Set first printer as active if exists
    op.execute("""
        UPDATE printers
        SET is_active = true
        WHERE id = (SELECT MIN(id) FROM printers);
    """)


def downgrade() -> None:
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS trg_ensure_single_active_company ON company_info")
    op.execute("DROP FUNCTION IF EXISTS ensure_single_active_company()")

    # Drop foreign key and index from invoices
    op.drop_index("idx_invoices_company_info_id", table_name="invoices")
    op.drop_constraint("fk_invoices_company_info", "invoices", type_="foreignkey")
    op.drop_column("invoices", "company_info_id")

    # Drop index and column from printers
    op.drop_index("idx_printers_is_active", table_name="printers")
    op.drop_column("printers", "is_active")

    # Drop index and column from company_info
    op.drop_index("idx_company_info_is_active", table_name="company_info")
    op.drop_column("company_info", "is_active")
