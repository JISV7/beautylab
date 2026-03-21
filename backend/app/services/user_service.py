"""User service for business logic operations."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserUpdate, UserUpdateAdmin, UserUpdateFiscal


class UserService:
    """Service for user management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: bool | None = None,
        is_verified: bool | None = None,
        is_contributor: bool | None = None,
    ) -> tuple[list[User], int]:
        """
        Get all users with pagination and filters.

        Returns:
            tuple[list[User], int]: List of users and total count
        """
        # Build base query
        query = select(User)

        # Apply filters
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        if is_verified is not None:
            query = query.where(User.is_verified == is_verified)
        if is_contributor is not None:
            query = query.where(User.is_contributor == is_contributor)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()

        return list(users), total

    async def create_user(
        self,
        email: str,
        password_hash: str,
        full_name: str | None = None,
    ) -> User:
        """Create a new user."""
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user_profile(
        self,
        user_id: UUID,
        user_data: UserUpdate,
    ) -> User:
        """Update user profile (own profile)."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Update fields
        if user_data.email is not None:
            # Check if email is already taken
            existing = await self.get_user_by_email(user_data.email)
            if existing and existing.id != user_id:
                raise ValueError("Email already in use")
            user.email = user_data.email

        if user_data.full_name is not None:
            user.full_name = user_data.full_name

        if user_data.preferred_theme_id is not None:
            # Verify theme exists
            from app.models.theme import Theme

            theme_result = await self.db.execute(
                select(Theme).where(Theme.id == user_data.preferred_theme_id)
            )
            if not theme_result.scalar_one_or_none():
                raise ValueError("Theme not found")
            user.preferred_theme_id = user_data.preferred_theme_id

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user_admin(
        self,
        user_id: UUID,
        user_data: UserUpdateAdmin,
    ) -> User:
        """Update user (admin operation)."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Update fields
        if user_data.email is not None:
            # Check if email is already taken
            existing = await self.get_user_by_email(user_data.email)
            if existing and existing.id != user_id:
                raise ValueError("Email already in use")
            user.email = user_data.email

        if user_data.full_name is not None:
            user.full_name = user_data.full_name

        if user_data.is_active is not None:
            user.is_active = user_data.is_active

        if user_data.is_verified is not None:
            user.is_verified = user_data.is_verified

        if user_data.preferred_theme_id is not None:
            from app.models.theme import Theme

            theme_result = await self.db.execute(
                select(Theme).where(Theme.id == user_data.preferred_theme_id)
            )
            if not theme_result.scalar_one_or_none():
                raise ValueError("Theme not found")
            user.preferred_theme_id = user_data.preferred_theme_id

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user_fiscal(
        self,
        user_id: UUID,
        fiscal_data: UserUpdateFiscal,
    ) -> User:
        """Update user fiscal information."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Update fiscal fields
        if fiscal_data.rif is not None:
            user.rif = fiscal_data.rif
        if fiscal_data.document_type is not None:
            user.document_type = fiscal_data.document_type
        if fiscal_data.document_number is not None:
            user.document_number = fiscal_data.document_number
        if fiscal_data.business_name is not None:
            user.business_name = fiscal_data.business_name
        if fiscal_data.fiscal_address is not None:
            user.fiscal_address = fiscal_data.fiscal_address
        if fiscal_data.phone is not None:
            user.phone = fiscal_data.phone
        if fiscal_data.is_contributor is not None:
            user.is_contributor = fiscal_data.is_contributor

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: UUID) -> bool:
        """Delete a user (soft delete by deactivating)."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Soft delete: deactivate user
        user.is_active = False
        await self.db.commit()
        return True

    async def get_user_statistics(self) -> dict:
        """Get user statistics for admin dashboard."""
        # Total users
        total_result = await self.db.execute(select(func.count()).select_from(User))
        total_users = total_result.scalar() or 0

        # Active users
        active_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.is_active)
        )
        active_users = active_result.scalar() or 0

        # Verified users
        verified_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.is_verified)
        )
        verified_users = verified_result.scalar() or 0

        # Contributor users
        contributor_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.is_contributor)
        )
        contributor_users = contributor_result.scalar() or 0

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "verified_users": verified_users,
            "contributor_users": contributor_users,
        }
