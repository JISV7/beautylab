"""User model."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
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
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_theme_id: Mapped[Optional[UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("themes.id", ondelete="SET NULL"),
        nullable=True,
    )

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

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
