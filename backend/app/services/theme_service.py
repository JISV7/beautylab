"""Theme service with validation for theme and font management."""

from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.theme import Theme
from app.models.font import Font
from app.models.user import User


class ThemeServiceError(Exception):
    """Base exception for theme service errors."""
    pass


class ThemeActiveError(ThemeServiceError):
    """Raised when trying to delete an active theme."""
    pass


class ThemeInUseError(ThemeServiceError):
    """Raised when trying to delete a theme that is in use by users."""
    pass


class FontInUseError(ThemeServiceError):
    """Raised when trying to delete a font that is in use."""
    pass


class ThemeValidationError(ThemeServiceError):
    """Raised when theme config validation fails."""
    pass


class ThemeService:
    """Service for theme operations with validation."""

    REQUIRED_TYPOGRAPHY_ELEMENTS = ["h1", "h2", "h3", "h4", "h5", "h6", "title", "subtitle", "paragraph"]
    REQUIRED_PALETTE_MODES = ["light", "dark", "accessibility"]

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Theme CRUD Operations ====================

    async def get_active_themes(
        self,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[Theme], int]:
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

    async def get_all_themes(
        self,
        page: int = 1,
        page_size: int = 10,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Theme], int]:
        """Get all themes with pagination (admin only).

        Args:
            page: Page number
            page_size: Number of items per page
            is_active: Filter by active status (None = all, True = active only, False = inactive only)
        """
        offset = (page - 1) * page_size

        # Build base query
        query = select(Theme)

        # Apply active filter if specified
        if is_active is not None:
            query = query.where(Theme.is_active == is_active)

        # Get total count
        count_query = select(func.count()).select_from(Theme)
        if is_active is not None:
            count_query = count_query.where(Theme.is_active == is_active)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get themes
        result = await self.db.execute(
            query.order_by(Theme.name).offset(offset).limit(page_size)
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
        config: Dict[str, Any],
        description: Optional[str] = None,
        theme_type: str = "custom",
        is_active: bool = False,
        is_default: bool = False,
        created_by: Optional[UUID] = None,
    ) -> Theme:
        """Create a new theme with validation."""
        # Validate config structure
        self._validate_theme_config(config)

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

        # Update font usage tracking
        await self._update_font_usage_for_theme(theme)

        return theme

    async def update_theme(
        self,
        theme_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None,
        is_default: Optional[bool] = None,
    ) -> Optional[Theme]:
        """Update an existing theme with validation."""
        theme = await self.get_theme_by_id(theme_id)

        if not theme:
            return None

        # If setting as default, unset other defaults
        if is_default:
            await self._unset_default_themes(exclude_id=theme_id)

        # Validate new config if provided
        if config is not None:
            self._validate_theme_config(config)
            theme.config = config

        if name is not None:
            theme.name = name
        if description is not None:
            theme.description = description
        if is_active is not None:
            theme.is_active = is_active
        if is_default is not None:
            theme.is_default = is_default

        await self.db.commit()
        await self.db.refresh(theme)

        # Update font usage tracking if config changed
        if config is not None:
            await self._update_font_usage_for_theme(theme)

        return theme

    async def delete_theme(self, theme_id: UUID) -> bool:
        """Delete a theme with validation.
        
        Raises:
            ThemeActiveError: If theme is currently active
            ThemeInUseError: If theme is set as preferred by users
        """
        theme = await self.get_theme_by_id(theme_id)

        if not theme:
            return False

        # Cannot delete active theme
        if theme.is_active:
            raise ThemeActiveError(
                f"Cannot delete active theme '{theme.name}'. Deactivate it first."
            )

        # Check if any users have this as preferred theme
        user_count = await self._count_users_with_preferred_theme(theme_id)
        if user_count > 0:
            raise ThemeInUseError(
                f"Cannot delete theme '{theme.name}' - {user_count} user(s) have it as preferred theme."
            )

        # Clear font usage references
        await self._clear_font_usage_for_theme(theme_id)

        await self.db.delete(theme)
        await self.db.commit()

        return True

    async def activate_theme(self, theme_id: UUID) -> Optional[Theme]:
        """Activate a theme (deactivates all others)."""
        theme = await self.get_theme_by_id(theme_id)

        if not theme:
            return None

        # Deactivate all themes first
        await self.db.execute(update(Theme).values(is_active=False))

        # Activate this theme
        theme.is_active = True
        await self.db.commit()
        await self.db.refresh(theme)

        return theme

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

        # Verify theme exists and is active if setting
        if theme_id:
            theme = await self.get_theme_by_id(theme_id)
            if not theme:
                raise ThemeServiceError("Theme not found")
            if not theme.is_active:
                raise ThemeServiceError("Cannot set inactive theme as preferred")

        user.preferred_theme_id = theme_id
        await self.db.commit()
        await self.db.refresh(user)

        return user

    # ==================== Font Usage Tracking ====================

    async def get_font_usage(self, font_id: UUID) -> List[Dict[str, Any]]:
        """Get all usages of a font across themes."""
        result = await self.db.execute(select(Font).where(Font.id == font_id))
        font = result.scalar_one_or_none()

        if not font or not font.font_usage:
            return []

        usages = []
        for usage in font.font_usage:
            theme_result = await self.db.execute(
                select(Theme).where(Theme.id == UUID(usage["theme_id"]))
            )
            theme = theme_result.scalar_one_or_none()
            if theme:
                usages.append({
                    "theme_id": usage["theme_id"],
                    "theme_name": theme.name,
                    "palette": usage["palette"],
                    "element": usage["element"]
                })

        return usages

    async def can_delete_font(self, font_id: UUID) -> Tuple[bool, str]:
        """Check if a font can be safely deleted.
        
        Returns:
            Tuple of (can_delete, reason_message)
        """
        result = await self.db.execute(select(Font).where(Font.id == font_id))
        font = result.scalar_one_or_none()

        if not font:
            return False, "Font not found"

        if not font.font_usage or len(font.font_usage) == 0:
            return True, ""

        usage_count = len(font.font_usage)
        return False, f"Font is used in {usage_count} theme palette(s). Remove it from those themes first."

    async def delete_font(self, font_id: UUID) -> bool:
        """Delete a font if not in use.
        
        Raises:
            FontInUseError: If font is used in any theme
        """
        can_delete, reason = await self.can_delete_font(font_id)

        if not can_delete:
            raise FontInUseError(reason)

        result = await self.db.execute(select(Font).where(Font.id == font_id))
        font = result.scalar_one_or_none()

        if not font:
            return False

        await self.db.delete(font)
        await self.db.commit()

        return True

    # ==================== Validation Helpers ====================

    def _validate_theme_config(self, config: Dict[str, Any]) -> None:
        """Validate theme configuration structure.
        
        Raises:
            ThemeValidationError: If config is invalid
        """
        errors = []
        warnings = []

        # Check for required palette modes
        for mode in self.REQUIRED_PALETTE_MODES:
            if mode not in config:
                errors.append(f"Missing required palette mode: '{mode}'")
            elif not isinstance(config[mode], dict):
                errors.append(f"Palette '{mode}' must be an object")
            else:
                palette = config[mode]

                # Validate colors
                if "colors" not in palette:
                    errors.append(f"Palette '{mode}' missing 'colors'")
                else:
                    colors = palette["colors"]
                    required_colors = ["primary", "secondary", "accent", "background", 
                                      "surface", "border", "text", "text_secondary"]
                    for color in required_colors:
                        if color not in colors:
                            errors.append(f"Palette '{mode}' missing color: '{color}'")

                # Validate typography
                if "typography" not in palette:
                    errors.append(f"Palette '{mode}' missing 'typography'")
                else:
                    typography = palette["typography"]
                    for element in self.REQUIRED_TYPOGRAPHY_ELEMENTS:
                        if element not in typography:
                            errors.append(f"Palette '{mode}' missing typography element: '{element}'")
                        else:
                            elem = typography[element]
                            if "font_size" not in elem:
                                errors.append(f"Typography '{element}' in '{mode}' missing 'font_size'")

        if errors:
            raise ThemeValidationError(f"Theme config validation failed: {'; '.join(errors)}")

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

    async def _count_users_with_preferred_theme(self, theme_id: UUID) -> int:
        """Count users who have this theme as preferred."""
        result = await self.db.execute(
            select(func.count()).select_from(User).where(User.preferred_theme_id == theme_id)
        )
        return result.scalar() or 0

    async def _update_font_usage_for_theme(self, theme: Theme) -> None:
        """Update font usage tracking for a theme."""
        config = theme.config

        # Clear old references first
        await self._clear_font_usage_for_theme(theme.id)

        # Scan all palettes for font usage
        for palette_name in ["light", "dark", "accessibility"]:
            if palette_name not in config:
                continue

            palette = config[palette_name]
            typography = palette.get("typography", {})

            for element_name, element_config in typography.items():
                font_id = element_config.get("font_id")
                if font_id:
                    await self._add_font_usage(
                        UUID(font_id) if isinstance(font_id, str) else font_id,
                        theme.id,
                        theme.name,
                        palette_name,
                        element_name
                    )

    async def _add_font_usage(
        self,
        font_id: UUID,
        theme_id: UUID,
        theme_name: str,
        palette: str,
        element: str
    ) -> None:
        """Add a font usage entry."""
        result = await self.db.execute(select(Font).where(Font.id == font_id))
        font = result.scalar_one_or_none()

        if font:
            if not font.font_usage:
                font.font_usage = []

            font.font_usage.append({
                "theme_id": str(theme_id),
                "theme_name": theme_name,
                "palette": palette,
                "element": element
            })

            await self.db.commit()

    async def _clear_font_usage_for_theme(self, theme_id: UUID) -> None:
        """Remove all font usage references for a theme."""
        result = await self.db.execute(select(Font).where(Font.font_usage.isnot(None)))
        fonts = result.scalars().all()

        theme_id_str = str(theme_id)
        modified = False

        for font in fonts:
            original_count = len(font.font_usage)
            font.font_usage = [
                usage for usage in font.font_usage
                if usage.get("theme_id") != theme_id_str
            ]
            if len(font.font_usage) != original_count:
                modified = True

        if modified:
            await self.db.commit()

    async def _get_all_fonts(self) -> Dict[UUID, Font]:
        """Get all fonts as a dict."""
        result = await self.db.execute(select(Font))
        fonts = result.scalars().all()
        return {font.id: font for font in fonts}
