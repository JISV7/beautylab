"""Tests for authentication module."""

import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthentication:
    """Test authentication endpoints."""

    async def test_register_new_user(self, client: AsyncClient) -> None:
        """Test registering a new user."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "full_name": "New User",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "password_hash" not in data

    async def test_register_duplicate_email(
        self,
        client: AsyncClient,
        test_user_email: str,
    ) -> None:
        """Test that registering with an existing email fails."""
        response = await client.post(
            "/auth/register",
            json={
                "email": test_user_email,
                "password": "password123",
                "full_name": "Duplicate User",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already registered" in response.json()["detail"]

    async def test_login_success(self, client: AsyncClient) -> None:
        """Test successful login."""
        # First register a user
        await client.post(
            "/auth/register",
            json={
                "email": "loginuser@example.com",
                "password": "password123",
                "full_name": "Login User",
            },
        )

        # Then login
        response = await client.post(
            "/auth/login",
            data={
                "username": "loginuser@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(
        self,
        client: AsyncClient,
    ) -> None:
        """Test login with invalid credentials."""
        response = await client.post(
            "/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]

    async def test_login_wrong_password(
        self,
        client: AsyncClient,
        test_user_email: str,
    ) -> None:
        """Test login with wrong password."""
        response = await client.post(
            "/auth/login",
            data={
                "username": test_user_email,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]

    async def test_refresh_token_success(
        self,
        client: AsyncClient,
    ) -> None:
        """Test refreshing access token."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "refreshtest@example.com",
                "password": "password123",
            },
        )
        login_response = await client.post(
            "/auth/login",
            data={
                "username": "refreshtest@example.com",
                "password": "password123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Refresh token
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_token_invalid(
        self,
        client: AsyncClient,
    ) -> None:
        """Test refreshing with invalid token."""
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": "invalid_token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_refresh_token_wrong_type(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test refreshing with access token instead of refresh token."""
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": authenticated_user_token},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid token type" in response.json()["detail"]

    async def test_access_protected_endpoint_without_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test accessing protected endpoint without token."""
        response = await client.get("/users/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_access_protected_endpoint_with_valid_token(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test accessing protected endpoint with valid token."""
        response = await client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK

    async def test_access_protected_endpoint_with_invalid_token(
        self,
        client: AsyncClient,
    ) -> None:
        """Test accessing protected endpoint with invalid token."""
        response = await client.get(
            "/users/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
class TestPasswordValidation:
    """Test password validation rules."""

    async def test_password_minimum_length(
        self,
        client: AsyncClient,
    ) -> None:
        """Test password minimum length requirement."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",  # Less than 8 characters
                "full_name": "Test User",
            },
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_password_valid(self, client: AsyncClient) -> None:
        """Test valid password acceptance."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "validpass@example.com",
                "password": "validpassword123",
                "full_name": "Test User",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.asyncio
class TestUserRoles:
    """Test user role functionality."""

    async def test_new_user_has_default_role(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test that newly registered user has default 'user' role."""
        response = await client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "roles" in data
        assert isinstance(data["roles"], list)
        assert "user" in data["roles"]

    async def test_user_cannot_access_admin_endpoint(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test that regular user cannot access admin endpoints."""
        response = await client.get(
            "/users/",
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_admin_can_access_admin_endpoint(
        self,
        client: AsyncClient,
        admin_user_token: str,
    ) -> None:
        """Test that admin user can access admin endpoints."""
        response = await client.get(
            "/users/",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
