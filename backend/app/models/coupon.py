"""Coupon model for discount codes."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Uuid
from sqlalchemy.dialects.postgresql import NUMERIC
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice
    from app.models.user import User


class Coupon(Base, TimestampMixin):
    """Coupon model for discount codes."""

    __tablename__ = "coupons"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    discount_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="percentage"
    )  # percentage, fixed
    discount_value: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    min_purchase: Mapped[Decimal] = mapped_column(
        NUMERIC(10, 2), nullable=False, default=Decimal("0.00")
    )
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    usages: Mapped[list["CouponUsage"]] = relationship(
        "CouponUsage", back_populates="coupon", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Coupon(id={self.id}, code={self.code}, type={self.discount_type})>"


class CouponUsage(Base):
    """Track coupon usage by users."""

    __tablename__ = "coupon_usages"

    coupon_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    invoice_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        primary_key=True,
    )
    used_at: Mapped[datetime] = mapped_column(default=datetime.now)

    # Relationships
    coupon: Mapped["Coupon"] = relationship("Coupon", back_populates="usages")
    user: Mapped["User"] = relationship("User")
    invoice: Mapped["Invoice"] = relationship("Invoice")

    def __repr__(self) -> str:
        return (
            f"<CouponUsage(coupon={self.coupon_id}, "
            f"user={self.user_id}, invoice={self.invoice_id})>"
        )
