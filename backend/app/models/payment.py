"""Payment models for split payment support."""

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import (
    CHAR,
    BigInteger,
    Boolean,
    Date,
    ForeignKey,
    Integer,
    String,
    Uuid,
)
from sqlalchemy.dialects.postgresql import NUMERIC
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice
    from app.models.user import User


class PaymentMethod(Base, TimestampMixin):
    """User saved payment method."""

    __tablename__ = "payment_methods"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    method_type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="payment_methods")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="payment_method")

    def __repr__(self) -> str:
        return f"<PaymentMethod(id={self.id}, user={self.user_id}, type={self.method_type})>"


class Payment(Base, TimestampMixin):
    """Individual payment transaction (supports split payments)."""

    __tablename__ = "payments"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    invoice_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_method_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payment_methods.id", ondelete="SET NULL"),
        nullable=True,
    )
    amount: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    transaction_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")
    payment_method: Mapped[Optional["PaymentMethod"]] = relationship(
        "PaymentMethod", back_populates="payments"
    )
    details: Mapped[Optional["PaymentDetail"]] = relationship(
        "PaymentDetail", back_populates="payment", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, invoice={self.invoice_id}, amount={self.amount})>"


class PaymentDetail(Base):
    """Sensitive payment information (hashed card numbers, etc.)."""

    __tablename__ = "payment_details"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    payment_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    card_holder_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    card_number_last4: Mapped[str | None] = mapped_column(CHAR(4), nullable=True)
    card_number_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    card_expiry_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    card_expiry_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    card_cvv_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    card_brand: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deposit_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    deposit_bank: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deposit_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)

    # Relationships
    payment: Mapped["Payment"] = relationship("Payment", back_populates="details")

    def __repr__(self) -> str:
        return f"<PaymentDetail(payment={self.payment_id})>"
