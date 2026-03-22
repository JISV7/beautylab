"""Add theme config structure validation and font usage tracking

Revision ID: 002_add_theme_config_structure
Revises: 7d0e2068b0eb
Create Date: 2026-03-07

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_add_theme_config_structure"
down_revision: str | None = "7d0e2068b0eb"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add font_usage column to fonts table to track which themes use this font
    # This is a JSONB array storing theme IDs and palette modes
    op.add_column(
        "fonts",
        sa.Column(
            "font_usage",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            default=lambda: "[]",
            server_default=sa.text("'[]'::jsonb"),
        ),
    )

    # Add index on font_usage for faster lookups
    op.create_index(
        "idx_fonts_font_usage",
        "fonts",
        ["font_usage"],
        unique=False,
        postgresql_using="gin",
    )

    # Add check constraint comment for theme config structure
    # Note: PostgreSQL doesn't support complex JSONB validation via CHECK constraints
    # Validation is done at application level
    op.execute("""
        COMMENT ON COLUMN themes.config IS
        'JSONB structure: {
            "light": { "colors": {...}, "typography": {...} },
            "dark": { "colors": {...}, "typography": {...} },
            "accessibility": { "colors": {...}, "typography": {...} }
        }'
    """)

    # Add comment to fonts.font_usage
    op.execute("""
        COMMENT ON COLUMN fonts.font_usage IS
        'JSONB array tracking theme usage: [
            { "theme_id": "uuid", "palette": "light|dark|accessibility", "element": "h1|h2|...|p" },
            ...
        ]'
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_fonts_font_usage", table_name="fonts")

    # Drop columns
    op.drop_column("fonts", "font_usage")
