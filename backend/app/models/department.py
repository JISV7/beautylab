"""Department model."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User


class Department(Base, TimestampMixin):
    """Department inside a company."""

    __tablename__ = "departments"
    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_departments_company_name"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    company_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="departments")
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="department",
        foreign_keys="User.department_id",
    )

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name={self.name})>"
