"""Level model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import TIMESTAMP, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.course import Course


class Level(Base):
    """Level model for course difficulty levels."""

    __tablename__ = "levels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=True
    )

    # Relationships
    courses: Mapped[list["Course"]] = relationship("Course", back_populates="level")

    def __repr__(self) -> str:
        return f"<Level(id={self.id}, name={self.name}, slug={self.slug})>"
