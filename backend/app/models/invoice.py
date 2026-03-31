"""Invoice models."""

from datetime import date, datetime, time
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    Time,
    Uuid,
)
from sqlalchemy.dialects.postgresql import NUMERIC
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.license import License
    from app.models.payment import Payment
    from app.models.point_of_sale import PointOfSale
    from app.models.product import Product
    from app.models.user import User


class Invoice(Base, TimestampMixin):
    """Invoice model for billing."""

    __tablename__ = "invoices"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    control_number: Mapped[str] = mapped_column(String(20), nullable=False)
    control_number_range_id: Mapped[int] = mapped_column(
        ForeignKey("control_number_ranges.id"),
        nullable=False,
    )
    point_of_sale_id: Mapped[int] = mapped_column(
        ForeignKey("point_of_sale.id"),
        nullable=False,
    )
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    issue_time: Mapped[time] = mapped_column(Time, nullable=False)
    client_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    client_rif: Mapped[str | None] = mapped_column(String(20), nullable=True)
    client_business_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_document_type: Mapped[str | None] = mapped_column(String(10), nullable=True)
    client_document_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    client_fiscal_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    discount_total: Mapped[Decimal] = mapped_column(
        NUMERIC(10, 2), nullable=False, default=Decimal("0.00")
    )
    tax_total: Mapped[Decimal] = mapped_column(
        NUMERIC(10, 2), nullable=False, default=Decimal("0.00")
    )
    total: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="issued")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    client: Mapped[Optional["User"]] = relationship("User", back_populates="invoices")
    point_of_sale: Mapped["PointOfSale"] = relationship("PointOfSale", back_populates="invoices")
    lines: Mapped[list["InvoiceLine"]] = relationship(
        "InvoiceLine", back_populates="invoice", cascade="all, delete-orphan"
    )
    adjustments: Mapped[list["InvoiceAdjustment"]] = relationship(
        "InvoiceAdjustment", back_populates="invoice", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="invoice", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, number={self.invoice_number})>"


class InvoiceLine(Base):
    """Invoice line item model."""

    __tablename__ = "invoice_lines"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(NUMERIC(5, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(
        NUMERIC(10, 2), nullable=False, default=Decimal("0.00")
    )
    discount: Mapped[Decimal] = mapped_column(
        NUMERIC(10, 2), nullable=False, default=Decimal("0.00")
    )
    line_total: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    is_exempt: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="lines")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="invoice_lines")
    licenses: Mapped[list["License"]] = relationship("License", back_populates="invoice_line")

    def __repr__(self) -> str:
        return f"<InvoiceLine(id={self.id}, invoice={self.invoice_id}, product={self.product_id})>"


class InvoiceAdjustment(Base):
    """Invoice adjustment model (discounts, surcharges)."""

    __tablename__ = "invoice_adjustments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    adjustment_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # discount, bonus, surcharge
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(NUMERIC(10, 2), nullable=False)
    is_percentage: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="adjustments")

    def __repr__(self) -> str:
        return f"<InvoiceAdjustment(id={self.id}, type={self.adjustment_type})>"
