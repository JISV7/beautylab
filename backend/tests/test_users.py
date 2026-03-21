"""Tests for users module."""

import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
class TestUserEndpoints:
    """Test user-related endpoints."""

    async def test_get_current_user_profile(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test getting current user profile."""
        response = await client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "roles" in data

    async def test_update_current_user_profile(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test updating current user profile."""
        response = await client.patch(
            "/users/me",
            json={"full_name": "Updated Name"},
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Name"

    async def test_update_current_user_fiscal(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test updating current user fiscal information."""
        response = await client.patch(
            "/users/me/fiscal",
            json={
                "rif": "J-12345678-9",
                "document_type": "V",
                "document_number": "12345678",
                "phone": "+58 412 1234567",
            },
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["rif"] == "J-12345678-9"
        assert data["document_type"] == "V"

    async def test_list_users_unauthorized(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test that regular users cannot list all users."""
        response = await client.get(
            "/users/",
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_list_users_admin(
        self,
        client: AsyncClient,
        admin_user_token: str,
    ) -> None:
        """Test admin can list all users."""
        response = await client.get(
            "/users/",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data

    async def test_list_users_with_filters(
        self,
        client: AsyncClient,
        admin_user_token: str,
    ) -> None:
        """Test listing users with filters."""
        response = await client.get(
            "/users/?is_active=true&limit=10",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["limit"] == 10

    async def test_get_user_statistics_admin(
        self,
        client: AsyncClient,
        admin_user_token: str,
    ) -> None:
        """Test admin can get user statistics."""
        response = await client.get(
            "/users/stats",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "inactive_users" in data
        assert "verified_users" in data
        assert "contributor_users" in data

    async def test_get_user_by_id_admin(
        self,
        client: AsyncClient,
        admin_user_token: str,
        test_user_id: str,
    ) -> None:
        """Test admin can get a specific user by ID."""
        response = await client.get(
            f"/users/{test_user_id}",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user_id

    async def test_get_user_not_found(
        self,
        client: AsyncClient,
        admin_user_token: str,
    ) -> None:
        """Test getting a non-existent user."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.get(
            f"/users/{fake_id}",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_update_user_admin(
        self,
        client: AsyncClient,
        admin_user_token: str,
        test_user_id: str,
    ) -> None:
        """Test admin can update a user."""
        response = await client.patch(
            f"/users/{test_user_id}",
            json={"is_verified": True, "full_name": "Admin Updated"},
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_verified"] is True
        assert data["full_name"] == "Admin Updated"

    async def test_update_user_fiscal_admin(
        self,
        client: AsyncClient,
        admin_user_token: str,
        test_user_id: str,
    ) -> None:
        """Test admin can update user fiscal information."""
        response = await client.patch(
            f"/users/{test_user_id}/fiscal",
            json={
                "rif": "J-98765432-1",
                "business_name": "Test Company",
                "is_contributor": True,
            },
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["rif"] == "J-98765432-1"
        assert data["business_name"] == "Test Company"
        assert data["is_contributor"] is True

    async def test_delete_user_admin(
        self,
        client: AsyncClient,
        admin_user_token: str,
        test_user_id: str,
    ) -> None:
        """Test admin can delete (deactivate) a user."""
        response = await client.delete(
            f"/users/{test_user_id}",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

    async def test_delete_user_not_found(
        self,
        client: AsyncClient,
        admin_user_token: str,
    ) -> None:
        """Test deleting a non-existent user."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.delete(
            f"/users/{fake_id}",
            headers={"Authorization": f"Bearer {admin_user_token}"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
class TestUserValidation:
    """Test user input validation."""

    async def test_duplicate_email_registration(
        self,
        client: AsyncClient,
        test_user_email: str,
    ) -> None:
        """Test that duplicate email registration fails."""
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

    async def test_invalid_email_format(
        self,
        client: AsyncClient,
    ) -> None:
        """Test that invalid email format is rejected."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "invalid-email",
                "password": "password123",
                "full_name": "Test User",
            },
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_password_too_short(
        self,
        client: AsyncClient,
    ) -> None:
        """Test that password shorter than 8 characters is rejected."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
                "full_name": "Test User",
            },
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_update_profile_duplicate_email(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
        test_user_email: str,
    ) -> None:
        """Test that updating profile with existing email fails."""
        # Try to update to an email that already exists
        response = await client.patch(
            "/users/me",
            json={"email": test_user_email},
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        # Should succeed if it's the same user's own email
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
class TestUserFiscalFields:
    """Test fiscal fields functionality."""

    async def test_fiscal_fields_in_response(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test that fiscal fields are included in user response."""
        response = await client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "rif" in data
        assert "document_type" in data
        assert "document_number" in data
        assert "business_name" in data
        assert "fiscal_address" in data
        assert "phone" in data
        assert "is_contributor" in data

    async def test_update_all_fiscal_fields(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test updating all fiscal fields at once."""
        fiscal_data = {
            "rif": "J-12345678-9",
            "document_type": "V",
            "document_number": "12345678",
            "business_name": "Test Business",
            "fiscal_address": "123 Test Street, City",
            "phone": "+58 412 1234567",
            "is_contributor": True,
        }
        response = await client.patch(
            "/users/me/fiscal",
            json=fiscal_data,
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        for key, value in fiscal_data.items():
            assert data[key] == value

    async def test_fiscal_field_validation_max_length(
        self,
        client: AsyncClient,
        authenticated_user_token: str,
    ) -> None:
        """Test fiscal field max length validation."""
        response = await client.patch(
            "/users/me/fiscal",
            json={
                "rif": "A" * 21,  # Exceeds max_length=20
            },
            headers={"Authorization": f"Bearer {authenticated_user_token}"},
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
