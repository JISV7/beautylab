"""Category model."""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.course import Course


class Category(Base, TimestampMixin):
    """Category model for course organization with hierarchical support."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    parent: Mapped[Optional["Category"]] = relationship(
        "Category", back_populates="children", remote_side=[id]
    )
    children: Mapped[list["Category"]] = relationship("Category", back_populates="parent")
    courses: Mapped[list["Course"]] = relationship("Course", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name}, slug={self.slug})>"
