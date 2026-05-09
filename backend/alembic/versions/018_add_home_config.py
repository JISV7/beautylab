"""Add home_configs table for multimedia and carousel management

Revision ID: 018_add_home_config
Revises: 017_printer_auth_date
Create Date: 2026-05-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "018_add_home_config"
down_revision: str | None = "017_printer_auth_date"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create home_configs table
    op.create_table(
        "home_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "config",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Initialize with default config
    op.execute("""
        INSERT INTO home_configs (id, config)
        VALUES (1, '{
            "video": {
                "enabled": false,
                "url": "",
                "title": "Promotional Video",
                "description": "",
                "autoplay": false,
                "default_subtitle": "",
                "default_audio": "",
                "subtitles": [],
                "audio_tracks": []
            },
            "carousel": {
                "max_width": 1920,
                "max_height": 1080,
                "aspect_ratio": "16:9",
                "slides": []
            }
        }'::jsonb)
    """)

    # Create trigger for updated_at
    op.execute("""
        CREATE TRIGGER update_home_configs_updated_at
        BEFORE UPDATE ON home_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_home_configs_updated_at ON home_configs")
    op.drop_table("home_configs")
