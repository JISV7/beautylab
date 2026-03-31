"""Payment schemas for split payment support."""

import re
from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ==================== Payment Method Schemas ====================


class PaymentMethodBase(BaseModel):
    """Base payment method schema."""

    method_type: Literal[
        "credit_card",
        "debit_card",
        "cash_deposit",
        "bank_transfer",
        "zelle",
        "pago_movil",
        "paypal",
    ]
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


class ZelleDetails(BaseModel):
    """Zelle payment details."""

    sender_name: str = Field(..., max_length=255, description="Sender's full name")
    sender_email: str = Field(..., description="Sender's email address")
    sender_phone: str | None = Field(None, max_length=20, description="Sender's phone number")
    recipient_email: str = Field(..., description="Recipient's email address")
    confirmation_code: str = Field(..., max_length=20, description="Zelle confirmation code")

    @field_validator("sender_email", "recipient_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format."""
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("sender_phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        """Validate phone number format (optional)."""
        if v is None:
            return v
        cleaned = re.sub(r"[^\d+]", "", v)
        if len(cleaned) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return cleaned


class PagoMovilDetails(BaseModel):
    """Pago Móvil payment details (Venezuela)."""

    bank_name: str = Field(..., max_length=255, description="Bank name")
    phone_number: str = Field(..., max_length=20, description="Phone number")
    rif_cedula: str = Field(..., max_length=20, description="RIF or Cédula number")
    reference_code: str = Field(..., max_length=50, description="Payment reference code")
    amount: Decimal = Field(..., gt=0, description="Payment amount")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format."""
        cleaned = re.sub(r"[^\d]", "", v)
        if len(cleaned) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return cleaned

    @field_validator("rif_cedula")
    @classmethod
    def validate_rif_cedula(cls, v: str) -> str:
        """Validate RIF or Cédula format."""
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("RIF/Cédula is required")
        # RIF format: J/V/E/G + dash + numbers, or just numbers for Cédula
        if cleaned.startswith(("J", "V", "E", "G")):
            if len(cleaned) < 9:
                raise ValueError("RIF must have at least 9 characters (e.g., J-123456789)")
        elif cleaned.isdigit():
            if len(cleaned) < 6:
                raise ValueError("Cédula must have at least 6 digits")
        return cleaned


class PaypalDetails(BaseModel):
    """PayPal payment details."""

    paypal_email: str = Field(..., description="PayPal account email")
    transaction_id: str = Field(..., max_length=50, description="PayPal transaction ID")
    payer_name: str = Field(..., max_length=255, description="Payer's full name")

    @field_validator("paypal_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format."""
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("transaction_id")
    @classmethod
    def validate_transaction_id(cls, v: str) -> str:
        """Validate PayPal transaction ID format."""
        # PayPal transaction IDs are typically alphanumeric, 13-17 characters
        if len(v) < 5:
            raise ValueError("Transaction ID must be at least 5 characters")
        return v


# ==================== Payment Schemas ====================


class PaymentBase(BaseModel):
    """Base payment schema."""

    amount: Decimal = Field(..., gt=0, description="Payment amount")


class PaymentCreate(PaymentBase):
    """Schema for creating a payment."""

    method_type: str
    details: (
        CreditCardDetails
        | DebitCardDetails
        | CashDepositDetails
        | BankTransferDetails
        | ZelleDetails
        | PagoMovilDetails
        | PaypalDetails
    )


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
    deposit_bank: str | None = None
    zelle_sender_email: str | None = None
    zelle_confirmation_code: str | None = None
    pago_movil_phone: str | None = None
    pago_movil_rif: str | None = None
    pago_movil_reference: str | None = None
    paypal_email: str | None = None
    paypal_transaction_id: str | None = None


# ==================== Split Payment Schemas ====================


class SplitPaymentItem(BaseModel):
    """Individual payment in a split payment."""

    method_type: Literal[
        "credit_card",
        "debit_card",
        "cash_deposit",
        "bank_transfer",
        "zelle",
        "pago_movil",
        "paypal",
    ]
    amount: Decimal = Field(..., gt=0)
    details: (
        CreditCardDetails
        | DebitCardDetails
        | CashDepositDetails
        | BankTransferDetails
        | ZelleDetails
        | PagoMovilDetails
        | PaypalDetails
    )


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
