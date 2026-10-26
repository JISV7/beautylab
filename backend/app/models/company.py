"""Company (tenant) model."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User


class Company(Base, TimestampMixin):
    """Company account that groups departments and employees."""

    __tablename__ = "companies"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rif: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    sector: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Relationships
    departments: Mapped[list["Department"]] = relationship(
        "Department",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="company",
        foreign_keys="User.company_id",
    )

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name={self.name})>"
