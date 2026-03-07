from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List, Literal


class FontUsageEntry(BaseModel):
    """Entry tracking where a font is used."""
    
    theme_id: UUID
    theme_name: str
    palette: Literal["light", "dark", "accessibility"]
    element: str = Field(..., description="Typography element (h1, h2, ..., p)")


class FontBase(BaseModel):
    name: str = Field(..., max_length=100, description="Font display name")


class FontCreate(FontBase):
    pass


class FontResponse(FontBase):
    id: UUID
    filename: str
    url: str
    created_by: Optional[UUID] = None
    created_at: datetime
    font_usage: Optional[list] = None
    usage_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class FontWithUsage(FontResponse):
    """Font with detailed usage information."""
    
    usages: List[FontUsageEntry] = []
