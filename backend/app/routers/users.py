"""Users router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, RequireAdmin, check_role
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserListResponse,
    UserResponse,
    UserStats,
    UserUpdate,
    UserUpdateAdmin,
    UserUpdateFiscal,
    UserWithRoles,
)
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserWithRoles)
async def get_current_user_profile(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserWithRoles:
    """Get current user profile with roles."""
    auth_service = AuthService(db)
    roles = await auth_service.get_user_roles(current_user.id)
    return UserWithRoles(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        preferred_theme_id=current_user.preferred_theme_id,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        roles=roles,
        rif=current_user.rif,
        document_type=current_user.document_type,
        document_number=current_user.document_number,
        business_name=current_user.business_name,
        fiscal_address=current_user.fiscal_address,
        phone=current_user.phone,
        is_contributor=current_user.is_contributor,
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user profile."""
    user_service = UserService(db)

    try:
        user = await user_service.update_user_profile(current_user.id, user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return UserResponse.model_validate(user)


@router.patch("/me/fiscal", response_model=UserResponse)
async def update_current_user_fiscal(
    fiscal_data: UserUpdateFiscal,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user fiscal information."""
    user_service = UserService(db)

    try:
        user = await user_service.update_user_fiscal(current_user.id, fiscal_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return UserResponse.model_validate(user)


@router.get("/", response_model=UserListResponse)
async def list_users(
    current_user: CurrentUser,
    _: User = Depends(RequireAdmin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: bool | None = None,
    is_verified: bool | None = None,
    is_contributor: bool | None = None,
    db: AsyncSession = Depends(get_db),
) -> UserListResponse:
    """List all users with pagination and filters (admin only)."""
    user_service = UserService(db)
    users, total = await user_service.get_all_users(
        skip=skip,
        limit=limit,
        is_active=is_active,
        is_verified=is_verified,
        is_contributor=is_contributor,
    )

    # Get roles for each user
    auth_service = AuthService(db)
    users_with_roles = []
    for user in users:
        roles = await auth_service.get_user_roles(user.id)
        users_with_roles.append(
            UserWithRoles(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                preferred_theme_id=user.preferred_theme_id,
                created_at=user.created_at,
                updated_at=user.updated_at,
                roles=roles,
                rif=user.rif,
                document_type=user.document_type,
                document_number=user.document_number,
                business_name=user.business_name,
                fiscal_address=user.fiscal_address,
                phone=user.phone,
                is_contributor=user.is_contributor,
            )
        )

    return UserListResponse(
        users=users_with_roles,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/stats", response_model=UserStats)
async def get_user_statistics(
    current_user: CurrentUser,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> UserStats:
    """Get user statistics for admin dashboard (admin only)."""
    user_service = UserService(db)
    stats = await user_service.get_user_statistics()
    return UserStats(**stats)


@router.get("/{user_id}", response_model=UserWithRoles)
async def get_user(
    user_id: UUID,
    current_user: CurrentUser,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> UserWithRoles:
    """Get a specific user by ID (admin only)."""
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    auth_service = AuthService(db)
    roles = await auth_service.get_user_roles(user.id)

    return UserWithRoles(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        preferred_theme_id=user.preferred_theme_id,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=roles,
        rif=user.rif,
        document_type=user.document_type,
        document_number=user.document_number,
        business_name=user.business_name,
        fiscal_address=user.fiscal_address,
        phone=user.phone,
        is_contributor=user.is_contributor,
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_data: UserUpdateAdmin,
    user_id: UUID,
    current_user: CurrentUser,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update a user (admin only)."""
    user_service = UserService(db)

    try:
        user = await user_service.update_user_admin(user_id, user_data)
    except ValueError as e:
        if str(e) == "User not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return UserResponse.model_validate(user)


@router.patch("/{user_id}/fiscal", response_model=UserResponse)
async def update_user_fiscal(
    fiscal_data: UserUpdateFiscal,
    user_id: UUID,
    current_user: CurrentUser,
    _: User = Depends(check_role("admin", "root")),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update user fiscal information (admin only)."""
    user_service = UserService(db)

    try:
        user = await user_service.update_user_fiscal(user_id, fiscal_data)
    except ValueError as e:
        if str(e) == "User not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: CurrentUser,
    _: User = Depends(check_role("admin", "root")),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete (deactivate) a user (admin/root only)."""
    user_service = UserService(db)

    try:
        await user_service.delete_user(user_id)
    except ValueError as e:
        if str(e) == "User not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
