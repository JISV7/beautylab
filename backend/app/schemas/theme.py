"""Theme schemas for request/response validation with structured palette support."""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator, AliasGenerator, AliasPath
from pydantic.alias_generators import to_camel


# ==================== Color Schemas ====================

class PaletteColors(BaseModel):
    """Color palette for a theme mode.

    Contains colors for UI elements like buttons, borders, cards, backgrounds.
    Text colors are defined in typography config instead.
    """

    primary: str = Field(..., description="Primary color for buttons, links, accents")
    secondary: str = Field(..., description="Secondary color for highlights")
    accent: str = Field(..., description="Accent color for special elements")
    background: str = Field(..., description="Main page background color")
    surface: str = Field(..., description="Surface color for cards, panels")
    border: str = Field(..., description="Border and divider color")

    @field_validator('primary', 'secondary', 'accent', 'background', 'surface', 'border')
    @classmethod
    def normalize_hex_color(cls, v: str) -> str:
        """Normalize hex color values to uppercase for consistency."""
        return v.upper()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "primary": "#2f27ce",
                "secondary": "#dedcff",
                "accent": "#433bff",
                "background": "#fbfbfe",
                "surface": "#eeeef0",
                "border": "#dddddd"
            }
        },
        alias_generator=AliasGenerator(validation_alias=to_camel),
        populate_by_name=True,
    )


# ==================== Typography Schemas ====================

class TypographyElement(BaseModel):
    """Typography settings for a single element (h1-h6, p, etc.).

    font_id is mandatory and must reference a valid font in the fonts table.
    This ensures proper font tracking and usage counting across themes.
    """

    font_id: UUID = Field(..., description="Font UUID (must reference fonts.id)", alias="fontId")
    font_name: str = Field(..., description="Font name for display", alias="fontName")
    font_size: str = Field(..., description="Font size in rem units", alias="fontSize")
    font_weight: int = Field(default=400, ge=100, le=900, description="Font weight 100-900", alias="fontWeight")
    color: str = Field(..., description="Text color for this element")
    line_height: Optional[str] = Field(None, description="Line height (e.g., '1.2')", alias="lineHeight")

    @field_validator('color')
    @classmethod
    def normalize_hex_color(cls, v: str) -> str:
        """Normalize hex color values to uppercase for consistency."""
        return v.upper()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "font_id": "550e8400-e29b-41d4-a716-446655440000",
                "font_name": "Inter",
                "font_size": "2.5",
                "font_weight": 800,
                "color": "#2f27ce",
                "line_height": "1.2"
            }
        },
        alias_generator=AliasGenerator(serialization_alias=to_camel),
        populate_by_name=True,
    )


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
    decorator: TypographyElement = Field(..., description="Decorator typography for icons and decorative elements")

    @model_validator(mode='after')
    def validate_typography_hierarchy(self):
        """Validate that heading sizes follow proper hierarchy.

        Rules:
        - H6 >= P (paragraph size is the base)
        - H5 >= H6 × 1.2
        - H4 >= H5 × 1.2
        - H3 >= H4 × 1.2
        - H2 >= H3 × 1.2
        - H1 >= H2 × 1.2

        A small tolerance (0.005) is applied to account for rounding in
        multi-step 1.2× calculations (e.g., 1.73 × 1.2 = 2.076, but the
        true mathematical value from 1.44 × 1.2 × 1.2 = 2.0736).

        Returns:
            TypographyConfig: self

        Raises:
            ValueError: If hierarchy validation fails
        """
        # Get font sizes as floats
        sizes = {}
        for key in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'paragraph']:
            element = getattr(self, key, None)
            if element:
                try:
                    sizes[key] = float(element.font_size)
                except (ValueError, TypeError, AttributeError):
                    # Skip validation if size is not a valid number
                    pass

        errors = []

        # Check H6 >= P (they should be equal, but we allow H6 to be larger)
        if 'h6' in sizes and 'paragraph' in sizes:
            if sizes['h6'] < sizes['paragraph']:
                errors.append(
                    f"H6 size ({sizes['h6']}rem) must be at least equal to Paragraph size ({sizes['paragraph']}rem). "
                    f"Minimum required: {sizes['paragraph']}rem"
                )

        # Define hierarchy checks: (higher_level, lower_level)
        hierarchy_checks = [
            ('h5', 'h6'),
            ('h4', 'h5'),
            ('h3', 'h4'),
            ('h2', 'h3'),
            ('h1', 'h2'),
        ]

        # Tolerance for rounding errors in multi-step 1.2× calculations
        tolerance = 0.005

        for higher, lower in hierarchy_checks:
            if higher in sizes and lower in sizes:
                min_required = sizes[lower] * 1.2
                if sizes[higher] + tolerance < min_required:
                    errors.append(
                        f"{higher.upper()} size ({sizes[higher]}rem) must be at least 1.2× {lower.upper()} size ({sizes[lower]}rem). "
                        f"Minimum required: {min_required:.3f}rem"
                    )

        if errors:
            raise ValueError("Typography hierarchy validation failed: " + "; ".join(errors))
        
        return self


# ==================== Palette Schema ====================

class ThemePalette(BaseModel):
    """A single theme palette (light, dark, or accessibility)."""

    colors: PaletteColors
    typography: TypographyConfig

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "colors": {
                "primary": "#2f27ce",
                "secondary": "#dedcff",
                "accent": "#433bff",
                "background": "#fbfbfe",
                "surface": "#eeeef0",
                "border": "#dddddd"
            },
            "typography": {
                "h1": {"font_size": "2.5", "font_weight": 400, "color": "#2f27ce"},
                "h2": {"font_size": "2.0", "font_weight": 400, "color": "#2f27ce"},
                "h3": {"font_size": "1.75", "font_weight": 400, "color": "#433bff"},
                "h4": {"font_size": "1.5", "font_weight": 400, "color": "#1a1675"},
                "h5": {"font_size": "1.25", "font_weight": 400, "color": "#1a1675"},
                "h6": {"font_size": "1.0", "font_weight": 400, "color": "#1a1675"},
                "title": {"font_size": "1.5", "font_weight": 700, "color": "#1a1675"},
                "subtitle": {"font_size": "1.25", "font_weight": 600, "color": "#1a1675"},
                "paragraph": {"font_size": "1.0", "font_weight": 400, "color": "#1a1a2e"},
                "decorator": {"font_size": "1.0", "font_weight": 500, "color": "#ffffff"}
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

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=AliasGenerator(serialization_alias=to_camel),
        populate_by_name=True,
    )

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
