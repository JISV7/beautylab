"""Payment schemas for split payment support."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ==================== Payment Method Schemas ====================


class PaymentMethodBase(BaseModel):
    """Base payment method schema."""

    method_type: Literal["credit_card", "debit_card", "cash_deposit", "bank_transfer"]
    is_default: bool = False


class PaymentMethodCreate(PaymentMethodBase):
    """Schema for creating a payment method."""

    pass


class PaymentMethodResponse(BaseModel):
    """Schema for payment method response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    method_type: str
    is_default: bool
    created_at: datetime


# ==================== Payment Detail Schemas ====================


class CreditCardDetails(BaseModel):
    """Credit card payment details."""

    card_holder_name: str = Field(..., max_length=255)
    card_number: str = Field(..., min_length=13, max_length=19)
    expiry_month: int = Field(..., ge=1, le=12)
    expiry_year: int = Field(..., ge=2024)
    cvv: str = Field(..., min_length=3, max_length=4)
    card_brand: str = Field(..., description="visa, mastercard, amex, etc.")

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, v: str) -> str:
        """Validate card number contains only digits."""
        if not v.replace(" ", "").isdigit():
            raise ValueError("Card number must contain only digits")
        return v.replace(" ", "")

    @field_validator("cvv")
    @classmethod
    def validate_cvv(cls, v: str) -> str:
        """Validate CVV contains only digits."""
        if not v.isdigit():
            raise ValueError("CVV must contain only digits")
        return v


class DebitCardDetails(BaseModel):
    """Debit card payment details."""

    card_holder_name: str = Field(..., max_length=255)
    card_number: str = Field(..., min_length=13, max_length=19)
    expiry_month: int = Field(..., ge=1, le=12)
    expiry_year: int = Field(..., ge=2024)
    cvv: str = Field(..., min_length=3, max_length=4)
    bank_name: str = Field(..., max_length=255, description="Bank name")

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, v: str) -> str:
        """Validate card number contains only digits."""
        if not v.replace(" ", "").isdigit():
            raise ValueError("Card number must contain only digits")
        return v.replace(" ", "")

    @field_validator("cvv")
    @classmethod
    def validate_cvv(cls, v: str) -> str:
        """Validate CVV contains only digits."""
        if not v.isdigit():
            raise ValueError("CVV must contain only digits")
        return v


class CashDepositDetails(BaseModel):
    """Cash deposit payment details."""

    deposit_reference: str = Field(..., max_length=100, description="Bank reference number")
    deposit_bank: str = Field(..., max_length=255, description="Bank where deposit was made")
    deposit_date: date


class BankTransferDetails(BaseModel):
    """Bank transfer payment details."""

    transfer_reference: str = Field(..., max_length=100)
    bank_name: str = Field(..., max_length=255)
    transfer_date: date
    account_holder: str = Field(..., max_length=255)


# ==================== Payment Schemas ====================


class PaymentBase(BaseModel):
    """Base payment schema."""

    amount: Decimal = Field(..., gt=0, description="Payment amount")


class PaymentCreate(PaymentBase):
    """Schema for creating a payment."""

    method_type: str
    details: CreditCardDetails | DebitCardDetails | CashDepositDetails | BankTransferDetails


class PaymentResponse(BaseModel):
    """Schema for payment response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    invoice_id: UUID
    payment_method_id: UUID | None = None
    amount: Decimal
    status: str
    transaction_reference: str | None = None
    created_at: datetime


class PaymentWithDetails(PaymentResponse):
    """Payment with method details."""

    method_type: str | None = None
    card_last4: str | None = None
    card_brand: str | None = None
    bank_name: str | None = None
    deposit_reference: str | None = None


# ==================== Split Payment Schemas ====================


class SplitPaymentItem(BaseModel):
    """Individual payment in a split payment."""

    method_type: Literal["credit_card", "debit_card", "cash_deposit", "bank_transfer"]
    amount: Decimal = Field(..., gt=0)
    details: CreditCardDetails | DebitCardDetails | CashDepositDetails | BankTransferDetails


class SplitPaymentRequest(BaseModel):
    """Request for split payment."""

    invoice_id: UUID
    payments: list[SplitPaymentItem]

    @model_validator(mode="after")
    def validate_total_amount(self):
        """Validate that sum of payments equals invoice total.

        Note: Actual validation against invoice total happens in service layer.
        """
        if not self.payments:
            raise ValueError("At least one payment is required")
        return self


class SplitPaymentResponse(BaseModel):
    """Response for split payment processing."""

    payments: list[PaymentResponse]
    total_paid: Decimal
    remaining_balance: Decimal
    is_fully_paid: bool


class PaymentListResponse(BaseModel):
    """Schema for payment list response."""

    payments: list[PaymentResponse]
    total: int
