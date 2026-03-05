"""Users router."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, RequireAdmin, check_role
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserUpdateAdmin, UserWithRoles
from app.services.auth_service import AuthService

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
    )


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user profile."""
    # Update fields
    if user_data.email is not None:
        # Check if email is already taken
        result = await db.execute(
            select(User).where(User.email == user_data.email).where(User.id != current_user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = user_data.email

    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name

    if user_data.preferred_theme_id is not None:
        # Verify theme exists
        from app.models.theme import Theme

        result = await db.execute(select(Theme).where(Theme.id == user_data.preferred_theme_id))
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Theme not found",
            )
        current_user.preferred_theme_id = user_data.preferred_theme_id

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.get("/", response_model=list[UserWithRoles])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    current_user: User = Depends(check_role("admin", "root")),
    db: AsyncSession = Depends(get_db),
) -> list[UserWithRoles]:
    """List all users (admin only)."""
    query = select(User)

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()

    # Get roles for each user
    users_with_roles = []
    for user in users:
        auth_service = AuthService(db)
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
            )
        )

    return users_with_roles


@router.get("/{user_id}", response_model=UserWithRoles)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(check_role("admin", "root")),
    db: AsyncSession = Depends(get_db),
) -> UserWithRoles:
    """Get a specific user by ID (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

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
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_data: UserUpdateAdmin,
    user_id: UUID,
    current_user: User = Depends(check_role("admin", "root")),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update fields
    if user_data.email is not None:
        # Check if email is already taken
        existing = await db.execute(
            select(User).where(User.email == user_data.email).where(User.id != user_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    if user_data.is_verified is not None:
        user.is_verified = user_data.is_verified

    if user_data.preferred_theme_id is not None:
        from app.models.theme import Theme

        theme_result = await db.execute(
            select(Theme).where(Theme.id == user_data.preferred_theme_id)
        )
        if not theme_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Theme not found",
            )
        user.preferred_theme_id = user_data.preferred_theme_id

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)
