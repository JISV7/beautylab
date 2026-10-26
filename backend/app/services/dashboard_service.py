"""Dashboard aggregation service for the collaborator home view."""

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.class_completion import ClassCompletion
from app.models.course import Course
from app.models.course_class import CourseClass
from app.models.course_module import CourseModule
from app.models.enrollment import Enrollment
from app.models.learning_path import LearningPath
from app.models.learning_path_course import LearningPathCourse
from app.models.license import License
from app.models.product import Product
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User
from app.schemas.dashboard import (
    ContinueCourse,
    DashboardStats,
    DashboardSummaryResponse,
    LearningPathSummary,
    RecentActivityItem,
    RecentCourse,
    Recommendation,
    WeeklyActivityItem,
)

DASHBOARD_TZ = ZoneInfo("America/Caracas")


@dataclass(frozen=True)
class _Completion:
    class_id: UUID
    course_id: UUID
    completed_at: datetime
    duration_minutes: int | None


@dataclass(frozen=True)
class _Attempt:
    course_id: UUID
    started_at: datetime
    completed_at: datetime | None


def _as_utc(value: datetime) -> datetime:
    """Normalize database datetimes to UTC for stable serialization."""
    if value.tzinfo is None:
        return value.replace(tzinfo=DASHBOARD_TZ).astimezone(UTC)
    return value.astimezone(UTC)


def _iso(value: datetime) -> str:
    return _as_utc(value).isoformat()


def _local_date(value: datetime) -> date:
    return _as_utc(value).astimezone(DASHBOARD_TZ).date()


def _is_completed(enrollment: Enrollment) -> bool:
    return enrollment.status == "completed" or enrollment.progress >= 100


def _build_streaks(activity_dates: list[date]) -> tuple[int, int]:
    """Return the current and longest runs of consecutive learning days."""
    unique_days = sorted(set(activity_dates))
    if not unique_days:
        return 0, 0

    longest = 0
    run = 0
    previous: date | None = None
    for day in unique_days:
        if previous is not None and day == previous + timedelta(days=1):
            run += 1
        else:
            run = 1
        longest = max(longest, run)
        previous = day

    today = datetime.now(DASHBOARD_TZ).date()
    streak = 0
    if unique_days[-1] in (today, today - timedelta(days=1)):
        day_set = set(unique_days)
        cursor = unique_days[-1]
        streak = 1
        while cursor - timedelta(days=1) in day_set:
            cursor -= timedelta(days=1)
            streak += 1

    return streak, longest


def _top_category(enrollments: list[Enrollment]) -> tuple[int | None, str | None]:
    """Most frequent category among the courses the customer is enrolled in."""
    counts: dict[int, int] = {}
    names: dict[int, str] = {}
    for enrollment in enrollments:
        category = enrollment.course.category
        if category is None:
            continue
        counts[category.id] = counts.get(category.id, 0) + 1
        names[category.id] = category.name

    if not counts:
        return None, None

    category_id = max(counts, key=counts.__getitem__)
    return category_id, names.get(category_id)


class DashboardService:
    """Aggregate the customer's real learning activity for the Inicio page."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_summary(self, user: User) -> DashboardSummaryResponse:
        enrollments = await self._load_enrollments(user.id)
        completions = await self._load_completions(user.id)
        attempts = await self._load_attempts(user.id)

        total_required_classes = await self._count_required_classes(enrollments)
        completed_courses = sum(1 for enrollment in enrollments if _is_completed(enrollment))
        active_courses = len(enrollments) - completed_courses
        average_progress = (
            round(
                sum(min(100, max(0, enrollment.progress)) for enrollment in enrollments)
                / len(enrollments)
            )
            if enrollments
            else 0
        )
        study_minutes = sum(item.duration_minutes or 0 for item in completions)

        activity_dates = [_local_date(item.completed_at) for item in completions]
        activity_dates.extend(
            _local_date(item.completed_at or item.started_at) for item in attempts
        )
        current_streak, longest_streak = _build_streaks(activity_dates)

        learning_path, path_course_ids, path_progress = await self._build_learning_path(
            enrollments
        )
        path_order = {course_id: index for index, course_id in enumerate(path_course_ids)}
        top_category_id, top_category_name = _top_category(enrollments)
        recommendations = await self._build_recommendations(
            enrolled_ids={enrollment.course_id for enrollment in enrollments},
            path_order=path_order,
            path_progress=path_progress,
            top_category_id=top_category_id,
            top_category_name=top_category_name,
        )

        stats = DashboardStats(
            active_courses=active_courses,
            completed_courses=completed_courses,
            total_courses=len(enrollments),
            average_progress=average_progress,
            classes_completed=len(completions),
            total_required_classes=total_required_classes,
            study_hours=round(study_minutes / 60, 1),
            current_streak_days=current_streak,
            longest_streak_days=longest_streak,
        )

        return DashboardSummaryResponse(
            stats=stats,
            continue_course=await self._build_continue_course(
                enrollments, completions, attempts
            ),
            weekly_activity=self._build_weekly_activity(completions, attempts),
            learning_path=learning_path,
            recommendations=recommendations,
            recent_courses=self._build_recent_courses(enrollments, completions, attempts),
        )

    async def get_recent_activity(
        self, user: User, limit: int = 10
    ) -> list[RecentActivityItem]:
        """Return the newest learning events across completions, quizzes and licenses."""
        events: list[tuple[datetime, RecentActivityItem]] = []

        completion_result = await self.db.execute(
            select(
                ClassCompletion.id,
                ClassCompletion.completed_at,
                CourseClass.title,
                CourseClass.duration_minutes,
                Course.id,
                Course.title,
            )
            .join(CourseClass, CourseClass.id == ClassCompletion.class_id)
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .join(Course, Course.id == CourseModule.course_id)
            .where(ClassCompletion.user_id == user.id)
            .order_by(ClassCompletion.completed_at.desc())
            .limit(limit)
        )
        for (
            completion_id,
            completed_at,
            class_title,
            duration_minutes,
            course_id,
            course_title,
        ) in completion_result.all():
            detail = "Clase completada"
            if duration_minutes:
                detail = f"Clase completada, {duration_minutes} min"
            events.append(
                (
                    _as_utc(completed_at),
                    RecentActivityItem(
                        id=f"class-{completion_id}",
                        type="class_completed",
                        title=f"Completaste «{class_title}»",
                        detail=detail,
                        course_id=course_id,
                        course_title=course_title,
                        occurred_at=_iso(completed_at),
                    ),
                )
            )

        attempt_result = await self.db.execute(
            select(
                QuizAttempt.id,
                QuizAttempt.started_at,
                QuizAttempt.completed_at,
                QuizAttempt.passed,
                QuizAttempt.score,
                Quiz.title,
                Course.id,
                Course.title,
            )
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .join(CourseClass, CourseClass.id == Quiz.class_id)
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .join(Course, Course.id == CourseModule.course_id)
            .where(QuizAttempt.user_id == user.id)
            .order_by(
                func.coalesce(QuizAttempt.completed_at, QuizAttempt.started_at).desc()
            )
            .limit(limit)
        )
        for (
            attempt_id,
            started_at,
            completed_at,
            passed,
            score,
            quiz_title,
            course_id,
            course_title,
        ) in attempt_result.all():
            occurred_at = completed_at or started_at
            if completed_at is None:
                event_type = "quiz_attempted"
                title = f"Iniciaste «{quiz_title}»"
                detail = "Intento en curso"
            elif passed:
                event_type = "quiz_passed"
                title = f"Aprobaste «{quiz_title}»"
                detail = f"Puntaje: {score}%" if score is not None else "Evaluación aprobada"
            else:
                event_type = "quiz_attempted"
                title = f"Realizaste «{quiz_title}»"
                detail = (
                    f"Puntaje: {score}%" if score is not None else "Evaluación completada"
                )

            events.append(
                (
                    _as_utc(occurred_at),
                    RecentActivityItem(
                        id=f"quiz-{attempt_id}",
                        type=event_type,
                        title=title,
                        detail=detail,
                        course_id=course_id,
                        course_title=course_title,
                        occurred_at=_iso(occurred_at),
                    ),
                )
            )

        license_result = await self.db.execute(
            select(
                License.id,
                License.redeemed_at,
                License.course_id,
                Course.title,
                LearningPath.title,
                Product.name,
            )
            .outerjoin(Course, Course.id == License.course_id)
            .outerjoin(LearningPath, LearningPath.id == License.learning_path_id)
            .outerjoin(Product, Product.id == License.product_id)
            .where(
                License.redeemed_by_user_id == user.id,
                License.redeemed_at.is_not(None),
            )
            .order_by(License.redeemed_at.desc())
            .limit(limit)
        )
        for (
            license_id,
            redeemed_at,
            course_id,
            course_title,
            path_title,
            product_name,
        ) in license_result.all():
            if redeemed_at is None:
                continue
            target_title = course_title or path_title or product_name or "tu formación"
            events.append(
                (
                    _as_utc(redeemed_at),
                    RecentActivityItem(
                        id=f"license-{license_id}",
                        type="license_redeemed",
                        title="Canjeaste una licencia",
                        detail=f"Acceso habilitado para «{target_title}»",
                        course_id=course_id,
                        course_title=course_title,
                        occurred_at=_iso(redeemed_at),
                    ),
                )
            )

        enrollment_result = await self.db.execute(
            select(
                Enrollment.id,
                Enrollment.enrolled_at,
                Course.id,
                Course.title,
            )
            .join(Course, Course.id == Enrollment.course_id)
            .where(Enrollment.user_id == user.id)
            .order_by(Enrollment.enrolled_at.desc())
            .limit(limit)
        )
        for enrollment_id, enrolled_at, course_id, course_title in enrollment_result.all():
            events.append(
                (
                    _as_utc(enrolled_at),
                    RecentActivityItem(
                        id=f"enrollment-{enrollment_id}",
                        type="enrolled",
                        title="Te inscribiste en un curso",
                        detail=f"«{course_title}» ya está disponible en Mis cursos",
                        course_id=course_id,
                        course_title=course_title,
                        occurred_at=_iso(enrolled_at),
                    ),
                )
            )

        events.sort(key=lambda item: item[0], reverse=True)
        return [event for _, event in events[:limit]]

    async def _load_enrollments(self, user_id: UUID) -> list[Enrollment]:
        result = await self.db.execute(
            select(Enrollment)
            .options(
                selectinload(Enrollment.course).selectinload(Course.category),
            )
            .where(Enrollment.user_id == user_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
        return list(result.scalars().unique().all())

    async def _load_completions(self, user_id: UUID) -> list[_Completion]:
        result = await self.db.execute(
            select(
                ClassCompletion.class_id,
                ClassCompletion.completed_at,
                CourseModule.course_id,
                CourseClass.duration_minutes,
            )
            .join(CourseClass, CourseClass.id == ClassCompletion.class_id)
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .where(ClassCompletion.user_id == user_id)
        )
        return [
            _Completion(
                class_id=class_id,
                course_id=course_id,
                completed_at=completed_at,
                duration_minutes=duration_minutes,
            )
            for class_id, completed_at, course_id, duration_minutes in result.all()
        ]

    async def _load_attempts(self, user_id: UUID) -> list[_Attempt]:
        result = await self.db.execute(
            select(
                CourseModule.course_id,
                QuizAttempt.started_at,
                QuizAttempt.completed_at,
            )
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .join(CourseClass, CourseClass.id == Quiz.class_id)
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .where(QuizAttempt.user_id == user_id)
        )
        return [
            _Attempt(
                course_id=course_id,
                started_at=started_at,
                completed_at=completed_at,
            )
            for course_id, started_at, completed_at in result.all()
        ]

    async def _count_required_classes(self, enrollments: list[Enrollment]) -> int:
        course_ids = [enrollment.course_id for enrollment in enrollments]
        if not course_ids:
            return 0

        total = await self.db.scalar(
            select(func.count(CourseClass.id))
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .where(
                CourseModule.course_id.in_(course_ids),
                CourseClass.is_required.is_(True),
            )
        )
        return int(total or 0)

    async def _build_learning_path(
        self, enrollments: list[Enrollment]
    ) -> tuple[LearningPathSummary | None, list[UUID], int]:
        result = await self.db.execute(
            select(LearningPath)
            .where(LearningPath.published.is_(True))
            .order_by(LearningPath.created_at.asc(), LearningPath.id.asc())
            .limit(1)
        )
        path = result.scalar_one_or_none()
        if path is None:
            return None, [], 0

        course_result = await self.db.execute(
            select(LearningPathCourse.course_id)
            .where(LearningPathCourse.learning_path_id == path.id)
            .order_by(
                LearningPathCourse.order.asc(),
                LearningPathCourse.created_at.asc(),
            )
        )
        course_ids = list(course_result.scalars().all())
        enrollment_by_course = {
            enrollment.course_id: enrollment for enrollment in enrollments
        }
        completed_courses = sum(
            1
            for course_id in course_ids
            if course_id in enrollment_by_course
            and _is_completed(enrollment_by_course[course_id])
        )
        progress = (
            round(
                sum(
                    min(
                        100,
                        max(
                            0,
                            enrollment_by_course[course_id].progress
                            if course_id in enrollment_by_course
                            else 0,
                        ),
                    )
                    for course_id in course_ids
                )
                / len(course_ids)
            )
            if course_ids
            else 0
        )

        summary = LearningPathSummary(
            id=path.id,
            title=path.title,
            total_courses=len(course_ids),
            completed_courses=completed_courses,
            progress=progress,
        )
        return summary, course_ids, progress

    async def _build_recommendations(
        self,
        enrolled_ids: set[UUID],
        path_order: dict[UUID, int],
        path_progress: int,
        top_category_id: int | None,
        top_category_name: str | None,
    ) -> list[Recommendation]:
        statement = (
            select(Course)
            .options(
                selectinload(Course.level),
                selectinload(Course.category),
                selectinload(Course.product),
            )
            .where(Course.published.is_(True))
        )
        if enrolled_ids:
            statement = statement.where(~Course.id.in_(enrolled_ids))

        result = await self.db.execute(statement)
        candidates = list(result.scalars().unique().all())
        if not candidates:
            return []

        in_path = sorted(
            (course for course in candidates if course.id in path_order),
            key=lambda course: path_order[course.id],
        )
        remaining = [course for course in candidates if course.id not in path_order]
        affinity = sorted(
            (
                course
                for course in remaining
                if top_category_id is not None and course.category_id == top_category_id
            ),
            key=lambda course: course.created_at,
            reverse=True,
        )
        others = sorted(
            (
                course
                for course in remaining
                if top_category_id is None or course.category_id != top_category_id
            ),
            key=lambda course: course.created_at,
            reverse=True,
        )
        selected = (in_path + affinity + others)[:3]

        recommendations: list[Recommendation] = []
        for course in selected:
            if course.id in path_order:
                if path_progress >= 60:
                    reason = "Para completar tu ruta"
                elif path_progress > 0:
                    reason = "Para avanzar en tu ruta"
                else:
                    reason = "Parte de tu ruta de aprendizaje"
            elif (
                top_category_id is not None
                and course.category_id == top_category_id
                and top_category_name
            ):
                reason = f"Para profundizar en {top_category_name}"
            else:
                reason = "Para explorar otra área"

            recommendations.append(
                Recommendation(
                    course_id=course.id,
                    title=course.title,
                    image_url=course.image_url,
                    duration_hours=course.duration_hours,
                    level_name=course.level.name if course.level else None,
                    category_name=course.category.name if course.category else None,
                    price=float(course.product.price) if course.product else 0.0,
                    reason=reason,
                )
            )

        return recommendations

    async def _build_continue_course(
        self,
        enrollments: list[Enrollment],
        completions: list[_Completion],
        attempts: list[_Attempt],
    ) -> ContinueCourse | None:
        in_progress = [
            enrollment for enrollment in enrollments if not _is_completed(enrollment)
        ]
        if not in_progress:
            return None

        completion_times: dict[UUID, datetime] = {}
        for item in completions:
            completed_at = _as_utc(item.completed_at)
            previous = completion_times.get(item.course_id)
            if previous is None or completed_at > previous:
                completion_times[item.course_id] = completed_at

        attempt_times: dict[UUID, datetime] = {}
        for item in attempts:
            occurred_at = _as_utc(item.completed_at or item.started_at)
            previous = attempt_times.get(item.course_id)
            if previous is None or occurred_at > previous:
                attempt_times[item.course_id] = occurred_at

        def last_activity(enrollment: Enrollment) -> datetime:
            candidates = [_as_utc(enrollment.enrolled_at)]
            if enrollment.course_id in completion_times:
                candidates.append(completion_times[enrollment.course_id])
            if enrollment.course_id in attempt_times:
                candidates.append(attempt_times[enrollment.course_id])
            return max(candidates)

        chosen = max(in_progress, key=last_activity)

        class_result = await self.db.execute(
            select(
                CourseClass.id,
                CourseClass.title,
                CourseClass.is_required,
            )
            .join(CourseModule, CourseModule.id == CourseClass.module_id)
            .where(CourseModule.course_id == chosen.course_id)
            .order_by(
                CourseModule.position.asc(),
                CourseModule.id.asc(),
                CourseClass.position.asc(),
                CourseClass.id.asc(),
            )
        )
        classes = list(class_result.all())
        completed_class_ids = {
            item.class_id for item in completions if item.course_id == chosen.course_id
        }

        next_class = None
        if classes:
            incomplete = [
                course_class
                for course_class in classes
                if course_class.id not in completed_class_ids
            ]
            next_class = next(
                (course_class for course_class in incomplete if course_class.is_required),
                None,
            )
            if next_class is None and incomplete:
                next_class = incomplete[0]
            if next_class is None:
                next_class = classes[0]

        return ContinueCourse(
            course_id=chosen.course_id,
            title=chosen.course.title,
            image_url=chosen.course.image_url,
            progress=min(100, max(0, chosen.progress)),
            next_class_id=next_class.id if next_class else None,
            next_class_title=next_class.title if next_class else None,
        )

    def _build_weekly_activity(
        self,
        completions: list[_Completion],
        attempts: list[_Attempt],
    ) -> list[WeeklyActivityItem]:
        today = datetime.now(DASHBOARD_TZ).date()
        first_day = today - timedelta(days=6)
        buckets: dict[date, list[int]] = {
            first_day + timedelta(days=offset): [0, 0] for offset in range(7)
        }

        for item in completions:
            day = _local_date(item.completed_at)
            if day in buckets:
                buckets[day][0] += 1
                buckets[day][1] += item.duration_minutes or 0

        for item in attempts:
            occurred_at = item.completed_at or item.started_at
            day = _local_date(occurred_at)
            if day not in buckets:
                continue
            buckets[day][0] += 1
            if item.completed_at is not None:
                duration = _as_utc(item.completed_at) - _as_utc(item.started_at)
                buckets[day][1] += max(0, round(duration.total_seconds() / 60))

        return [
            WeeklyActivityItem(
                date=day,
                activity_count=values[0],
                minutes=values[1],
            )
            for day, values in sorted(buckets.items())
        ]

    def _build_recent_courses(
        self,
        enrollments: list[Enrollment],
        completions: list[_Completion],
        attempts: list[_Attempt],
    ) -> list[RecentCourse]:
        completion_times: dict[UUID, datetime] = {}
        for item in completions:
            completed_at = _as_utc(item.completed_at)
            previous = completion_times.get(item.course_id)
            if previous is None or completed_at > previous:
                completion_times[item.course_id] = completed_at

        attempt_times: dict[UUID, datetime] = {}
        for item in attempts:
            occurred_at = _as_utc(item.completed_at or item.started_at)
            previous = attempt_times.get(item.course_id)
            if previous is None or occurred_at > previous:
                attempt_times[item.course_id] = occurred_at

        rows: list[tuple[datetime, RecentCourse]] = []
        for enrollment in enrollments:
            has_activity = (
                enrollment.course_id in completion_times
                or enrollment.course_id in attempt_times
            )
            last_activity = _as_utc(enrollment.enrolled_at)
            if enrollment.course_id in completion_times:
                last_activity = max(
                    last_activity,
                    completion_times[enrollment.course_id],
                )
            if enrollment.course_id in attempt_times:
                last_activity = max(
                    last_activity,
                    attempt_times[enrollment.course_id],
                )

            if _is_completed(enrollment):
                status = "completed"
            elif enrollment.progress > 0 or has_activity:
                status = "in_progress"
            else:
                status = "not_started"

            rows.append(
                (
                    _as_utc(last_activity),
                    RecentCourse(
                        course_id=enrollment.course_id,
                        title=enrollment.course.title,
                        image_url=enrollment.course.image_url,
                        progress=min(100, max(0, enrollment.progress)),
                        status=status,
                        last_activity_at=_iso(last_activity),
                    ),
                )
            )

        rows.sort(key=lambda item: item[0], reverse=True)
        return [course for _, course in rows[:4]]
