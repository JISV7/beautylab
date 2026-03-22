"""License schemas for gift and corporate licenses."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LicensePurchaseItem(BaseModel):
    """Item for license purchase."""

    product_id: UUID
    quantity: int = Field(..., ge=1, description="Number of licenses to purchase")
    license_type: Literal["gift", "corporate", "bulk"] = "gift"


class LicensePurchaseRequest(BaseModel):
    """Request to purchase multiple licenses."""

    items: list[LicensePurchaseItem]
    notes: str | None = None


class LicenseRedeemRequest(BaseModel):
    """Request to redeem a license."""

    license_code: UUID


class LicenseAssignRequest(BaseModel):
    """Request to assign a license to an employee."""

    assigned_to_user_id: UUID
    corporate_note: str | None = None


class LicenseRevokeRequest(BaseModel):
    """Request to revoke a license."""

    reason: str | None = None


class LicenseResponse(BaseModel):
    """Schema for license response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    license_code: UUID
    product_id: UUID
    product_name: str | None = None
    course_id: UUID | None = None
    course_title: str | None = None
    learning_path_id: UUID | None = None
    learning_path_title: str | None = None
    license_type: str
    status: str
    quantity: int
    purchased_by_user_id: UUID | None = None
    redeemed_by_user_id: UUID | None = None
    redeemed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class LicenseWithDetails(LicenseResponse):
    """License with assignment details."""

    assignments: list["LicenseAssignmentResponse"] = []


class LicenseAssignmentResponse(BaseModel):
    """Schema for license assignment response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    license_id: UUID
    assigned_to_user_id: UUID | None = None
    assigned_to_email: str | None = None
    assigned_by_user_id: UUID | None = None
    corporate_note: str | None = None
    created_at: datetime


class LicenseStatusResponse(BaseModel):
    """Schema for license status check."""

    license_code: UUID
    status: str
    license_type: str
    product_name: str
    course_title: str | None = None
    learning_path_title: str | None = None
    is_redeemable: bool
    message: str


class LicenseListResponse(BaseModel):
    """Schema for license list response."""

    licenses: list[LicenseResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class CorporateDashboardResponse(BaseModel):
    """Schema for corporate license dashboard."""

    total_purchased: int
    total_redeemed: int
    total_available: int
    total_cancelled: int
    licenses: list[LicenseWithDetails]
    assignments: list[LicenseAssignmentResponse]
