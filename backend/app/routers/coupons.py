"""Coupons router for discount code management."""

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, RequireAdmin
from app.database import get_db
from app.models.user import User
from app.schemas.coupon import (
    CouponCreate,
    CouponListResponse,
    CouponResponse,
    CouponUpdate,
    CouponUsageResponse,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.services.coupon_service import (
    CouponAlreadyUsedError,
    CouponInvalidError,
    CouponMaxUsesError,
    CouponMinPurchaseError,
    CouponNotFoundError,
    CouponService,
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.get("/", response_model=CouponListResponse)
async def list_coupons(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _admin_user: User = Depends(RequireAdmin),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    is_active: bool | None = None,
) -> CouponListResponse:
    """
    List all coupons (admin only).

    Optional filter by is_active status.
    """
    coupon_service = CouponService(db)

    coupons, total = await coupon_service.get_all_coupons(
        page=page,
        page_size=page_size,
        is_active=is_active,
    )

    total_pages = (total + page_size - 1) // page_size

    return CouponListResponse(
        coupons=[CouponResponse.model_validate(c) for c in coupons],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _admin_user: User = Depends(RequireAdmin),
    coupon_data: CouponCreate = Body(...),
) -> CouponResponse:
    """
    Create a new coupon (admin only).

    **Body:**
    ```json
    {
        "code": "WELCOME10",
        "discount_type": "percentage",
        "discount_value": 10.00,
        "min_purchase": 50.00,
        "max_uses": 100,
        "expires_at": "2026-12-31T23:59:59",
        "is_active": true
    }
    ```
    """
    coupon_service = CouponService(db)

    try:
        coupon = await coupon_service.create_coupon(coupon_data=coupon_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return CouponResponse.model_validate(coupon)


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _admin_user: User = Depends(RequireAdmin),
) -> CouponResponse:
    """Get a specific coupon by ID (admin only)."""
    coupon_service = CouponService(db)

    coupon = await coupon_service.get_coupon_by_id(coupon_id)

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon {coupon_id} not found",
        )

    return CouponResponse.model_validate(coupon)


@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _admin_user: User = Depends(RequireAdmin),
    coupon_data: CouponUpdate = Body(...),
) -> CouponResponse:
    """Update an existing coupon (admin only)."""
    coupon_service = CouponService(db)

    try:
        coupon = await coupon_service.update_coupon(
            coupon_id=coupon_id,
            coupon_data=coupon_data,
        )
    except CouponNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return CouponResponse.model_validate(coupon)


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(
    coupon_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    _admin_user: User = Depends(RequireAdmin),
) -> None:
    """
    Delete (deactivate) a coupon (admin only).

    Soft delete - sets is_active to False.
    """
    coupon_service = CouponService(db)

    try:
        await coupon_service.delete_coupon(coupon_id=coupon_id)
    except CouponNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    request: CouponValidateRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CouponValidateResponse:
    """
    Validate a coupon code for checkout.

    **Body:**
    ```json
    {
        "code": "WELCOME10",
        "cart_total": 100.00
    }
    ```

    Returns discount amount and final total.
    Public endpoint - can be used before authentication.
    """
    coupon_service = CouponService(db)

    try:
        result = await coupon_service.validate_coupon(
            request=request,
            user_id=current_user.id,
        )
    except CouponNotFoundError as e:
        return CouponValidateResponse(
            valid=False,
            coupon=None,
            discount_amount=Decimal("0.00"),
            message=str(e),
            final_total=None,
        )
    except CouponInvalidError as e:
        return CouponValidateResponse(
            valid=False,
            coupon=None,
            discount_amount=Decimal("0.00"),
            message=str(e),
            final_total=None,
        )
    except CouponMaxUsesError as e:
        return CouponValidateResponse(
            valid=False,
            coupon=None,
            discount_amount=Decimal("0.00"),
            message=str(e),
            final_total=None,
        )
    except CouponMinPurchaseError as e:
        return CouponValidateResponse(
            valid=False,
            coupon=None,
            discount_amount=Decimal("0.00"),
            message=str(e),
            final_total=None,
        )
    except CouponAlreadyUsedError as e:
        return CouponValidateResponse(
            valid=False,
            coupon=None,
            discount_amount=Decimal("0.00"),
            message=str(e),
            final_total=None,
        )

    return CouponValidateResponse(
        valid=True,
        coupon=CouponResponse.model_validate(result["coupon"]),
        discount_amount=result["discount_amount"],
        message=result["message"],
        final_total=result["final_total"],
    )


@router.get("/my/usage", response_model=list[CouponUsageResponse])
async def get_my_coupon_usage(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[CouponUsageResponse]:
    """Get all coupons used by the current user."""
    coupon_service = CouponService(db)

    usages = await coupon_service.get_user_coupon_usage(user_id=current_user.id)

    return [
        CouponUsageResponse(
            coupon_id=usage.coupon_id,
            coupon_code=usage.coupon.code,
            invoice_id=usage.invoice_id,
            used_at=usage.used_at,
        )
        for usage in usages
    ]
