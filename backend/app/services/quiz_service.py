"""Quiz authoring, grading and attempt management."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course_class import CourseClass
from app.models.quiz import (
    Quiz,
    QuizAttempt,
    QuizAttemptAnswer,
    QuizOption,
    QuizQuestion,
)
from app.models.user import User
from app.schemas.quiz import (
    AdminQuizAttemptItem,
    QuizAttemptResult,
    QuizAttemptStart,
    QuizAttemptSummary,
    QuizQuestionInput,
    QuizQuestionResult,
    QuizSubmitRequest,
    QuizUpsertRequest,
    StudentQuizOption,
    StudentQuizQuestion,
    StudentQuizState,
)
from app.services.course_access_service import CourseAccessService
from app.services.course_progress_service import CourseProgressService

QUESTION_TYPES = {"single_choice", "multiple_choice", "true_false"}


class QuizService:
    """Company quiz CRUD and student attempt flow."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------------------------------------------------------
    # Admin
    # ------------------------------------------------------------------
    async def get_class(self, class_id: UUID) -> CourseClass | None:
        result = await self.db.execute(
            select(CourseClass).where(CourseClass.id == class_id)
        )
        return result.scalar_one_or_none()

    async def get_admin_quiz(self, class_id: UUID) -> Quiz | None:
        result = await self.db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
            .where(Quiz.class_id == class_id)
        )
        return result.scalar_one_or_none()

    async def get_quiz_by_id(self, quiz_id: UUID) -> Quiz | None:
        result = await self.db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
            .where(Quiz.id == quiz_id)
        )
        return result.scalar_one_or_none()

    def _validate_question(self, question: QuizQuestionInput) -> None:
        if question.question_type not in QUESTION_TYPES:
            raise ValueError(f"Tipo de pregunta no válido: {question.question_type}")
        if len(question.options) < 2:
            raise ValueError("Cada pregunta debe tener al menos dos opciones")

        correct_count = sum(1 for option in question.options if option.is_correct)
        if question.question_type in {"single_choice", "true_false"}:
            if correct_count != 1:
                raise ValueError(
                    "Las preguntas de selección única y verdadero/falso deben "
                    "tener exactamente una opción correcta"
                )
        elif correct_count < 1:
            raise ValueError(
                "Las preguntas de selección múltiple deben tener al menos una "
                "opción correcta"
            )

        if question.question_type == "true_false" and len(question.options) != 2:
            raise ValueError("Las preguntas de verdadero/falso deben tener dos opciones")

    async def upsert_quiz(self, class_id: UUID, payload: QuizUpsertRequest) -> Quiz:
        course_class = await self.get_class(class_id)
        if not course_class:
            raise ValueError("Clase no encontrada")

        if payload.is_published and not payload.questions:
            raise ValueError("No puedes publicar un quiz sin preguntas")

        for question in payload.questions:
            self._validate_question(question)

        quiz = await self.get_admin_quiz(class_id)

        if not quiz:
            quiz = Quiz(class_id=class_id, title=payload.title)
            self.db.add(quiz)
            await self.db.flush()
        else:
            for question in list(quiz.questions):
                await self.db.delete(question)
            await self.db.flush()

        quiz.title = payload.title.strip()
        quiz.description = payload.description
        quiz.passing_score = payload.passing_score
        quiz.max_attempts = payload.max_attempts
        quiz.time_limit_minutes = payload.time_limit_minutes
        quiz.show_answers_after_submit = payload.show_answers_after_submit
        quiz.is_published = payload.is_published

        for question_position, question_data in enumerate(
            payload.questions, start=1
        ):
            question = QuizQuestion(
                quiz_id=quiz.id,
                prompt=question_data.prompt.strip(),
                question_type=question_data.question_type,
                points=question_data.points,
                explanation=question_data.explanation,
                position=question_data.position or question_position,
            )
            self.db.add(question)
            await self.db.flush()

            for option_position, option_data in enumerate(
                question_data.options, start=1
            ):
                self.db.add(
                    QuizOption(
                        question_id=question.id,
                        text=option_data.text.strip(),
                        is_correct=option_data.is_correct,
                        position=option_position,
                    )
                )

        course_class.has_evaluation = True
        if course_class.content_type == "video":
            course_class.content_type = "mixed"

        await self.db.commit()
        refreshed = await self.get_admin_quiz(class_id)
        if not refreshed:
            raise ValueError("No se pudo guardar el quiz")
        return refreshed

    async def delete_quiz(self, class_id: UUID) -> None:
        quiz = await self.get_admin_quiz(class_id)
        if not quiz:
            raise ValueError("Quiz no encontrado")

        course_class = await self.get_class(class_id)
        await self.db.delete(quiz)
        if course_class:
            course_class.has_evaluation = False
            if course_class.content_type == "quiz":
                course_class.content_type = "video"
        await self.db.commit()

    async def list_admin_attempts(self, class_id: UUID) -> list[AdminQuizAttemptItem]:
        quiz = await self.get_admin_quiz(class_id)
        if not quiz:
            raise ValueError("Quiz no encontrado")

        result = await self.db.execute(
            select(QuizAttempt, User)
            .join(User, User.id == QuizAttempt.user_id)
            .where(QuizAttempt.quiz_id == quiz.id)
            .order_by(QuizAttempt.started_at.desc())
        )
        return [
            AdminQuizAttemptItem(
                id=attempt.id,
                user_id=user.id,
                user_name=user.full_name,
                user_email=user.email,
                status=attempt.status,
                score=attempt.score,
                passed=attempt.passed,
                started_at=attempt.started_at,
                completed_at=attempt.completed_at,
            )
            for attempt, user in result.all()
        ]

    # ------------------------------------------------------------------
    # Student
    # ------------------------------------------------------------------
    async def get_student_quiz(self, class_id: UUID) -> Quiz | None:
        result = await self.db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
            .where(Quiz.class_id == class_id, Quiz.is_published.is_(True))
        )
        return result.scalar_one_or_none()

    async def _get_attempts(self, quiz_id: UUID, user_id: UUID) -> list[QuizAttempt]:
        result = await self.db.execute(
            select(QuizAttempt)
            .where(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.user_id == user_id,
            )
            .order_by(QuizAttempt.started_at.desc())
        )
        return list(result.scalars().all())

    async def get_student_state(
        self, user_id: UUID, class_id: UUID
    ) -> StudentQuizState | None:
        quiz = await self.get_student_quiz(class_id)
        if not quiz:
            return None

        attempts = await self._get_attempts(quiz.id, user_id)
        completed = [item for item in attempts if item.status == "submitted"]
        scores = [item.score for item in completed if item.score is not None]
        in_progress = next(
            (item for item in attempts if item.status == "in_progress"), None
        )
        attempts_remaining = (
            max(0, quiz.max_attempts - len(attempts)) if quiz.max_attempts else None
        )

        last_attempt = attempts[0] if attempts else None

        return StudentQuizState(
            quiz_id=quiz.id,
            class_id=class_id,
            title=quiz.title,
            description=quiz.description,
            passing_score=quiz.passing_score,
            max_attempts=quiz.max_attempts,
            time_limit_minutes=quiz.time_limit_minutes,
            question_count=len(quiz.questions),
            is_published=quiz.is_published,
            attempts_used=len(attempts),
            attempts_remaining=attempts_remaining,
            best_score=max(scores) if scores else None,
            passed=any(item.passed for item in completed),
            in_progress_attempt_id=in_progress.id if in_progress else None,
            last_attempt=(
                QuizAttemptSummary.model_validate(last_attempt)
                if last_attempt
                else None
            ),
        )

    def _sanitize_questions(self, quiz: Quiz) -> list[StudentQuizQuestion]:
        return [
            StudentQuizQuestion(
                id=question.id,
                prompt=question.prompt,
                question_type=question.question_type,
                points=question.points,
                position=question.position,
                options=[
                    StudentQuizOption(
                        id=option.id,
                        text=option.text,
                        position=option.position,
                    )
                    for option in question.options
                ],
            )
            for question in quiz.questions
        ]

    def _expires_at(self, quiz: Quiz, started_at: datetime) -> datetime | None:
        if not quiz.time_limit_minutes:
            return None
        return started_at + timedelta(minutes=quiz.time_limit_minutes)

    async def start_attempt(
        self, user_id: UUID, class_id: UUID
    ) -> QuizAttemptStart:
        quiz = await self.get_student_quiz(class_id)
        if not quiz:
            raise ValueError("El quiz no está disponible")
        if not quiz.questions:
            raise ValueError("El quiz no tiene preguntas")

        attempts = await self._get_attempts(quiz.id, user_id)
        in_progress = next(
            (item for item in attempts if item.status == "in_progress"), None
        )

        now = datetime.now(UTC)
        if in_progress:
            expires_at = self._expires_at(quiz, in_progress.started_at)
            if expires_at and now > expires_at:
                in_progress.status = "expired"
                in_progress.completed_at = now
                await self.db.commit()
            else:
                return QuizAttemptStart(
                    attempt_id=in_progress.id,
                    started_at=in_progress.started_at,
                    expires_at=expires_at,
                    questions=self._sanitize_questions(quiz),
                )

        if quiz.max_attempts and len(attempts) >= quiz.max_attempts:
            raise ValueError("No quedan intentos disponibles para este quiz")

        progress_service = CourseProgressService(self.db)
        course_id = await progress_service.get_class_course_id(class_id)
        enrollment = (
            await progress_service.get_enrollment(user_id, course_id)
            if course_id
            else None
        )

        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=user_id,
            enrollment_id=enrollment.id if enrollment else None,
            status="in_progress",
            started_at=now,
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(attempt)

        return QuizAttemptStart(
            attempt_id=attempt.id,
            started_at=attempt.started_at,
            expires_at=self._expires_at(quiz, attempt.started_at),
            questions=self._sanitize_questions(quiz),
        )

    async def submit_attempt(
        self,
        user_id: UUID,
        attempt_id: UUID,
        payload: QuizSubmitRequest,
    ) -> QuizAttemptResult:
        result = await self.db.execute(
            select(QuizAttempt)
            .options(
                selectinload(QuizAttempt.quiz)
                .selectinload(Quiz.questions)
                .selectinload(QuizQuestion.options)
            )
            .where(QuizAttempt.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise ValueError("Intento no encontrado")
        if attempt.user_id != user_id:
            raise PermissionError("No autorizado para enviar este intento")
        if attempt.status != "in_progress":
            raise ValueError("Este intento ya fue enviado")

        progress_service = CourseProgressService(self.db)
        course_id = await progress_service.get_class_course_id(attempt.quiz.class_id)
        if course_id:
            access = await CourseAccessService(self.db).get_course_license(
                user_id, course_id
            )
            if not access:
                raise PermissionError(
                    "No tienes acceso vigente a este curso para enviar la evaluación"
                )

        quiz = attempt.quiz
        now = datetime.now(UTC)
        expires_at = self._expires_at(quiz, attempt.started_at)
        if expires_at and now > expires_at:
            attempt.status = "expired"
            attempt.completed_at = now
            await self.db.commit()
            raise ValueError("El tiempo del intento ha expirado")

        answers_by_question = {
            str(answer.question_id): {str(option_id) for option_id in answer.selected_option_ids}
            for answer in payload.answers
        }

        total_points = 0
        earned_points = 0
        results: list[QuizQuestionResult] = []

        for question in quiz.questions:
            correct_ids = {
                str(option.id) for option in question.options if option.is_correct
            }
            selected_ids = answers_by_question.get(str(question.id), set())
            valid_ids = {str(option.id) for option in question.options}
            selected_ids = selected_ids & valid_ids

            is_correct = bool(correct_ids) and selected_ids == correct_ids
            awarded = question.points if is_correct else 0
            total_points += question.points
            earned_points += awarded

            self.db.add(
                QuizAttemptAnswer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    question_prompt=question.prompt,
                    question_type=question.question_type,
                    selected_option_ids=sorted(selected_ids),
                    is_correct=is_correct,
                    points_awarded=awarded,
                    points_possible=question.points,
                )
            )

            results.append(
                QuizQuestionResult(
                    question_id=question.id,
                    prompt=question.prompt,
                    is_correct=is_correct,
                    points_awarded=awarded,
                    points_possible=question.points,
                    correct_option_ids=(
                        [option.id for option in question.options if option.is_correct]
                        if quiz.show_answers_after_submit
                        else None
                    ),
                    explanation=(
                        question.explanation
                        if quiz.show_answers_after_submit
                        else None
                    ),
                )
            )

        score = round(earned_points * 100 / total_points) if total_points else 0
        passed = score >= quiz.passing_score

        attempt.status = "submitted"
        attempt.score = score
        attempt.passed = passed
        attempt.completed_at = now
        await self.db.commit()

        if passed:
            await progress_service.mark_class_completed(
                user_id=user_id,
                class_id=quiz.class_id,
                source="quiz",
                quiz_attempt_id=attempt.id,
            )

        return QuizAttemptResult(
            attempt_id=attempt.id,
            quiz_id=quiz.id,
            status=attempt.status,
            score=score,
            passed=passed,
            passing_score=quiz.passing_score,
            completed_at=attempt.completed_at,
            show_answers=quiz.show_answers_after_submit,
            results=results,
        )

    async def get_attempt_history(
        self, user_id: UUID, class_id: UUID
    ) -> list[QuizAttemptSummary]:
        quiz = await self.get_student_quiz(class_id)
        if not quiz:
            return []

        attempts = await self._get_attempts(quiz.id, user_id)
        return [QuizAttemptSummary.model_validate(item) for item in attempts]
