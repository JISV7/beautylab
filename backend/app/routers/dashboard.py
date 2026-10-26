"""Customer dashboard (Inicio) endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse, RecentActivityItem
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> DashboardSummaryResponse:
    """Return the current customer's real learning snapshot for Inicio."""
    service = DashboardService(db)
    return await service.get_summary(current_user)


@router.get("/recent-activity", response_model=list[RecentActivityItem])
async def get_dashboard_recent_activity(
    current_user: CurrentUser,
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
) -> list[RecentActivityItem]:
    """Return the newest learning events for the current customer (max 20)."""
    service = DashboardService(db)
    return await service.get_recent_activity(current_user, limit=limit)
