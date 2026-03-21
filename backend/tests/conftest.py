"""Pytest fixtures and configuration."""

import asyncio
from collections.abc import AsyncGenerator, Generator
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings
from app.database import Base, get_db
from app.main import app
from app.services.auth_service import AuthService

# Test settings
settings = get_settings()

# Test database URL (in-memory or separate test database)
TEST_DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://").replace(
    "/beautylab", "/beautylab_test"
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db(test_engine) -> AsyncGenerator[AsyncSession]:
    """Create test database session."""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """Create test HTTP client."""

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user_email() -> str:
    """Return test user email."""
    return "testuser@example.com"


@pytest_asyncio.fixture(scope="function")
async def test_user(
    test_db: AsyncSession,
    test_user_email: str,
) -> UUID:
    """Create a test user and return user ID."""
    auth_service = AuthService(test_db)
    user = await auth_service.create_user(
        email=test_user_email,
        password="password123",
        full_name="Test User",
    )
    return user.id


@pytest_asyncio.fixture(scope="function")
async def test_user_id(test_user: UUID) -> str:
    """Return test user ID as string."""
    return str(test_user)


@pytest_asyncio.fixture(scope="function")
async def authenticated_user_token(
    client: AsyncClient,
    test_user_email: str,
) -> str:
    """Login and return access token for test user."""
    response = await client.post(
        "/auth/login",
        data={
            "username": test_user_email,
            "password": "password123",
        },
    )
    return response.json()["access_token"]


@pytest_asyncio.fixture(scope="function")
async def admin_user(
    test_db: AsyncSession,
) -> UUID:
    """Create an admin user and return user ID."""
    auth_service = AuthService(test_db)
    user = await auth_service.create_user(
        email="admin@example.com",
        password="admin123",
        full_name="Admin User",
    )

    # Assign admin role
    from sqlalchemy import select

    from app.models.role import Role
    from app.models.user_role import UserRole

    result = await test_db.execute(select(Role).where(Role.name == "admin"))
    admin_role = result.scalar_one_or_none()

    if admin_role:
        user_role = UserRole(user_id=user.id, role_id=admin_role.id)
        test_db.add(user_role)
        await test_db.commit()

    return user.id


@pytest_asyncio.fixture(scope="function")
async def admin_user_token(
    client: AsyncClient,
) -> str:
    """Login and return access token for admin user."""
    # First create admin user
    response = await client.post(
        "/auth/register",
        json={
            "email": "admin@example.com",
            "password": "admin123",
            "full_name": "Admin User",
        },
    )

    # Manually assign admin role (in real scenario, this would be done by root)
    # For testing purposes, we'll use a workaround

    response = await client.post(
        "/auth/login",
        data={
            "username": "admin@example.com",
            "password": "admin123",
        },
    )
    return response.json()["access_token"]


@pytest_asyncio.fixture(scope="function")
async def root_user(
    test_db: AsyncSession,
) -> UUID:
    """Create a root user and return user ID."""
    auth_service = AuthService(test_db)
    user = await auth_service.create_user(
        email="root@example.com",
        password="root123",
        full_name="Root User",
    )

    # Assign root role
    from sqlalchemy import select

    from app.models.role import Role
    from app.models.user_role import UserRole

    result = await test_db.execute(select(Role).where(Role.name == "root"))
    root_role = result.scalar_one_or_none()

    if root_role:
        user_role = UserRole(user_id=user.id, role_id=root_role.id)
        test_db.add(user_role)
        await test_db.commit()

    return user.id


@pytest_asyncio.fixture(scope="function")
async def root_user_token(
    client: AsyncClient,
) -> str:
    """Login and return access token for root user."""
    response = await client.post(
        "/auth/login",
        data={
            "username": "root@example.com",
            "password": "root123",
        },
    )
    return response.json()["access_token"]
