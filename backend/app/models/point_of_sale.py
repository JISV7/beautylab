"""Point of Sale model."""

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice


class PointOfSale(Base, TimestampMixin):
    """Point of Sale model for invoice numbering."""

    __tablename__ = "point_of_sale"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    prefix: Mapped[str | None] = mapped_column(String(10), nullable=True, unique=True, index=True)
    current_invoice_number: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    # Relationships
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="point_of_sale")

    def __repr__(self) -> str:
        return f"<PointOfSale(id={self.id}, name={self.name}, prefix={self.prefix})>"
