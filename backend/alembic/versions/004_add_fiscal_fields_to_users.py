"""Add fiscal fields to users table

Revision ID: 004_add_fiscal_fields_to_users
Revises: 003_make_font_id_mandatory
Create Date: 2026-03-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_add_fiscal_fields_to_users"
down_revision: Union[str, None] = "003_make_font_id_mandatory"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add fiscal columns to users table
    op.add_column("users", sa.Column("rif", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("document_type", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("document_number", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("business_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("fiscal_address", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("is_contributor", sa.Boolean(), nullable=True, server_default=sa.text("false")))

    # Create indexes for faster lookups
    op.create_index("idx_users_rif", "users", ["rif"], unique=False)
    op.create_index("idx_users_document", "users", ["document_type", "document_number"], unique=False)

    # Add comments
    op.execute("""
        COMMENT ON COLUMN users.rif IS 'Registro Único de Información Fiscal (RIF) del cliente';
        COMMENT ON COLUMN users.document_type IS 'Tipo de documento: V, E, J, etc.';
        COMMENT ON COLUMN users.document_number IS 'Número de cédula, pasaporte, etc.';
        COMMENT ON COLUMN users.business_name IS 'Razón social si es persona jurídica';
        COMMENT ON COLUMN users.fiscal_address IS 'Domicilio fiscal del cliente';
        COMMENT ON COLUMN users.phone IS 'Teléfono de contacto';
        COMMENT ON COLUMN users.is_contributor IS 'Indica si el cliente requiere factura con RIF a efectos tributarios';
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_users_document", table_name="users")
    op.drop_index("idx_users_rif", table_name="users")

    # Drop columns
    op.drop_column("users", "is_contributor")
    op.drop_column("users", "phone")
    op.drop_column("users", "fiscal_address")
    op.drop_column("users", "business_name")
    op.drop_column("users", "document_number")
    op.drop_column("users", "document_type")
    op.drop_column("users", "rif")