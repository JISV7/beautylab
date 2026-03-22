"""Licenses router for gift and corporate license management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.user import User
from app.schemas.license import (
    CorporateDashboardResponse,
    LicenseAssignRequest,
    LicenseListResponse,
    LicensePurchaseRequest,
    LicenseRedeemRequest,
    LicenseResponse,
    LicenseRevokeRequest,
    LicenseStatusResponse,
    LicenseWithDetails,
)
from app.services.enrollment_service import EnrollmentService
from app.services.license_service import (
    LicenseAlreadyRedeemedError,
    LicenseInvalidError,
    LicenseNotFoundError,
    LicenseService,
)

router = APIRouter(prefix="/licenses", tags=["Licenses"])


@router.post("/purchase", response_model=list[LicenseResponse], status_code=status.HTTP_201_CREATED)
async def purchase_licenses(
    request: LicensePurchaseRequest,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> list[LicenseResponse]:
    """
    Purchase licenses for courses or learning paths.

    Supports bulk purchases with quantity > 1.
    Each unit generates a unique license code.

    **Body:**
    ```json
    {
        "items": [
            {"product_id": "uuid", "quantity": 2, "license_type": "gift"},
            {"product_id": "uuid", "quantity": 5, "license_type": "corporate"}
        ],
        "notes": "Optional notes"
    }
    ```

    **License types:**
    - `gift`: Individual gift licenses
    - `corporate`: Corporate licenses with management features
    - `bulk`: Wholesale/reseller licenses
    """
    license_service = LicenseService(db)

    try:
        licenses = await license_service.purchase_licenses(
            request=request,
            purchased_by_user_id=current_user.id,
        )
    except LicenseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return [LicenseResponse.model_validate(lic) for lic in licenses]


@router.post("/redeem", response_model=LicenseResponse)
async def redeem_license(
    request: LicenseRedeemRequest,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LicenseResponse:
    """
    Redeem a license code to gain course access.

    **Body:**
    ```json
    {
        "license_code": "uuid-of-license"
    }
    ```

    Creates an enrollment record for the user.
    """
    license_service = LicenseService(db)
    enrollment_service = EnrollmentService(db)

    try:
        # Redeem the license
        license_obj = await license_service.redeem_license(
            license_code=request.license_code,
            user_id=current_user.id,
        )

        # Create enrollment for the course
        if license_obj.course_id:
            await enrollment_service.create_enrollment(
                user_id=current_user.id,
                course_id=license_obj.course_id,
                allow_duplicate=False,
            )

    except LicenseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except LicenseAlreadyRedeemedError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except LicenseInvalidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return LicenseResponse.model_validate(license_obj)


@router.get("/", response_model=LicenseListResponse)
async def list_user_licenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LicenseListResponse:
    """Get all licenses purchased by the current user."""
    license_service = LicenseService(db)

    licenses, total = await license_service.get_user_purchased_licenses(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size

    return LicenseListResponse(
        licenses=[LicenseResponse.model_validate(lic) for lic in licenses],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/redeemable", response_model=list[LicenseResponse])
async def list_redeemable_licenses(
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> list[LicenseResponse]:
    """Get licenses that haven't been redeemed yet (ready to gift)."""
    license_service = LicenseService(db)

    licenses = await license_service.get_user_redeemable_licenses(user_id=current_user.id)

    return [LicenseResponse.model_validate(lic) for lic in licenses]


@router.get("/{license_code}/status", response_model=LicenseStatusResponse)
async def check_license_status(
    license_code: UUID,
    db: AsyncSession = Depends(get_db),
) -> LicenseStatusResponse:
    """
    Check license status and details.

    Public endpoint - anyone can check if a license code is valid.
    Useful for gift recipients verifying their code before redeeming.
    """
    license_service = LicenseService(db)

    status_data = await license_service.check_license_status(license_code=license_code)

    return LicenseStatusResponse(**status_data)


@router.get("/{license_id}", response_model=LicenseWithDetails)
async def get_license(
    license_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LicenseWithDetails:
    """Get a specific license by ID."""
    license_service = LicenseService(db)

    license_obj = await license_service.get_license_by_id(license_id)

    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License {license_id} not found",
        )

    # Check ownership
    if license_obj.purchased_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this license",
        )

    return LicenseWithDetails.model_validate(license_obj)


@router.post("/{license_id}/assign", response_model=LicenseWithDetails)
async def assign_license(
    license_id: UUID,
    request: LicenseAssignRequest,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LicenseWithDetails:
    """
    Assign a corporate license to an employee.

    Only available for corporate-type licenses.
    """
    license_service = LicenseService(db)

    try:
        await license_service.assign_license(
            license_id=license_id,
            assigned_by_user_id=current_user.id,
            assigned_to_user_id=request.assigned_to_user_id,
            corporate_note=request.corporate_note,
        )
    except LicenseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except LicenseInvalidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    # Get updated license with assignments
    license_obj = await license_service.get_license_by_id(license_id)
    return LicenseWithDetails.model_validate(license_obj)


@router.post("/{license_id}/revoke", response_model=LicenseResponse)
async def revoke_license(
    license_id: UUID,
    request: LicenseRevokeRequest,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LicenseResponse:
    """
    Revoke a corporate license (if not yet redeemed).

    Only available for corporate-type licenses with status 'pending'.
    """
    license_service = LicenseService(db)

    try:
        license_obj = await license_service.revoke_license(
            license_id=license_id,
            revoked_by_user_id=current_user.id,
            reason=request.reason,
        )
    except LicenseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except LicenseInvalidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return LicenseResponse.model_validate(license_obj)


@router.get("/corporate/dashboard", response_model=CorporateDashboardResponse)
async def corporate_dashboard(
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> CorporateDashboardResponse:
    """
    Corporate dashboard showing all purchased licenses.

    Shows:
    - Total purchased, redeemed, available, cancelled
    - List of all licenses with assignments
    - Employee assignment tracking
    """
    license_service = LicenseService(db)

    dashboard_data = await license_service.get_corporate_dashboard(user_id=current_user.id)

    return CorporateDashboardResponse(
        total_purchased=dashboard_data["total_purchased"],
        total_redeemed=dashboard_data["total_redeemed"],
        total_available=dashboard_data["total_available"],
        total_cancelled=dashboard_data["total_cancelled"],
        licenses=[LicenseWithDetails.model_validate(lic) for lic in dashboard_data["licenses"]],
        assignments=[],  # Would populate from dashboard_data if we fetched assignments
    )
