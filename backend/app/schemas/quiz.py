"""Schemas for quizzes, attempts and class content."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

QuestionType = Literal["single_choice", "multiple_choice", "true_false"]


# ----------------------------------------------------------------------
# Admin schemas
# ----------------------------------------------------------------------
class QuizOptionInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool = False


class QuizQuestionInput(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000)
    question_type: QuestionType = "single_choice"
    points: int = Field(1, ge=1, le=100)
    explanation: str | None = Field(None, max_length=1000)
    position: int = Field(1, ge=1)
    options: list[QuizOptionInput] = Field(default_factory=list)


class QuizUpsertRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = Field(None, max_length=1000)
    passing_score: int = Field(70, ge=1, le=100)
    max_attempts: int | None = Field(None, ge=1, le=100)
    time_limit_minutes: int | None = Field(None, ge=1, le=600)
    show_answers_after_submit: bool = True
    is_published: bool = False
    questions: list[QuizQuestionInput] = Field(default_factory=list)


class QuizOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    text: str
    is_correct: bool
    position: int


class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prompt: str
    question_type: str
    points: int
    explanation: str | None = None
    position: int
    options: list[QuizOptionResponse] = Field(default_factory=list)


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    class_id: UUID
    title: str
    description: str | None = None
    passing_score: int
    max_attempts: int | None = None
    time_limit_minutes: int | None = None
    show_answers_after_submit: bool
    is_published: bool
    questions: list[QuizQuestionResponse] = Field(default_factory=list)


# ----------------------------------------------------------------------
# Student schemas
# ----------------------------------------------------------------------
class StudentQuizOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    text: str
    position: int


class StudentQuizQuestion(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prompt: str
    question_type: str
    points: int
    position: int
    options: list[StudentQuizOption] = Field(default_factory=list)


class QuizAttemptSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    score: int | None = None
    passed: bool | None = None
    started_at: datetime
    completed_at: datetime | None = None


class StudentQuizState(BaseModel):
    quiz_id: UUID
    class_id: UUID
    title: str
    description: str | None = None
    passing_score: int
    max_attempts: int | None = None
    time_limit_minutes: int | None = None
    question_count: int
    is_published: bool
    attempts_used: int
    attempts_remaining: int | None = None
    best_score: int | None = None
    passed: bool = False
    in_progress_attempt_id: UUID | None = None
    last_attempt: QuizAttemptSummary | None = None


class QuizAttemptStart(BaseModel):
    attempt_id: UUID
    started_at: datetime
    expires_at: datetime | None = None
    questions: list[StudentQuizQuestion] = Field(default_factory=list)


class QuizAnswerInput(BaseModel):
    question_id: UUID
    selected_option_ids: list[UUID] = Field(default_factory=list)


class QuizSubmitRequest(BaseModel):
    answers: list[QuizAnswerInput] = Field(default_factory=list)


class QuizQuestionResult(BaseModel):
    question_id: UUID
    prompt: str
    is_correct: bool
    points_awarded: int
    points_possible: int
    correct_option_ids: list[UUID] | None = None
    explanation: str | None = None


class QuizAttemptResult(BaseModel):
    attempt_id: UUID
    quiz_id: UUID
    status: str
    score: int
    passed: bool
    passing_score: int
    completed_at: datetime | None = None
    show_answers: bool
    results: list[QuizQuestionResult] = Field(default_factory=list)


class AdminQuizAttemptItem(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str | None = None
    user_email: str
    status: str
    score: int | None = None
    passed: bool | None = None
    started_at: datetime
    completed_at: datetime | None = None


# ----------------------------------------------------------------------
# Class content (student player)
# ----------------------------------------------------------------------
class ClassQuizSummary(BaseModel):
    question_count: int
    passing_score: int
    max_attempts: int | None = None
    time_limit_minutes: int | None = None


class ClassContent(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    content_type: str
    video_url: str | None = None
    thumbnail_url: str | None = None
    duration_minutes: int | None = None
    is_required: bool
    has_quiz: bool = False
    quiz: ClassQuizSummary | None = None
    is_completed: bool = False
    best_score: int | None = None
    passed: bool = False
    attempts_used: int = 0


class ModuleContent(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    position: int
    classes: list[ClassContent] = Field(default_factory=list)


class CourseContentResponse(BaseModel):
    course_id: UUID
    title: str
    progress: int
    status: str
    modules: list[ModuleContent] = Field(default_factory=list)


class ClassCompletionResponse(BaseModel):
    class_id: UUID
    is_completed: bool
    progress: int
    status: str
