"""Company Info model."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice


class CompanyInfo(Base, TimestampMixin):
    """Company information model for invoice emisor details."""

    __tablename__ = "company_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rif: Mapped[str] = mapped_column(String(20), nullable=False, index=True, unique=True)
    fiscal_address: Mapped[str] = mapped_column(String(500), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, index=True, server_default="false"
    )

    # Relationships
    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice", back_populates="company", foreign_keys="Invoice.company_info_id"
    )

    def __repr__(self) -> str:
        return (
            f"<CompanyInfo(id={self.id}, business_name={self.business_name}, "
            f"rif={self.rif}, is_active={self.is_active})>"
        )
