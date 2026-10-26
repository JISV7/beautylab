"""Community chat message model."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.chat_room import ChatRoom
    from app.models.user import User


class ChatMessage(Base):
    """A message posted inside a chat room."""

    __tablename__ = "chat_messages"
    __table_args__ = (
        Index(
            "ix_chat_messages_room_created_at",
            "room_id",
            "created_at",
        ),
        Index("ix_chat_messages_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    room_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("chat_rooms.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(String(2000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    room: Mapped["ChatRoom"] = relationship(
        "ChatRoom",
        back_populates="messages",
    )
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, room_id={self.room_id})>"
