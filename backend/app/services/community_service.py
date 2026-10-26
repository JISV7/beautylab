"""Persistence and presentation logic for company community rooms."""

import re
import unicodedata
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.chat_message import ChatMessage
from app.models.chat_room import ChatRoom
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.community import (
    ChatLastMessage,
    ChatMessageResponse,
    ChatRoomCreate,
    ChatRoomResponse,
    CommunityMemberResponse,
)

DEFAULT_ROOMS = (
    {
        "name": "General",
        "slug": "general",
        "description": "Conversación abierta para todo el equipo.",
        "welcome": (
            "¡Bienvenidos a la comunidad de Cursorg! Este es nuestro espacio "
            "para compartir avances y mantener al equipo cerca."
        ),
    },
    {
        "name": "Anuncios",
        "slug": "anuncios",
        "description": "Novedades y comunicados de la empresa.",
        "welcome": (
            "Publicaremos aquí las novedades importantes de la empresa. Si "
            "tienen un anuncio para el equipo, este es el canal."
        ),
    },
    {
        "name": "Consultas",
        "slug": "consultas",
        "description": "Preguntas rápidas y apoyo entre compañeros.",
        "welcome": (
            "¿Tienes una duda? Escríbela aquí y alguien del equipo te ayudará. "
            "También puedes compartir lo que ya resolviste."
        ),
    },
)

CONTROL_CHARACTERS = re.compile(
    r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]"
)
MESSAGE_LIMIT = 2000


class CommunityNotFoundError(Exception):
    """Raised when a room does not exist inside the user's company."""


class CommunityValidationError(ValueError):
    """Raised when a room or message payload is not usable."""


class CommunityService:
    """Company-scoped chat rooms, messages and members."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------------------------------------------------------
    # Default provisioning
    # ------------------------------------------------------------------
    async def _rooms_exist(self, user: User) -> bool:
        statement = select(ChatRoom.id).limit(1)
        statement = self._scope_statement(statement, user, ChatRoom.company_id)
        result = await self.db.execute(statement)
        return result.scalar_one_or_none() is not None

    async def _welcome_author(self, user: User) -> User:
        """Prefer a company admin as author of the first welcome messages."""
        if user.company_id is None:
            return user

        for role_name in ("company_admin", "admin", "root"):
            result = await self.db.execute(
                select(User)
                .join(UserRole, UserRole.user_id == User.id)
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    User.company_id == user.company_id,
                    User.is_active.is_(True),
                    Role.name == role_name,
                )
                .order_by(User.created_at.asc())
                .limit(1)
            )
            author = result.scalar_one_or_none()
            if author:
                return author
        return user

    async def ensure_default_rooms(self, user: User) -> None:
        """Create General, Anuncios and Consultas once for the company.

        The advisory transaction lock keeps simultaneous first requests from
        creating duplicate defaults. The unique constraint remains the final
        safety net for regular company rooms.
        """
        if await self._rooms_exist(user):
            return

        lock_key = f"cursorg-community-defaults:{user.company_id or 'global'}"
        await self.db.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
            {"lock_key": lock_key},
        )

        # The transaction snapshot may have been taken before another request
        # committed the defaults, so check again while holding the lock.
        if await self._rooms_exist(user):
            return

        author = await self._welcome_author(user)

        try:
            rooms: list[ChatRoom] = []
            for definition in DEFAULT_ROOMS:
                room = ChatRoom(
                    name=str(definition["name"]),
                    slug=str(definition["slug"]),
                    description=str(definition["description"]),
                    company_id=user.company_id,
                    created_by=author.id,
                    is_default=True,
                )
                self.db.add(room)
                rooms.append(room)
            await self.db.flush()

            for room, definition in zip(rooms, DEFAULT_ROOMS, strict=True):
                self.db.add(
                    ChatMessage(
                        room_id=room.id,
                        user_id=author.id,
                        content=str(definition["welcome"]),
                    )
                )

            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            if not await self._rooms_exist(user):
                raise

    async def list_rooms(
        self,
        user: User,
        online_counts: dict[UUID, int] | None = None,
    ) -> list[ChatRoomResponse]:
        statement = (
            select(ChatRoom)
            .order_by(ChatRoom.is_default.desc(), ChatRoom.created_at.asc())
        )
        statement = self._scope_statement(statement, user, ChatRoom.company_id)
        result = await self.db.execute(statement)
        rooms = list(result.scalars().all())
        if not rooms:
            return []

        room_ids = [room.id for room in rooms]
        count_result = await self.db.execute(
            select(ChatMessage.room_id, func.count(ChatMessage.id))
            .where(ChatMessage.room_id.in_(room_ids))
            .group_by(ChatMessage.room_id)
        )
        message_counts = {
            room_id: message_count
            for room_id, message_count in count_result.all()
        }

        ranked_messages = (
            select(
                ChatMessage.id.label("message_id"),
                func.row_number()
                .over(
                    partition_by=ChatMessage.room_id,
                    order_by=[
                        ChatMessage.created_at.desc(),
                        ChatMessage.id.desc(),
                    ],
                )
                .label("position"),
            )
            .where(ChatMessage.room_id.in_(room_ids))
            .subquery()
        )
        last_result = await self.db.execute(
            select(ChatMessage, User)
            .join(
                ranked_messages,
                ranked_messages.c.message_id == ChatMessage.id,
            )
            .join(User, User.id == ChatMessage.user_id)
            .where(ranked_messages.c.position == 1)
        )
        last_messages: dict[UUID, ChatLastMessage] = {}
        for message, author in last_result.all():
            last_messages[message.room_id] = ChatLastMessage(
                id=message.id,
                user_id=author.id,
                user_name=self._display_name(author),
                content=message.content,
                created_at=message.created_at,
            )

        counts = online_counts or {}
        return [
            ChatRoomResponse(
                id=room.id,
                name=room.name,
                slug=room.slug,
                description=room.description,
                is_default=room.is_default,
                message_count=message_counts.get(room.id, 0),
                online_count=counts.get(room.id, 0),
                last_message=last_messages.get(room.id),
            )
            for room in rooms
        ]

    async def create_room(
        self,
        user: User,
        payload: ChatRoomCreate,
    ) -> ChatRoomResponse:
        name = " ".join(
            CONTROL_CHARACTERS.sub("", payload.name).split()
        ).strip()
        if len(name) < 2:
            raise CommunityValidationError(
                "El nombre del canal debe tener al menos 2 caracteres"
            )

        description = payload.description
        if description is not None:
            description = CONTROL_CHARACTERS.sub("", description).strip() or None

        base_slug = self._slugify(name)
        existing_result = await self.db.execute(
            self._scope_statement(
                select(ChatRoom.slug),
                user,
                ChatRoom.company_id,
            )
        )
        existing_slugs = {row[0] for row in existing_result.all()}

        candidate = base_slug
        suffix_number = 2
        while candidate in existing_slugs:
            suffix = f"-{suffix_number}"
            candidate = f"{base_slug[: 140 - len(suffix)]}{suffix}"
            suffix_number += 1

        room = ChatRoom(
            name=name,
            slug=candidate,
            description=description,
            company_id=user.company_id,
            created_by=user.id,
            is_default=False,
        )
        self.db.add(room)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise CommunityValidationError(
                "Ya existe un canal con ese nombre. Intenta con otro."
            ) from exc

        await self.db.refresh(room)
        return ChatRoomResponse(
            id=room.id,
            name=room.name,
            slug=room.slug,
            description=room.description,
            is_default=room.is_default,
            message_count=0,
            online_count=0,
            last_message=None,
        )

    # ------------------------------------------------------------------
    # Messages
    # ------------------------------------------------------------------
    async def get_room_for_user(
        self,
        user: User,
        room_id: UUID,
    ) -> ChatRoom | None:
        statement = self._scope_statement(
            select(ChatRoom).where(ChatRoom.id == room_id),
            user,
            ChatRoom.company_id,
        )
        result = await self.db.execute(statement)
        return result.scalar_one_or_none()

    async def list_messages(
        self,
        user: User,
        room_id: UUID,
        before: datetime | None = None,
        limit: int = 50,
    ) -> list[ChatMessageResponse]:
        room = await self.get_room_for_user(user, room_id)
        if not room:
            raise CommunityNotFoundError("Canal no encontrado")

        safe_limit = max(1, min(limit, 200))
        statement = (
            select(ChatMessage)
            .options(joinedload(ChatMessage.user))
            .where(ChatMessage.room_id == room.id)
        )
        if before:
            if before.tzinfo is None:
                before = before.replace(tzinfo=UTC)
            statement = statement.where(ChatMessage.created_at < before)

        result = await self.db.execute(
            statement.order_by(
                ChatMessage.created_at.desc(),
                ChatMessage.id.desc(),
            ).limit(safe_limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        return [
            self._message_response(message, message.user)
            for message in messages
        ]

    async def create_message(
        self,
        user: User,
        room_id: UUID,
        content: str,
    ) -> ChatMessageResponse:
        cleaned = self._clean_message(content)
        room = await self.get_room_for_user(user, room_id)
        if not room:
            raise CommunityNotFoundError("Canal no encontrado")

        message = ChatMessage(
            room_id=room.id,
            user_id=user.id,
            content=cleaned,
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return self._message_response(message, user)

    # ------------------------------------------------------------------
    # Members
    # ------------------------------------------------------------------
    async def list_members(
        self,
        user: User,
        online_user_ids: set[UUID] | None = None,
    ) -> list[CommunityMemberResponse]:
        statement = (
            select(User, Department.name)
            .outerjoin(Department, Department.id == User.department_id)
            .where(User.is_active.is_(True))
            .order_by(
                User.full_name.is_(None),
                func.lower(User.full_name),
                User.email.asc(),
            )
        )
        if user.company_id is None:
            statement = statement.where(User.company_id.is_(None))
        else:
            statement = statement.where(User.company_id == user.company_id)

        result = await self.db.execute(statement)
        online = online_user_ids or set()
        return [
            CommunityMemberResponse(
                id=member.id,
                full_name=self._display_name(member),
                email=member.email,
                department_name=department_name,
                is_online=member.id in online,
            )
            for member, department_name in result.all()
        ]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _scope_statement(statement, user: User, column):
        if user.company_id is None:
            return statement.where(column.is_(None))
        return statement.where(column == user.company_id)

    @staticmethod
    def _slugify(value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value)
        ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
        slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
        return (slug[:140] or "canal")

    @staticmethod
    def _display_name(user: User) -> str:
        if user.full_name and user.full_name.strip():
            return user.full_name.strip()
        return user.email.split("@", 1)[0]

    @staticmethod
    def _clean_message(content: str) -> str:
        if not isinstance(content, str):
            raise CommunityValidationError("El mensaje no es válido")

        normalized = content.replace("\r\n", "\n").replace("\r", "\n")
        cleaned = CONTROL_CHARACTERS.sub("", normalized)
        cleaned = "\n".join(line.rstrip() for line in cleaned.split("\n")).strip()
        if not cleaned:
            raise CommunityValidationError("El mensaje no puede estar vacío")
        if len(cleaned) > MESSAGE_LIMIT:
            raise CommunityValidationError(
                f"El mensaje no puede superar los {MESSAGE_LIMIT} caracteres"
            )
        return cleaned

    def _message_response(
        self,
        message: ChatMessage,
        user: User,
    ) -> ChatMessageResponse:
        return ChatMessageResponse(
            id=message.id,
            room_id=message.room_id,
            user_id=user.id,
            user_name=self._display_name(user),
            user_email=user.email,
            content=message.content,
            created_at=message.created_at,
        )
