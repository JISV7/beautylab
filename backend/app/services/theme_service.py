"""Theme service."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.theme import Theme
from app.models.user import User


class ThemeService:
    """Service for theme operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_themes(
        self,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Theme], int]:
        """Get all active themes with pagination."""
        offset = (page - 1) * page_size

        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(Theme).where(Theme.is_active == True)
        )
        total = count_result.scalar() or 0

        # Get themes
        result = await self.db.execute(
            select(Theme)
            .where(Theme.is_active == True)
            .order_by(Theme.name)
            .offset(offset)
            .limit(page_size)
        )
        themes = result.scalars().all()

        return list(themes), total

    async def get_theme_by_id(self, theme_id: UUID) -> Optional[Theme]:
        """Get a theme by ID."""
        result = await self.db.execute(select(Theme).where(Theme.id == theme_id))
        return result.scalar_one_or_none()

    async def get_default_theme(self) -> Optional[Theme]:
        """Get the default theme."""
        result = await self.db.execute(
            select(Theme).where(Theme.is_default == True).where(Theme.is_active == True)
        )
        return result.scalar_one_or_none()

    async def create_theme(
        self,
        name: str,
        config: dict,
        description: Optional[str] = None,
        theme_type: str = "custom",
        is_active: bool = False,
        is_default: bool = False,
        created_by: Optional[UUID] = None,
    ) -> Theme:
        """Create a new theme."""
        # If this is set as default, unset other defaults
        if is_default:
            await self._unset_default_themes()

        theme = Theme(
            name=name,
            description=description,
            type=theme_type,
            config=config,
            is_active=is_active,
            is_default=is_default,
            created_by=created_by,
        )

        self.db.add(theme)
        await self.db.commit()
        await self.db.refresh(theme)

        return theme

    async def update_theme(
        self,
        theme_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        config: Optional[dict] = None,
        is_active: Optional[bool] = None,
        is_default: Optional[bool] = None,
    ) -> Optional[Theme]:
        """Update an existing theme."""
        theme = await self.get_theme_by_id(theme_id)

        if not theme:
            return None

        # If setting as default, unset other defaults
        if is_default:
            await self._unset_default_themes(exclude_id=theme_id)

        if name is not None:
            theme.name = name
        if description is not None:
            theme.description = description
        if config is not None:
            theme.config = config
        if is_active is not None:
            theme.is_active = is_active
        if is_default is not None:
            theme.is_default = is_default

        await self.db.commit()
        await self.db.refresh(theme)

        return theme

    async def delete_theme(self, theme_id: UUID) -> bool:
        """Delete a theme."""
        theme = await self.get_theme_by_id(theme_id)

        if not theme:
            return False

        await self.db.delete(theme)
        await self.db.commit()

        return True

    async def _unset_default_themes(self, exclude_id: Optional[UUID] = None) -> None:
        """Unset all default themes, optionally excluding one."""
        query = select(Theme).where(Theme.is_default == True)
        if exclude_id:
            query = query.where(Theme.id != exclude_id)

        result = await self.db.execute(query)
        themes = result.scalars().all()

        for theme in themes:
            theme.is_default = False

        await self.db.commit()

    async def get_user_preferred_theme(self, user_id: UUID) -> Optional[Theme]:
        """Get a user's preferred theme."""
        result = await self.db.execute(
            select(Theme).join(User, User.preferred_theme_id == Theme.id).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def set_user_preferred_theme(
        self,
        user_id: UUID,
        theme_id: Optional[UUID],
    ) -> Optional[User]:
        """Set a user's preferred theme."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return None

        user.preferred_theme_id = theme_id
        await self.db.commit()
        await self.db.refresh(user)

        return user
