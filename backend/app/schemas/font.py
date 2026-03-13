from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from datetime import datetime
from uuid import UUID
from typing import List, Literal


class FontUsageEntry(BaseModel):
    """Entry tracking where a font is used."""

    theme_id: UUID
    theme_name: str
    palette: Literal["light", "dark", "accessibility"]
    element: str = Field(..., description="Typography element (h1, h2, ..., p)")

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class FontBase(BaseModel):
    name: str = Field(..., max_length=100, description="Font display name")


class FontCreate(FontBase):
    pass


class FontResponse(FontBase):
    id: UUID
    filename: str
    url: str
    created_by: UUID
    created_by_name: str
    created_at: str
    font_usage: List[FontUsageEntry] = []
    usage_count: int

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class FontWithUsage(FontResponse):
    """Font with detailed usage information."""

    usages: List[FontUsageEntry] = []
