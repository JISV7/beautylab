"""Enrollment service for course access management."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.enrollment import Enrollment


class EnrollmentNotFoundError(ValueError):
    """Raised when an enrollment is not found."""

    pass


class EnrollmentAlreadyExistsError(ValueError):
    """Raised when user is already enrolled in a course."""

    pass


class EnrollmentService:
    """Service for enrollment management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_enrollment_by_id(self, enrollment_id: int) -> Enrollment | None:
        """Get enrollment by ID."""
        result = await self.db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
        return result.scalar_one_or_none()

    async def get_user_enrollment(
        self,
        user_id: UUID,
        course_id: UUID,
    ) -> Enrollment | None:
        """Check if user is enrolled in a course."""
        result = await self.db.execute(
            select(Enrollment)
            .where(Enrollment.user_id == user_id)
            .where(Enrollment.course_id == course_id)
        )
        return result.scalar_one_or_none()

    async def get_user_enrollments(
        self,
        user_id: UUID,
        status: str | None = None,
    ) -> list[Enrollment]:
        """Get all enrollments for a user."""
        query = select(Enrollment).where(Enrollment.user_id == user_id)

        if status:
            query = query.where(Enrollment.status == status)

        query = query.order_by(Enrollment.enrolled_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_enrollment(
        self,
        user_id: UUID,
        course_id: UUID,
        invoice_id: UUID | None = None,
        allow_duplicate: bool = False,
    ) -> Enrollment:
        """
        Create a new enrollment.

        Args:
            user_id: User to enroll
            course_id: Course to enroll in
            invoice_id: Optional invoice that paid for enrollment
            allow_duplicate: Whether to allow duplicate enrollments

        Returns:
            Created enrollment

        Raises:
            EnrollmentAlreadyExistsError: If user already enrolled (and allow_duplicate=False)
        """
        # Check for existing enrollment
        if not allow_duplicate:
            existing = await self.get_user_enrollment(user_id, course_id)
            if existing and existing.status == "active":
                raise EnrollmentAlreadyExistsError(
                    f"User {user_id} is already enrolled in course {course_id}"
                )

        # Verify course exists
        course = await self._get_course_by_id(course_id)
        if not course:
            raise EnrollmentNotFoundError(f"Course {course_id} not found")

        enrollment = Enrollment(
            user_id=user_id,
            course_id=course_id,
            invoice_id=invoice_id,
            status="active",
            progress=0,
            enrolled_at=datetime.now(),
        )

        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)

        return enrollment

    async def update_enrollment_status(
        self,
        enrollment_id: int,
        status: str,
    ) -> Enrollment:
        """
        Update enrollment status.

        Args:
            enrollment_id: Enrollment to update
            status: New status (active, completed, cancelled)

        Returns:
            Updated enrollment
        """
        enrollment = await self.get_enrollment_by_id(enrollment_id)
        if not enrollment:
            raise EnrollmentNotFoundError(f"Enrollment {enrollment_id} not found")

        enrollment.status = status

        if status == "completed":
            enrollment.completed_at = datetime.now()
            enrollment.progress = 100
        elif status == "cancelled":
            enrollment.completed_at = None

        await self.db.commit()
        await self.db.refresh(enrollment)

        return enrollment

    async def update_enrollment_progress(
        self,
        enrollment_id: int,
        progress: int,
    ) -> Enrollment:
        """
        Update enrollment progress.

        Args:
            enrollment_id: Enrollment to update
            progress: Progress percentage (0-100)

        Returns:
            Updated enrollment
        """
        enrollment = await self.get_enrollment_by_id(enrollment_id)
        if not enrollment:
            raise EnrollmentNotFoundError(f"Enrollment {enrollment_id} not found")

        enrollment.progress = max(0, min(100, progress))

        if enrollment.progress >= 100:
            enrollment.status = "completed"
            enrollment.completed_at = datetime.now()

        await self.db.commit()
        await self.db.refresh(enrollment)

        return enrollment

    async def get_course_enrollments(
        self,
        course_id: UUID,
    ) -> list[Enrollment]:
        """Get all enrollments for a course."""
        result = await self.db.execute(
            select(Enrollment)
            .where(Enrollment.course_id == course_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
        return list(result.scalars().all())

    async def get_enrollment_statistics(
        self,
        course_id: UUID,
    ) -> dict:
        """Get enrollment statistics for a course."""
        result = await self.db.execute(
            select(
                func.count(Enrollment.id),
                func.sum(func.case((Enrollment.status == "active", 1), else_=0)),
                func.sum(func.case((Enrollment.status == "completed", 1), else_=0)),
                func.sum(func.case((Enrollment.status == "cancelled", 1), else_=0)),
                func.avg(Enrollment.progress),
            ).where(Enrollment.course_id == course_id)
        )
        row = result.one()

        return {
            "total_enrollments": row[0] or 0,
            "active_enrollments": row[1] or 0,
            "completed_enrollments": row[2] or 0,
            "cancelled_enrollments": row[3] or 0,
            "average_progress": float(row[4]) if row[4] else 0.0,
        }

    async def _get_course_by_id(self, course_id: UUID) -> Course | None:
        """Get course by ID."""
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()
