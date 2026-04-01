"""Control Number Range model."""

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice
    from app.models.printer import Printer


class ControlNumberRange(Base, TimestampMixin):
    """Control Number Range model for invoice numbering."""

    __tablename__ = "control_number_ranges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    printer_id: Mapped[int] = mapped_column(
        ForeignKey("printers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    start_number: Mapped[str] = mapped_column(String(20), nullable=False)
    end_number: Mapped[str] = mapped_column(String(20), nullable=False)
    current_number: Mapped[str] = mapped_column(String(20), nullable=False, default="0")
    assigned_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    printer: Mapped["Printer"] = relationship("Printer", back_populates="control_number_ranges")
    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice", back_populates="control_number_range"
    )

    def __repr__(self) -> str:
        return f"<ControlNumberRange(id={self.id}, printer={self.printer_id})>"
