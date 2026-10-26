"""Course access checks shared by the player and quiz endpoints."""

from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.license import License, LicenseAssignment


class CourseAccessService:
    """Resolve the license or assignment that grants access to a course."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_course_license(
        self, user_id: UUID, course_id: UUID
    ) -> License | None:
        result = await self.db.execute(
            select(License)
            .outerjoin(LicenseAssignment, LicenseAssignment.license_id == License.id)
            .where(
                License.course_id == course_id,
                or_(
                    and_(
                        License.status == "redeemed",
                        License.redeemed_by_user_id == user_id,
                    ),
                    and_(
                        LicenseAssignment.assigned_to_user_id == user_id,
                        License.status.in_(["active", "redeemed"]),
                    ),
                ),
            )
            .order_by(License.redeemed_at.desc().nullslast(), License.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
