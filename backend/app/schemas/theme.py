"""Theme schemas for request/response validation with structured palette support."""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==================== Color Schemas ====================

class PaletteColors(BaseModel):
    """Color palette for a theme mode."""
    
    primary: str = Field(..., description="Primary color for buttons, links")
    secondary: str = Field(..., description="Secondary color")
    accent: str = Field(..., description="Accent color for highlights")
    background: str = Field(..., description="Main background color")
    surface: str = Field(..., description="Surface color for cards, panels")
    border: str = Field(..., description="Border color")
    text: str = Field(..., description="Primary text color")
    text_secondary: str = Field(..., description="Secondary text color")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "primary": "#F83A3A",
            "secondary": "#3B82F6",
            "accent": "#10B981",
            "background": "#FFFFFF",
            "surface": "#F9FAFB",
            "border": "#E5E7EB",
            "text": "#111827",
            "text_secondary": "#6B7280"
        }
    })


# ==================== Typography Schemas ====================

class TypographyElement(BaseModel):
    """Typography settings for a single element (h1-h6, p, etc.)."""
    
    font_id: Optional[UUID] = Field(None, description="Font UUID (null for system default)")
    font_name: Optional[str] = Field(None, description="Font name for display")
    font_size: str = Field(..., description="Font size in rem units")
    font_weight: int = Field(default=400, ge=100, le=900, description="Font weight 100-900")
    color: Optional[str] = Field(None, description="Element color (uses palette text if null)")
    line_height: Optional[str] = Field(None, description="Line height (e.g., '1.2')")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "font_id": "550e8400-e29b-41d4-a716-446655440000",
            "font_name": "Inter",
            "font_size": "2.5",
            "font_weight": 800,
            "color": "#111827",
            "line_height": "1.2"
        }
    })


class TypographyConfig(BaseModel):
    """Complete typography configuration for a palette."""
    
    h1: TypographyElement = Field(..., description="Heading 1 typography")
    h2: TypographyElement = Field(..., description="Heading 2 typography")
    h3: TypographyElement = Field(..., description="Heading 3 typography")
    h4: TypographyElement = Field(..., description="Heading 4 typography")
    h5: TypographyElement = Field(..., description="Heading 5 typography")
    h6: TypographyElement = Field(..., description="Heading 6 typography")
    title: TypographyElement = Field(..., description="Title typography (legacy)")
    subtitle: TypographyElement = Field(..., description="Subtitle typography")
    paragraph: TypographyElement = Field(..., description="Paragraph typography")


# ==================== Palette Schema ====================

class ThemePalette(BaseModel):
    """A single theme palette (light, dark, or accessibility)."""
    
    colors: PaletteColors
    typography: TypographyConfig

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "colors": {
                "primary": "#F83A3A",
                "secondary": "#3B82F6",
                "accent": "#10B981",
                "background": "#FFFFFF",
                "surface": "#F9FAFB",
                "border": "#E5E7EB",
                "text": "#111827",
                "text_secondary": "#6B7280"
            },
            "typography": {
                "h1": {"font_size": "2.5", "font_weight": 800},
                "h2": {"font_size": "2.0", "font_weight": 700},
                "h3": {"font_size": "1.75", "font_weight": 600},
                "h4": {"font_size": "1.5", "font_weight": 600},
                "h5": {"font_size": "1.25", "font_weight": 600},
                "h6": {"font_size": "1.0", "font_weight": 600},
                "title": {"font_size": "1.5", "font_weight": 700},
                "subtitle": {"font_size": "1.25", "font_weight": 600},
                "paragraph": {"font_size": "1.0", "font_weight": 400}
            }
        }
    })


# ==================== Theme Config Schema ====================

class ThemeConfig(BaseModel):
    """Complete theme configuration with 3 palettes."""
    
    light: ThemePalette = Field(..., description="Light mode palette")
    dark: ThemePalette = Field(..., description="Dark mode palette")
    accessibility: ThemePalette = Field(..., description="Accessibility mode palette (high contrast)")

    @field_validator('light', 'dark', 'accessibility')
    @classmethod
    def validate_palette_colors(cls, v):
        """Ensure palette has valid colors."""
        if isinstance(v, dict):
            colors = v.get('colors', {})
            if not colors:
                raise ValueError('Palette must include colors')
        return v

    model_config = ConfigDict(json_schema_extra={
        "description": "Theme configuration with light, dark, and accessibility palettes"
    })


# ==================== Theme Base Schemas ====================

class ThemeBase(BaseModel):
    """Base theme schema."""

    name: str = Field(..., max_length=100, description="Theme name")
    description: Optional[str] = Field(None, description="Theme description")
    type: Literal["preset", "custom"] = Field(default="custom", description="Theme type")


class ThemeCreate(ThemeBase):
    """Schema for creating a theme."""

    config: ThemeConfig = Field(..., description="Theme configuration with 3 palettes")
    is_active: bool = Field(default=False, description="Whether theme is active (visible to users)")
    is_default: bool = Field(default=False, description="Whether theme is the default")


class ThemeUpdate(BaseModel):
    """Schema for updating a theme."""

    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    config: Optional[ThemeConfig] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class ThemeResponse(BaseModel):
    """Schema for theme response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    type: str
    config: ThemeConfig
    is_active: bool
    is_default: bool
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class ThemeListResponse(BaseModel):
    """Schema for paginated theme list response."""

    themes: list[ThemeResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


# ==================== Font Usage Schema ====================

class FontUsageEntry(BaseModel):
    """Entry tracking where a font is used."""
    
    theme_id: UUID
    theme_name: str
    palette: Literal["light", "dark", "accessibility"]
    element: str = Field(..., description="Typography element (h1, h2, ..., p)")


class FontUsageResponse(BaseModel):
    """Font usage information."""
    
    font_id: UUID
    font_name: str
    usage_count: int
    usages: List[FontUsageEntry]


# ==================== Validation Schemas ====================

class ThemeValidationRequest(BaseModel):
    """Request to validate a theme config."""
    
    config: ThemeConfig


class ThemeValidationResponse(BaseModel):
    """Response from theme validation."""
    
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []
