"""Product model."""

from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import Boolean, String, Text, Uuid
from sqlalchemy.dialects.postgresql import NUMERIC
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.cart_item import CartItem
    from app.models.course import Course
    from app.models.invoice import InvoiceLine
    from app.models.learning_path import LearningPath
    from app.models.license import License


class Product(Base, TimestampMixin):
    """Product model for billable items."""

    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    price: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(
        NUMERIC(5, 2), nullable=False, default=Decimal("16.00")
    )
    tax_type: Mapped[str] = mapped_column(String(20), nullable=False, default="gravado")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Relationships
    course: Mapped[Optional["Course"]] = relationship(
        "Course", back_populates="product", uselist=False
    )
    learning_path: Mapped[Optional["LearningPath"]] = relationship(
        "LearningPath", back_populates="product", uselist=False
    )
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")
    invoice_lines: Mapped[list["InvoiceLine"]] = relationship(
        "InvoiceLine", back_populates="product"
    )
    licenses: Mapped[list["License"]] = relationship("License", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, sku={self.sku})>"
