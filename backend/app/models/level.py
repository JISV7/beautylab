"""Level model."""

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    # Relationships
    courses: Mapped[list["Course"]] = relationship("Course", back_populates="level")

    def __repr__(self) -> str:
        return f"<Level(id={self.id}, name={self.name}, slug={self.slug})>"
