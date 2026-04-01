"""Printer model."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.control_number_range import ControlNumberRange


class Printer(Base, TimestampMixin):
    """Authorized digital printer model for invoices."""

    __tablename__ = "printers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rif: Mapped[str] = mapped_column(String(20), nullable=False, index=True, unique=True)
    authorization_providence: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, index=True, server_default="true"
    )

    # Relationships
    control_number_ranges: Mapped[list["ControlNumberRange"]] = relationship(
        "ControlNumberRange", back_populates="printer"
    )

    def __repr__(self) -> str:
        return (
            f"<Printer(id={self.id}, business_name={self.business_name}, "
            f"rif={self.rif}, is_active={self.is_active})>"
        )
