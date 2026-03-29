"""User model."""

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.cart_item import CartItem
    from app.models.enrollment import Enrollment
    from app.models.invoice import Invoice
    from app.models.license import License, LicenseAssignment
    from app.models.payment import PaymentMethod
    from app.models.theme import Theme
    from app.models.user_role import UserRole


class User(Base, TimestampMixin):
    """User model with UUID primary key."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_theme_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("themes.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Fiscal fields (migration 004)
    rif: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    document_type: Mapped[str | None] = mapped_column(String(10), nullable=True)
    document_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    business_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fiscal_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(12), nullable=True)
    is_contributor: Mapped[bool | None] = mapped_column(Boolean, default=False)

    # Relationships
    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="[UserRole.user_id]",
    )
    preferred_theme: Mapped[Optional["Theme"]] = relationship(
        "Theme", foreign_keys=[preferred_theme_id], back_populates="users_with_preference"
    )
    created_themes: Mapped[list["Theme"]] = relationship(
        "Theme", back_populates="creator", foreign_keys="Theme.created_by"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="user", cascade="all, delete-orphan"
    )
    assigned_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="assigned_by_user",
        foreign_keys="[UserRole.assigned_by]",
    )
    # New relationships for license/billing system
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="client")
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="user")
    enrollments: Mapped[list["Enrollment"]] = relationship("Enrollment", back_populates="user")
    purchased_licenses: Mapped[list["License"]] = relationship(
        "License", foreign_keys="License.purchased_by_user_id", back_populates="purchased_by"
    )
    redeemed_licenses: Mapped[list["License"]] = relationship(
        "License", foreign_keys="License.redeemed_by_user_id", back_populates="redeemed_by"
    )
    assigned_licenses: Mapped[list["LicenseAssignment"]] = relationship(
        "LicenseAssignment",
        foreign_keys="LicenseAssignment.assigned_to_user_id",
        back_populates="assigned_to",
    )
    assigned_licenses_made: Mapped[list["LicenseAssignment"]] = relationship(
        "LicenseAssignment",
        foreign_keys="LicenseAssignment.assigned_by_user_id",
        back_populates="assigned_by",
    )
    payment_methods: Mapped[list["PaymentMethod"]] = relationship(
        "PaymentMethod", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
