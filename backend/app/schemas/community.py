"""Schemas for the company community chat."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ChatLastMessage(BaseModel):
    """Compact preview of the latest message in a room."""

    id: UUID
    user_id: UUID
    user_name: str
    content: str
    created_at: datetime


class ChatRoomResponse(BaseModel):
    """Room data with activity and presence counters."""

    id: UUID
    name: str
    slug: str
    description: str | None = None
    is_default: bool
    message_count: int = 0
    online_count: int = 0
    last_message: ChatLastMessage | None = None


# Both names are part of the community contract; RoomSummary is the short form
# used by list endpoints.
RoomSummary = ChatRoomResponse


class ChatMessageResponse(BaseModel):
    """A persisted chat message ready for REST or WebSocket delivery."""

    id: UUID
    room_id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    content: str
    created_at: datetime


class CommunityMemberResponse(BaseModel):
    """Active company member shown in the community directory."""

    id: UUID
    full_name: str
    email: str
    department_name: str | None = None
    is_online: bool = False


class ChatMessageCreate(BaseModel):
    """Payload for posting a community message over REST."""

    content: str = Field(..., min_length=1, max_length=2000)


class ChatRoomCreate(BaseModel):
    """Payload for creating a new community channel."""

    name: str = Field(..., min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("El nombre del canal debe tener al menos 2 caracteres")
        return cleaned

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None
