"""License models for gift and corporate licenses."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.invoice import InvoiceLine
    from app.models.learning_path import LearningPath
    from app.models.product import Product
    from app.models.user import User


class License(Base, TimestampMixin):
    """License model for redeemable course/path access."""

    __tablename__ = "licenses"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    license_code: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        unique=True,
        nullable=False,
        default=__import__("uuid").uuid4,
    )
    product_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    course_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=True,
    )
    learning_path_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=True,
    )
    invoice_line_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("invoice_lines.id", ondelete="SET NULL"),
        nullable=True,
    )
    purchased_by_user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    redeemed_by_user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    license_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="gift"
    )  # gift, corporate, bulk
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, active, redeemed, expired, cancelled
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    redeemed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="licenses")
    course: Mapped[Optional["Course"]] = relationship("Course", back_populates="licenses")
    learning_path: Mapped[Optional["LearningPath"]] = relationship(
        "LearningPath", back_populates="licenses"
    )
    invoice_line: Mapped[Optional["InvoiceLine"]] = relationship(
        "InvoiceLine", back_populates="licenses"
    )
    purchased_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[purchased_by_user_id],
        back_populates="purchased_licenses",
    )
    redeemed_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[redeemed_by_user_id],
        back_populates="redeemed_licenses",
    )
    assignments: Mapped[list["LicenseAssignment"]] = relationship(
        "LicenseAssignment", back_populates="license", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<License(id={self.id}, code={self.license_code}, status={self.status})>"


class LicenseAssignment(Base):
    """License assignment for corporate license management."""

    __tablename__ = "license_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    license_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("licenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_to_user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_by_user_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    corporate_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)

    # Relationships
    license: Mapped["License"] = relationship("License", back_populates="assignments")
    assigned_to: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_to_user_id],
        back_populates="assigned_licenses",
    )
    assigned_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_by_user_id],
        back_populates="assigned_licenses_made",
    )

    def __repr__(self) -> str:
        return (
            f"<LicenseAssignment(license={self.license_id}, "
            f"assigned_to={self.assigned_to_user_id})>"
        )
