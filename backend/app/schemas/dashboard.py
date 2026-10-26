"""Schemas for the collaborator dashboard (Inicio)."""

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """Learning indicators for the current user."""

    active_courses: int = 0
    completed_courses: int = 0
    total_courses: int = 0
    average_progress: int = 0
    classes_completed: int = 0
    total_required_classes: int = 0
    study_hours: float = 0.0
    current_streak_days: int = 0
    longest_streak_days: int = 0


class ContinueCourse(BaseModel):
    """The in-progress course the customer should resume."""

    course_id: UUID
    title: str
    image_url: str | None = None
    progress: int = 0
    next_class_id: UUID | None = None
    next_class_title: str | None = None


class WeeklyActivityItem(BaseModel):
    """One day in the seven-day learning rhythm."""

    date: date
    activity_count: int = 0
    minutes: int = 0


class LearningPathSummary(BaseModel):
    """Aggregated progress through the published learning path."""

    id: UUID
    title: str
    total_courses: int = 0
    completed_courses: int = 0
    progress: int = 0


class Recommendation(BaseModel):
    """Published course suggested to the current user."""

    course_id: UUID
    title: str
    image_url: str | None = None
    duration_hours: int | None = None
    level_name: str | None = None
    category_name: str | None = None
    price: float = 0.0
    reason: str


class RecentCourse(BaseModel):
    """Course with registered learning activity."""

    course_id: UUID
    title: str
    image_url: str | None = None
    progress: int = 0
    status: Literal["completed", "in_progress", "not_started"] = "not_started"
    last_activity_at: str


class DashboardSummaryResponse(BaseModel):
    """Full payload for the Inicio page."""

    stats: DashboardStats
    continue_course: ContinueCourse | None = None
    weekly_activity: list[WeeklyActivityItem] = Field(default_factory=list)
    learning_path: LearningPathSummary | None = None
    recommendations: list[Recommendation] = Field(default_factory=list)
    recent_courses: list[RecentCourse] = Field(default_factory=list)


ActivityType = Literal[
    "class_completed",
    "quiz_passed",
    "quiz_attempted",
    "license_redeemed",
    "enrolled",
]


class RecentActivityItem(BaseModel):
    """A single learning event shown in the activity timeline."""

    id: str
    type: ActivityType
    title: str
    detail: str
    course_id: UUID | None = None
    course_title: str | None = None
    occurred_at: str
