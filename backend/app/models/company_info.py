"""Company Info model."""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class CompanyInfo(Base, TimestampMixin):
    """Company information model for invoice emisor details."""

    __tablename__ = "company_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rif: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    fiscal_address: Mapped[str] = mapped_column(String(500), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    def __repr__(self) -> str:
        return f"<CompanyInfo(id={self.id}, business_name={self.business_name}, rif={self.rif})>"
