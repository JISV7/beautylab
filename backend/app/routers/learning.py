"""Student learning content and quiz endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.schemas.quiz import (
    ClassCompletionResponse,
    CourseContentResponse,
    QuizAttemptResult,
    QuizAttemptStart,
    QuizAttemptSummary,
    QuizSubmitRequest,
    StudentQuizState,
)
from app.services.course_access_service import CourseAccessService
from app.services.course_progress_service import CourseProgressService
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/catalog", tags=["Learning"])


async def _authorize_course(
    db: AsyncSession, user_id: UUID, course_id: UUID
) -> None:
    license_obj = await CourseAccessService(db).get_course_license(user_id, course_id)
    if not license_obj:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No tienes acceso a este curso. Canjea una licencia válida o "
                "contacta a tu administrador."
            ),
        )


async def _validate_class_course(
    db: AsyncSession, class_id: UUID, course_id: UUID
) -> None:
    progress_service = CourseProgressService(db)
    actual_course_id = await progress_service.get_class_course_id(class_id)
    if actual_course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La clase no pertenece a este curso",
        )


@router.get("/my-courses/{course_id}/content", response_model=CourseContentResponse)
async def get_course_content(
    course_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CourseContentResponse:
    """Return modules, classes and completion state for the player."""
    await _authorize_course(db, current_user.id, course_id)
    service = CourseProgressService(db)
    content = await service.get_course_content(current_user.id, course_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Curso no encontrado"
        )
    return content


@router.post(
    "/my-courses/{course_id}/classes/{class_id}/complete",
    response_model=ClassCompletionResponse,
)
async def complete_class(
    course_id: UUID,
    class_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ClassCompletionResponse:
    """Mark a video class as completed and recalculate course progress."""
    await _authorize_course(db, current_user.id, course_id)
    await _validate_class_course(db, class_id, course_id)

    quiz_service = QuizService(db)
    course_class = await quiz_service.get_class(class_id)
    if not course_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Clase no encontrada"
        )
    if course_class.content_type != "video":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta clase se completa aprobando su evaluación",
        )

    service = CourseProgressService(db)
    enrollment = await service.mark_class_completed(
        user_id=current_user.id,
        class_id=class_id,
        source="video",
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo actualizar el progreso del curso",
        )

    return ClassCompletionResponse(
        class_id=class_id,
        is_completed=True,
        progress=enrollment.progress,
        status=enrollment.status,
    )


@router.get(
    "/my-courses/{course_id}/classes/{class_id}/quiz",
    response_model=StudentQuizState,
)
async def get_class_quiz_state(
    course_id: UUID,
    class_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> StudentQuizState:
    """Return quiz settings and the current student's attempt summary."""
    await _authorize_course(db, current_user.id, course_id)
    await _validate_class_course(db, class_id, course_id)

    service = QuizService(db)
    state = await service.get_student_state(current_user.id, class_id)
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El quiz no está disponible",
        )
    return state


@router.post(
    "/my-courses/{course_id}/classes/{class_id}/quiz/attempts",
    response_model=QuizAttemptStart,
    status_code=status.HTTP_201_CREATED,
)
async def start_quiz_attempt(
    course_id: UUID,
    class_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptStart:
    """Start or resume a quiz attempt."""
    await _authorize_course(db, current_user.id, course_id)
    await _validate_class_course(db, class_id, course_id)

    service = QuizService(db)
    try:
        return await service.start_attempt(current_user.id, class_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.get(
    "/my-courses/{course_id}/classes/{class_id}/quiz/attempts",
    response_model=list[QuizAttemptSummary],
)
async def list_my_quiz_attempts(
    course_id: UUID,
    class_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[QuizAttemptSummary]:
    """Return the student's attempt history for a class quiz."""
    await _authorize_course(db, current_user.id, course_id)
    await _validate_class_course(db, class_id, course_id)

    service = QuizService(db)
    return await service.get_attempt_history(current_user.id, class_id)


@router.post(
    "/quiz-attempts/{attempt_id}/submit",
    response_model=QuizAttemptResult,
)
async def submit_quiz_attempt(
    attempt_id: UUID,
    payload: QuizSubmitRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptResult:
    """Grade an attempt server-side and mark the class complete when passing."""
    service = QuizService(db)
    try:
        return await service.submit_attempt(current_user.id, attempt_id, payload)
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
