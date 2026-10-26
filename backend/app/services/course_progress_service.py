"""Class completion and course progress calculation."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.class_completion import ClassCompletion
from app.models.course import Course
from app.models.course_class import CourseClass
from app.models.course_module import CourseModule
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, QuizAttempt
from app.schemas.quiz import (
    ClassContent,
    ClassQuizSummary,
    CourseContentResponse,
    ModuleContent,
)


class CourseProgressService:
    """Maintain class completion and enrollment progress."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_class_course_id(self, class_id: UUID) -> UUID | None:
        result = await self.db.execute(
            select(CourseModule.course_id)
            .join(CourseClass, CourseClass.module_id == CourseModule.id)
            .where(CourseClass.id == class_id)
        )
        return result.scalar_one_or_none()

    async def get_enrollment(self, user_id: UUID, course_id: UUID) -> Enrollment | None:
        result = await self.db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id,
            )
        )
        return result.scalar_one_or_none()

    async def ensure_enrollment(self, user_id: UUID, course_id: UUID) -> Enrollment:
        enrollment = await self.get_enrollment(user_id, course_id)
        if enrollment:
            return enrollment

        enrollment = Enrollment(
            user_id=user_id,
            course_id=course_id,
            status="active",
            progress=0,
            enrolled_at=datetime.now(),
        )
        self.db.add(enrollment)
        await self.db.flush()
        return enrollment

    async def mark_class_completed(
        self,
        user_id: UUID,
        class_id: UUID,
        source: str,
        quiz_attempt_id: UUID | None = None,
    ) -> Enrollment | None:
        course_id = await self.get_class_course_id(class_id)
        if not course_id:
            return None

        enrollment = await self.ensure_enrollment(user_id, course_id)

        existing = await self.db.execute(
            select(ClassCompletion).where(
                ClassCompletion.user_id == user_id,
                ClassCompletion.class_id == class_id,
            )
        )
        if not existing.scalar_one_or_none():
            self.db.add(
                ClassCompletion(
                    user_id=user_id,
                    class_id=class_id,
                    enrollment_id=enrollment.id,
                    source=source,
                    quiz_attempt_id=quiz_attempt_id,
                )
            )
            await self.db.flush()

        return await self.recalculate(user_id, course_id)

    async def recalculate(self, user_id: UUID, course_id: UUID) -> Enrollment | None:
        enrollment = await self.get_enrollment(user_id, course_id)
        if not enrollment:
            return None

        total_result = await self.db.execute(
            select(func.count(CourseClass.id))
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .where(
                CourseModule.course_id == course_id,
                CourseClass.is_required.is_(True),
            )
        )
        total = total_result.scalar_one() or 0
        if total == 0:
            return enrollment

        completed_result = await self.db.execute(
            select(func.count(ClassCompletion.id))
            .join(CourseClass, CourseClass.id == ClassCompletion.class_id)
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .where(
                ClassCompletion.user_id == user_id,
                CourseModule.course_id == course_id,
                CourseClass.is_required.is_(True),
            )
        )
        completed = completed_result.scalar_one() or 0

        computed = round(completed * 100 / total)
        next_progress = min(100, max(enrollment.progress, computed))
        if next_progress > enrollment.progress:
            enrollment.progress = next_progress

        if enrollment.progress >= 100 and enrollment.status != "completed":
            enrollment.status = "completed"
            enrollment.completed_at = datetime.now()

        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def get_course_content(
        self, user_id: UUID, course_id: UUID
    ) -> CourseContentResponse | None:
        result = await self.db.execute(
            select(Course)
            .options(
                selectinload(Course.modules)
                .selectinload(CourseModule.classes)
                .selectinload(CourseClass.quiz)
                .selectinload(Quiz.questions)
            )
            .where(Course.id == course_id)
        )
        course = result.scalar_one_or_none()
        if not course:
            return None

        class_ids = [item.id for module in course.modules for item in module.classes]

        completed_ids: set[UUID] = set()
        if class_ids:
            completion_result = await self.db.execute(
                select(ClassCompletion.class_id).where(
                    ClassCompletion.user_id == user_id,
                    ClassCompletion.class_id.in_(class_ids),
                )
            )
            completed_ids = {row[0] for row in completion_result.all()}

        attempts_by_class: dict[UUID, list[QuizAttempt]] = {}
        if class_ids:
            attempt_result = await self.db.execute(
                select(QuizAttempt, Quiz.class_id)
                .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
                .where(
                    QuizAttempt.user_id == user_id,
                    Quiz.class_id.in_(class_ids),
                )
                .order_by(QuizAttempt.started_at.desc())
            )
            for attempt, quiz_class_id in attempt_result.all():
                attempts_by_class.setdefault(quiz_class_id, []).append(attempt)

        enrollment = await self.get_enrollment(user_id, course_id)
        modules: list[ModuleContent] = []

        for module in course.modules:
            classes: list[ClassContent] = []
            for item in module.classes:
                quiz = item.quiz
                attempts = attempts_by_class.get(item.id, [])
                scores = [attempt.score for attempt in attempts if attempt.score is not None]
                best_score = max(scores) if scores else None
                passed = any(attempt.passed for attempt in attempts if attempt.passed)
                quiz_summary = None
                if quiz:
                    quiz_summary = ClassQuizSummary(
                        question_count=len(quiz.questions),
                        passing_score=quiz.passing_score,
                        max_attempts=quiz.max_attempts,
                        time_limit_minutes=quiz.time_limit_minutes,
                    )
                classes.append(
                    ClassContent(
                        id=item.id,
                        title=item.title,
                        description=item.description,
                        content_type=item.content_type,
                        video_url=item.video_url,
                        thumbnail_url=item.thumbnail_url,
                        duration_minutes=item.duration_minutes,
                        is_required=item.is_required,
                        has_quiz=bool(quiz and quiz.is_published),
                        quiz=quiz_summary,
                        is_completed=item.id in completed_ids,
                        best_score=best_score,
                        passed=passed,
                        attempts_used=len(attempts),
                    )
                )
            modules.append(
                ModuleContent(
                    id=module.id,
                    title=module.title,
                    description=module.description,
                    position=module.position,
                    classes=classes,
                )
            )

        return CourseContentResponse(
            course_id=course.id,
            title=course.title,
            progress=enrollment.progress if enrollment else 0,
            status=enrollment.status if enrollment else "active",
            modules=modules,
        )
