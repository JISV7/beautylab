"""Authentication router."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user.

    Creates a new user account with the default 'user' role.
    """
    auth_service = AuthService(db)

    # Check if user already exists
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        logger.warning("Registration attempt with existing email: %s", user_data.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    try:
        # Create user with fiscal information
        user = await auth_service.create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            document_type=user_data.document_type,
            document_number=user_data.document_number,
            rif=user_data.rif,
            business_name=user_data.business_name,
            fiscal_address=user_data.fiscal_address,
            phone=user_data.phone,
            is_contributor=user_data.is_contributor,
        )

        logger.info("Successfully registered new user: %s (id=%s)", user_data.email, user.id)
        return UserResponse.model_validate(user)
    except Exception as e:
        logger.exception("Failed to create user %s: %s", user_data.email, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account",
        ) from e


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Login and get access/refresh tokens.

    Returns JWT tokens for authenticated users.
    Use the access_token in the Authorization header as: Bearer <token>
    """
    auth_service = AuthService(db)

    # Authenticate
    user = await auth_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate tokens
    tokens = auth_service.generate_tokens(user.id)

    return Token(**tokens)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)

    try:
        tokens = await auth_service.refresh_tokens(refresh_token)
        return Token(**tokens)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
