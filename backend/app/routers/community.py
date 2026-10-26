"""Company community REST API and real-time WebSocket transport."""

import asyncio
import json
import logging
from datetime import datetime
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.core.security import verify_token
from app.database import AsyncSessionLocal, get_db
from app.models.user import User
from app.schemas.community import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatRoomCreate,
    ChatRoomResponse,
    CommunityMemberResponse,
)
from app.services.community_service import (
    CommunityNotFoundError,
    CommunityService,
    CommunityValidationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/community", tags=["Community"])


class ConnectionManager:
    """In-memory room presence and fan-out for one uvicorn worker."""

    def __init__(self) -> None:
        self._rooms: dict[UUID, dict[UUID, set[WebSocket]]] = {}
        self._profiles: dict[UUID, dict[UUID, dict[str, str]]] = {}

    def register(
        self,
        room_id: UUID,
        user: User,
        websocket: WebSocket,
    ) -> list[dict[str, str]]:
        room_sockets = self._rooms.setdefault(room_id, {})
        room_sockets.setdefault(user.id, set()).add(websocket)
        room_profiles = self._profiles.setdefault(room_id, {})
        room_profiles[user.id] = {
            "id": str(user.id),
            "full_name": self._display_name(user),
            "email": user.email,
        }
        return self.online_users(room_id)

    def unregister(
        self,
        room_id: UUID,
        user_id: UUID,
        websocket: WebSocket,
    ) -> None:
        room_sockets = self._rooms.get(room_id)
        if room_sockets:
            sockets = room_sockets.get(user_id)
            if sockets:
                sockets.discard(websocket)
                if not sockets:
                    room_sockets.pop(user_id, None)
            if not room_sockets:
                self._rooms.pop(room_id, None)
                self._profiles.pop(room_id, None)

        room_profiles = self._profiles.get(room_id)
        if room_profiles and user_id not in self._rooms.get(room_id, {}):
            room_profiles.pop(user_id, None)

    def online_users(self, room_id: UUID) -> list[dict[str, str]]:
        room_sockets = self._rooms.get(room_id, {})
        profiles = self._profiles.get(room_id, {})
        users = [
            profiles[user_id]
            for user_id, sockets in room_sockets.items()
            if sockets and user_id in profiles
        ]
        return sorted(users, key=lambda item: item["full_name"].casefold())

    def online_user_ids(self) -> set[UUID]:
        return {
            user_id
            for room_sockets in self._rooms.values()
            for user_id, sockets in room_sockets.items()
            if sockets
        }

    def online_counts(self) -> dict[UUID, int]:
        return {
            room_id: len(
                [user_id for user_id, sockets in room_sockets.items() if sockets]
            )
            for room_id, room_sockets in self._rooms.items()
        }

    def _discard_socket(
        self,
        room_id: UUID,
        user_id: UUID,
        websocket: WebSocket,
    ) -> None:
        room_sockets = self._rooms.get(room_id)
        if not room_sockets:
            return
        sockets = room_sockets.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            room_sockets.pop(user_id, None)
            room_profiles = self._profiles.get(room_id)
            if room_profiles:
                room_profiles.pop(user_id, None)
        if not room_sockets:
            self._rooms.pop(room_id, None)
            self._profiles.pop(room_id, None)

    async def broadcast_room(
        self,
        room_id: UUID,
        payload: dict,
        *,
        exclude: WebSocket | None = None,
        exclude_user_id: UUID | None = None,
    ) -> None:
        targets = [
            (user_id, websocket)
            for user_id, sockets in self._rooms.get(room_id, {}).items()
            if user_id != exclude_user_id
            for websocket in list(sockets)
            if websocket is not exclude
        ]
        if not targets:
            return

        results = await asyncio.gather(
            *(websocket.send_json(payload) for _, websocket in targets),
            return_exceptions=True,
        )
        for (user_id, websocket), result in zip(targets, results, strict=False):
            if isinstance(result, Exception):
                self._discard_socket(room_id, user_id, websocket)

    @staticmethod
    def _display_name(user: User) -> str:
        if user.full_name and user.full_name.strip():
            return user.full_name.strip()
        return user.email.split("@", 1)[0]


manager = ConnectionManager()


@router.get("/rooms", response_model=list[ChatRoomResponse])
async def list_rooms(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[ChatRoomResponse]:
    """List the company channels, provisioning the defaults on first access."""
    service = CommunityService(db)
    await service.ensure_default_rooms(current_user)
    return await service.list_rooms(current_user, manager.online_counts())


@router.post(
    "/rooms",
    response_model=ChatRoomResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_room(
    payload: ChatRoomCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ChatRoomResponse:
    """Create a channel inside the current user's company."""
    service = CommunityService(db)
    try:
        return await service.create_room(current_user, payload)
    except CommunityValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/rooms/{room_id}/messages",
    response_model=list[ChatMessageResponse],
)
async def list_messages(
    room_id: UUID,
    current_user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
    before: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[ChatMessageResponse]:
    """Return the latest messages in chronological order for a visible room."""
    service = CommunityService(db)
    try:
        return await service.list_messages(
            current_user,
            room_id,
            before=before,
            limit=limit,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/rooms/{room_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    room_id: UUID,
    payload: ChatMessageCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    """Persist a message and fan it out to connected room members."""
    service = CommunityService(db)
    try:
        message = await service.create_message(
            current_user,
            room_id,
            payload.content,
        )
    except CommunityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CommunityValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    await manager.broadcast_room(
        room_id,
        {
            "type": "message",
            "message": message.model_dump(mode="json"),
        },
    )
    return message


@router.get("/members", response_model=list[CommunityMemberResponse])
async def list_members(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[CommunityMemberResponse]:
    """List active company members and live presence."""
    service = CommunityService(db)
    return await service.list_members(
        current_user,
        manager.online_user_ids(),
    )


@router.websocket("/ws")
async def community_websocket(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    room_id: UUID | None = Query(default=None),
) -> None:
    """Authenticated room socket carrying messages, presence and typing."""
    if not token or not room_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = verify_token(token, token_type="access")
        user_id = UUID(str(payload["sub"]))
    except (ValueError, KeyError, TypeError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                User.id == user_id,
                User.is_active.is_(True),
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        room = await CommunityService(db).get_room_for_user(user, room_id)
        if not room:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_name = manager._display_name(user)

    await websocket.accept()
    online_users = manager.register(room_id, user, websocket)

    try:
        await websocket.send_json(
            {
                "type": "ready",
                "room_id": str(room_id),
                "online_users": online_users,
            }
        )
        await manager.broadcast_room(
            room_id,
            {"type": "presence", "online_users": manager.online_users(room_id)},
        )

        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                await websocket.send_json(
                    {"type": "error", "detail": "Evento no válido"}
                )
                continue

            if not isinstance(event, dict):
                await websocket.send_json(
                    {"type": "error", "detail": "Evento no válido"}
                )
                continue

            event_type = event.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if event_type == "typing":
                await manager.broadcast_room(
                    room_id,
                    {
                        "type": "typing",
                        "user_id": str(user_id),
                        "user_name": user_name,
                    },
                    exclude_user_id=user_id,
                )
                continue

            if event_type != "message":
                await websocket.send_json(
                    {"type": "error", "detail": "Evento no reconocido"}
                )
                continue

            content = event.get("content")
            if not isinstance(content, str):
                await websocket.send_json(
                    {"type": "error", "detail": "El mensaje no es válido"}
                )
                continue

            try:
                async with AsyncSessionLocal() as message_db:
                    message_user = await message_db.get(User, user_id)
                    if not message_user or not message_user.is_active:
                        await websocket.close(
                            code=status.WS_1008_POLICY_VIOLATION
                        )
                        return
                    message = await CommunityService(
                        message_db
                    ).create_message(message_user, room_id, content)
            except CommunityNotFoundError as exc:
                await websocket.send_json(
                    {"type": "error", "detail": str(exc)}
                )
                continue
            except CommunityValidationError as exc:
                await websocket.send_json(
                    {"type": "error", "detail": str(exc)}
                )
                continue
            except Exception:
                logger.exception("Unexpected error while persisting a chat message")
                await websocket.send_json(
                    {"type": "error", "detail": "No se pudo enviar el mensaje"}
                )
                continue

            await manager.broadcast_room(
                room_id,
                {
                    "type": "message",
                    "message": message.model_dump(mode="json"),
                },
            )

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unexpected community WebSocket error")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass
    finally:
        manager.unregister(room_id, user_id, websocket)
        await manager.broadcast_room(
            room_id,
            {"type": "presence", "online_users": manager.online_users(room_id)},
        )
