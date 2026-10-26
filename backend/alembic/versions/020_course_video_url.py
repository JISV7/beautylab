"""Add video_url to courses

Revision ID: 020_course_video_url
Revises: 019_multi_home_config
Create Date: 2026-10-25

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "020_course_video_url"
down_revision: str | None = "019_multi_home_config"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column("video_url", sa.String(length=1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("courses", "video_url")
