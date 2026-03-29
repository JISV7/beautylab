"""Printer model."""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Printer(Base, TimestampMixin):
    """Authorized digital printer model for invoices."""

    __tablename__ = "printers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rif: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    authorization_providence: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:
        return f"<Printer(id={self.id}, business_name={self.business_name}, rif={self.rif})>"
