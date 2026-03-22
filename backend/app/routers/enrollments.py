"""Enrollments router for course access management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.user import User
from app.schemas.enrollment import (
    EnrollmentListResponse,
    EnrollmentResponse,
    EnrollmentUpdate,
    EnrollmentWithDetails,
)
from app.services.enrollment_service import (
    EnrollmentAlreadyExistsError,
    EnrollmentNotFoundError,
    EnrollmentService,
)

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("/my", response_model=EnrollmentListResponse)
async def get_my_enrollments(
    status: str | None = None,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentListResponse:
    """
    Get current user's course enrollments.

    Optional status filter:
    - `active`: Currently enrolled
    - `completed`: Finished courses
    - `cancelled`: Cancelled enrollments
    """
    enrollment_service = EnrollmentService(db)

    enrollments = await enrollment_service.get_user_enrollments(
        user_id=current_user.id,
        status=status,
    )

    return EnrollmentListResponse(
        enrollments=[EnrollmentResponse.model_validate(e) for e in enrollments],
        total=len(enrollments),
    )


@router.get("/my/{enrollment_id}", response_model=EnrollmentWithDetails)
async def get_my_enrollment(
    enrollment_id: int,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentWithDetails:
    """Get details of a specific enrollment."""
    enrollment_service = EnrollmentService(db)

    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment {enrollment_id} not found",
        )

    # Check ownership
    if enrollment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this enrollment",
        )

    return EnrollmentWithDetails.model_validate(enrollment)


@router.patch("/my/{enrollment_id}", response_model=EnrollmentResponse)
async def update_my_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentResponse:
    """
    Update enrollment progress or status.

    **Body:**
    ```json
    {
        "status": "completed",
        "progress": 100
    }
    ```

    Users can update their own progress.
    Status changes may be restricted based on business rules.
    """
    enrollment_service = EnrollmentService(db)

    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment {enrollment_id} not found",
        )

    # Check ownership
    if enrollment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this enrollment",
        )

    # Update fields
    if enrollment_data.progress is not None:
        enrollment = await enrollment_service.update_enrollment_progress(
            enrollment_id=enrollment_id,
            progress=enrollment_data.progress,
        )

    if enrollment_data.status is not None:
        enrollment = await enrollment_service.update_enrollment_status(
            enrollment_id=enrollment_id,
            status=enrollment_data.status,
        )

    return EnrollmentResponse.model_validate(enrollment)


@router.post("/", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    course_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentResponse:
    """
    Enroll in a course.

    This endpoint is typically called after:
    1. Purchasing a license and redeeming it
    2. Direct purchase (admin)
    3. Corporate assignment

    Query parameter:
    - `course_id`: UUID of course to enroll in
    """
    enrollment_service = EnrollmentService(db)

    try:
        enrollment = await enrollment_service.create_enrollment(
            user_id=current_user.id,
            course_id=course_id,
            allow_duplicate=False,
        )
    except EnrollmentAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except EnrollmentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return EnrollmentResponse.model_validate(enrollment)


@router.get("/course/{course_id}")
async def get_course_enrollments(
    course_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get enrollment statistics for a course.

    Returns:
    - Total enrollments
    - Active, completed, cancelled counts
    - Average progress

    Admin/instructor only endpoint.
    """
    enrollment_service = EnrollmentService(db)

    stats = await enrollment_service.get_enrollment_statistics(course_id=course_id)

    return {
        "course_id": str(course_id),
        **stats,
    }


@router.delete("/my/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_enrollment(
    enrollment_id: int,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Cancel an enrollment.

    User can cancel their own enrollment.
    May have refund implications based on business rules.
    """
    enrollment_service = EnrollmentService(db)

    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment {enrollment_id} not found",
        )

    # Check ownership
    if enrollment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this enrollment",
        )

    await enrollment_service.update_enrollment_status(
        enrollment_id=enrollment_id,
        status="cancelled",
    )
