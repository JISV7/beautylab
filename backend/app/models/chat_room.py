"""Community chat room model."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.chat_message import ChatMessage
    from app.models.user import User


class ChatRoom(Base, TimestampMixin):
    """A company-scoped conversation channel."""

    __tablename__ = "chat_rooms"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "slug",
            name="uq_chat_rooms_company_slug",
        ),
        Index("ix_chat_rooms_company_id", "company_id"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=__import__("uuid").uuid4,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    company_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
    )
    created_by: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_default: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )
    creator: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[created_by],
    )

    def __repr__(self) -> str:
        return f"<ChatRoom(id={self.id}, slug={self.slug})>"
