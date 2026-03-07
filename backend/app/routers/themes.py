"""Themes router with validation and activation endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, RequireAdmin, check_role
from app.database import get_db
from app.models.theme import Theme
from app.models.user import User
from app.schemas.theme import (
    ThemeCreate,
    ThemeListResponse,
    ThemeResponse,
    ThemeUpdate,
    ThemeValidationRequest,
    ThemeValidationResponse,
)
from app.services.theme_service import (
    ThemeService,
    ThemeActiveError,
    ThemeInUseError,
    ThemeValidationError,
)

router = APIRouter(prefix="/themes", tags=["Themes"])


@router.get("/admin", response_model=ThemeListResponse)
async def list_all_themes(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    is_active: Optional[bool] = None,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> ThemeListResponse:
    """List all themes (admin only).

    Returns paginated list of all themes. Use is_active param to filter by status.
    """
    theme_service = ThemeService(db)
    themes, total = await theme_service.get_all_themes(
        page=page, page_size=page_size, is_active=is_active
    )

    total_pages = (total + page_size - 1) // page_size

    return ThemeListResponse(
        themes=[ThemeResponse.model_validate(theme) for theme in themes],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/", response_model=ThemeListResponse)
async def list_themes(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ThemeListResponse:
    """List all active themes (public).

    Returns paginated list of active themes available to public users.
    """
    theme_service = ThemeService(db)
    themes, total = await theme_service.get_active_themes(page=page, page_size=page_size)

    total_pages = (total + page_size - 1) // page_size

    return ThemeListResponse(
        themes=[ThemeResponse.model_validate(theme) for theme in themes],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/default", response_model=ThemeResponse)
async def get_default_theme(
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Get the default theme."""
    theme_service = ThemeService(db)
    theme = await theme_service.get_default_theme()

    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default theme found",
        )

    return ThemeResponse.model_validate(theme)


@router.get("/{theme_id}", response_model=ThemeResponse)
async def get_theme(
    theme_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Get a specific theme by ID."""
    theme_service = ThemeService(db)
    theme = await theme_service.get_theme_by_id(theme_id)

    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found",
        )

    return ThemeResponse.model_validate(theme)


@router.post("/", response_model=ThemeResponse, status_code=status.HTTP_201_CREATED)
async def create_theme(
    current_user: CurrentUser,
    theme_data: ThemeCreate,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Create a new theme (admin only)."""
    theme_service = ThemeService(db)

    try:
        theme = await theme_service.create_theme(
            name=theme_data.name,
            description=theme_data.description,
            config=theme_data.config,
            theme_type=theme_data.type,
            is_active=theme_data.is_active,
            is_default=theme_data.is_default,
            created_by=current_user.id,
        )
    except ThemeValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return ThemeResponse.model_validate(theme)


@router.patch("/{theme_id}", response_model=ThemeResponse)
async def update_theme(
    theme_data: ThemeUpdate,
    theme_id: UUID,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Update an existing theme (admin only)."""
    theme_service = ThemeService(db)

    # Prepare update data
    update_kwargs = {}
    if theme_data.name is not None:
        update_kwargs["name"] = theme_data.name
    if theme_data.description is not None:
        update_kwargs["description"] = theme_data.description
    if theme_data.config is not None:
        update_kwargs["config"] = theme_data.config
    if theme_data.is_active is not None:
        update_kwargs["is_active"] = theme_data.is_active
    if theme_data.is_default is not None:
        update_kwargs["is_default"] = theme_data.is_default

    try:
        theme = await theme_service.update_theme(theme_id=theme_id, **update_kwargs)
    except ThemeValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found",
        )

    return ThemeResponse.model_validate(theme)


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_theme(
    theme_id: UUID,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a theme (admin only).
    
    Cannot delete if:
    - Theme is currently active
    - Theme is set as preferred by any user
    """
    theme_service = ThemeService(db)
    
    try:
        success = await theme_service.delete_theme(theme_id)
    except ThemeActiveError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except ThemeInUseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found",
        )


@router.post("/activate/{theme_id}", response_model=ThemeResponse)
async def activate_theme(
    theme_id: UUID,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Activate a theme (deactivates all others).
    
    Only one theme can be active at a time. This is the theme users will see.
    """
    theme_service = ThemeService(db)
    theme = await theme_service.activate_theme(theme_id)

    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found",
        )

    return ThemeResponse.model_validate(theme)


@router.post("/validate", response_model=ThemeValidationResponse)
async def validate_theme_config(
    validation_data: ThemeValidationRequest,
    _: User = Depends(RequireAdmin),
) -> ThemeValidationResponse:
    """Validate a theme configuration structure.
    
    Use this endpoint to validate theme config before saving.
    """
    theme_service = ThemeService(None)  # type: ignore
    
    try:
        theme_service._validate_theme_config(validation_data.config)
        return ThemeValidationResponse(valid=True)
    except ThemeValidationError as e:
        # Parse errors from exception message
        error_msg = str(e)
        errors = [error_msg.replace("Theme config validation failed: ", "")]
        return ThemeValidationResponse(valid=False, errors=errors)


@router.get("/user/preferred", response_model=ThemeResponse)
async def get_user_preferred_theme(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Get current user's preferred theme."""
    if not current_user.preferred_theme_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No preferred theme set",
        )

    theme_service = ThemeService(db)
    theme = await theme_service.get_theme_by_id(current_user.preferred_theme_id)

    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferred theme not found",
        )

    return ThemeResponse.model_validate(theme)


@router.put("/user/preferred", response_model=ThemeResponse)
async def set_user_preferred_theme(
    theme_id: Optional[UUID],
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ThemeResponse:
    """Set or clear current user's preferred theme.
    
    Users can only choose from active themes.
    """
    theme_service = ThemeService(db)
    
    if theme_id:
        # Verify theme exists and is active
        theme = await theme_service.get_theme_by_id(theme_id)

        if not theme:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Theme not found",
            )
        
        if not theme.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set inactive theme as preferred",
            )

    # Update user's preferred theme
    from sqlalchemy import update

    await db.execute(
        update(User).where(User.id == current_user.id).values(preferred_theme_id=theme_id)
    )
    await db.commit()

    if theme_id:
        return ThemeResponse.model_validate(theme)
    else:
        # Return 204 when clearing preference
        raise HTTPException(
            status_code=status.HTTP_204_NO_CONTENT,
            detail="Preferred theme cleared",
        )
