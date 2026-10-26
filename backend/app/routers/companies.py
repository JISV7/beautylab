"""Public company registration router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.company import CompanyRegisterRequest
from app.schemas.user import UserResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_company(
    payload: CompanyRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Create a company, its departments and the first company admin."""
    service = CompanyService(db)
    try:
        _, user = await service.register_company(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return UserResponse.model_validate(user)
