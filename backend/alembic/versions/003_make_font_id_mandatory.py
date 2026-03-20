"""Make font_id mandatory in theme configs

Revision ID: 003_make_font_id_mandatory
Revises: 002_add_theme_config_structure
Create Date: 2026-03-12

"""

import json
from typing import Sequence, Union
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import AsyncSession

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_make_font_id_mandatory"
down_revision: Union[str, None] = "002_add_theme_config_structure"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Update existing theme configs to include font_id for all typography elements.

    This migration:
    1. Finds the Roboto font in the fonts table
    2. Updates all existing theme configs to use Roboto's UUID as font_id
    3. Ensures all typography elements have both font_id and font_name fields
    """
    # Get database connection
    conn = op.get_bind()

    # Find Roboto font ID
    result = conn.execute(sa.text("SELECT id FROM fonts WHERE name = 'Roboto' LIMIT 1"))
    row = result.fetchone()

    roboto_font_id = None
    roboto_font_name = "Roboto"

    if row:
        roboto_font_id = str(row[0])
        print(f"  Found Roboto font with ID: {roboto_font_id}")
    else:
        # If Roboto doesn't exist yet, we'll skip updating font_id but still ensure structure
        print("  Warning: Roboto font not found. Font IDs will not be set.")

    # Get all themes
    themes_result = conn.execute(sa.text("SELECT id, name, config FROM themes"))
    themes = themes_result.fetchall()

    updated_count = 0

    for theme in themes:
        theme_id = theme[0]
        theme_name = theme[1]
        config = theme[2]

        if not config:
            continue

        # Parse JSON config
        try:
            config_dict = json.loads(config) if isinstance(config, str) else config
        except (json.JSONDecodeError, TypeError):
            print(f"  Skipping theme {theme_name}: invalid config JSON")
            continue

        modified = False

        # Iterate through all palettes and typography elements
        for palette_name in ["light", "dark", "accessibility"]:
            if palette_name not in config_dict:
                continue

            palette = config_dict[palette_name]
            typography = palette.get("typography", {})

            for element_name, element_config in typography.items():
                if not isinstance(element_config, dict):
                    continue

                # Update font_id if Roboto exists and font_id is missing
                if roboto_font_id and "font_id" not in element_config:
                    element_config["font_id"] = roboto_font_id
                    modified = True

                # Ensure font_name exists
                if "font_name" not in element_config:
                    # Use existing font_name if present (different casing)
                    if "fontName" in element_config:
                        element_config["font_name"] = element_config["fontName"]
                        del element_config["fontName"]
                    else:
                        element_config["font_name"] = roboto_font_name or "Roboto"
                    modified = True

        # Save updated config
        if modified:
            conn.execute(
                sa.text("UPDATE themes SET config = :config WHERE id = :theme_id"),
                {"config": json.dumps(config_dict), "theme_id": str(theme_id)},
            )
            updated_count += 1
            print(f"  Updated theme: {theme_name}")

    print(f"  Total themes updated: {updated_count}")

    # Add comment to document that font_id is now required
    op.execute("""
        COMMENT ON COLUMN themes.config IS
        'JSONB structure: {
            "light": { "colors": {...}, "typography": {...} },
            "dark": { "colors": {...}, "typography": {...} },
            "accessibility": { "colors": {...}, "typography": {...} }
        }
        
        Typography elements MUST include:
        - font_id: UUID (required, references fonts.id)
        - font_name: String (required, display name)
        - font_size: String (required, in rem units)
        - font_weight: Integer (required, 100-900)
        - color: String (required, hex color)
        - line_height: String (optional)'
    """)


def downgrade() -> None:
    """Downgrade: Remove font_id from typography elements (make optional)."""
    # Get database connection
    conn = op.get_bind()

    # Get all themes
    themes_result = conn.execute(sa.text("SELECT id, name, config FROM themes"))
    themes = themes_result.fetchall()

    for theme in themes:
        theme_id = theme[0]
        theme_name = theme[1]
        config = theme[2]

        if not config:
            continue

        # Parse JSON config
        try:
            config_dict = json.loads(config) if isinstance(config, str) else config
        except (json.JSONDecodeError, TypeError):
            continue

        modified = False

        # Iterate through all palettes and typography elements
        for palette_name in ["light", "dark", "accessibility"]:
            if palette_name not in config_dict:
                continue

            palette = config_dict[palette_name]
            typography = palette.get("typography", {})

            for element_name, element_config in typography.items():
                if not isinstance(element_config, dict):
                    continue

                # Remove font_id to make it optional again
                if "font_id" in element_config:
                    del element_config["font_id"]
                    modified = True

        # Save updated config
        if modified:
            conn.execute(
                sa.text("UPDATE themes SET config = :config WHERE id = :theme_id"),
                {"config": json.dumps(config_dict), "theme_id": str(theme_id)},
            )

    # Restore original comment
    op.execute("""
        COMMENT ON COLUMN themes.config IS
        'JSONB structure: {
            "light": { "colors": {...}, "typography": {...} },
            "dark": { "colors": {...}, "typography": {...} },
            "accessibility": { "colors": {...}, "typography": {...} }
        }'
    """)
