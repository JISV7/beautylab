"""Learning Path model."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.learning_path_course import LearningPathCourse
    from app.models.product import Product


class LearningPath(Base, TimestampMixin):
    """Learning Path model for structured course sequences."""

    __tablename__ = "learning_paths"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    product_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        unique=True,
    )
    published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="learning_path")
    learning_path_courses: Mapped[list["LearningPathCourse"]] = relationship(
        "LearningPathCourse",
        back_populates="learning_path",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<LearningPath(id={self.id}, title={self.title}, slug={self.slug})>"
