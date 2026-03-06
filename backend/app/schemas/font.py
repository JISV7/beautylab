from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class FontBase(BaseModel):
    name: str

class FontCreate(FontBase):
    pass

class FontResponse(FontBase):
    id: UUID
    filename: str
    url: str
    created_by: Optional[UUID] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
