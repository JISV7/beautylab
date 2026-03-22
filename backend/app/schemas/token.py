"""Token schemas for JWT authentication."""

from pydantic import BaseModel


class Token(BaseModel):
    """Token response for login/register endpoints."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload structure."""

    sub: str  # User ID
    exp: int  # Expiration time
    iat: int  # Issued at time
    type: str  # Token type: 'access' or 'refresh'


class TokenRefresh(BaseModel):
    """Request to refresh access token."""

    refresh_token: str
