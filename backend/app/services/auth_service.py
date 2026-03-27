"""Authentication service."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(self, email: str, password: str) -> User | None:
        """Authenticate user with email and password."""
        result = await self.db.execute(
            select(User).where(User.email == email).where(User.is_active)
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    async def create_user(
        self,
        email: str,
        password: str,
        full_name: str | None = None,
        document_type: str | None = None,
        document_number: str | None = None,
        rif: str | None = None,
        business_name: str | None = None,
        fiscal_address: str | None = None,
        phone: str | None = None,
        is_contributor: bool = False,
    ) -> User:
        """Create a new user with the 'user' role."""
        password_hash = hash_password(password)

        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            document_type=document_type,
            document_number=document_number,
            rif=rif,
            business_name=business_name,
            fiscal_address=fiscal_address,
            phone=phone,
            is_contributor=is_contributor,
        )

        self.db.add(user)
        await self.db.flush()

        # Assign default 'user' role
        result = await self.db.execute(select(Role).where(Role.name == "user"))
        user_role = result.scalar_one_or_none()

        if user_role:
            user_role_assignment = UserRole(user_id=user.id, role_id=user_role.id)
            self.db.add(user_role_assignment)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_roles(self, user_id: UUID) -> list[str]:
        """Get list of role names for a user."""
        result = await self.db.execute(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        return [row[0] for row in result.all()]

    def generate_tokens(self, user_id: UUID) -> dict[str, str]:
        """Generate access and refresh tokens for a user."""
        access_token = create_access_token(subject=user_id)
        refresh_token = create_refresh_token(subject=user_id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def refresh_tokens(self, refresh_token: str) -> dict[str, str]:
        """Refresh tokens using a refresh token."""
        from app.core.security import decode_token

        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")

        user_id = UUID(payload["sub"])

        # Verify user still exists and is active
        result = await self.db.execute(select(User).where(User.id == user_id).where(User.is_active))
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError("User not found or inactive")

        return self.generate_tokens(user_id)
