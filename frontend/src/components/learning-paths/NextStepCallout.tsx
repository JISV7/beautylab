import { ArrowRight, BadgeCheck, Compass, KeyRound, PlayCircle } from 'lucide-react';
import type { CourseDestination, LearningPathView, PathCourseView } from './model';
import { getCourseAction, getNextStepMessage } from './model';

interface NextStepCalloutProps {
  view: LearningPathView;
  onCourseAction: (course: PathCourseView, destination: CourseDestination) => void;
  onViewMyCourses: () => void;
}

export function NextStepCallout({
  view,
  onCourseAction,
  onViewMyCourses,
}: NextStepCalloutProps) {
  const course = view.nextCourse;
  const action = course ? getCourseAction(course) : null;
  const Icon = course?.hasAccess ? PlayCircle : course?.canRedeem ? KeyRound : Compass;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--palette-border)] border-l-4 border-l-[var(--palette-accent)] bg-[var(--palette-surface)] p-4 sm:p-5"
      aria-labelledby="next-step-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--palette-primary)] text-[var(--on-primary)]">
            {course ? (
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            ) : (
              <BadgeCheck className="h-4.5 w-4.5" aria-hidden="true" />
            )}
          </span>

          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[var(--link-color)]">
              {course ? 'Siguiente en la ruta' : 'Ruta completada'}
            </p>
            <h2
              id="next-step-title"
              className="mt-1 text-base font-bold leading-snug text-paragraph sm:text-lg"
            >
              {course
                ? `${String(course.order).padStart(2, '0')}. ${course.course_title}`
                : 'Completaste todas las etapas'}
            </h2>
            <p className="mt-1 max-w-[58ch] text-sm text-muted">
              {course
                ? getNextStepMessage(course)
                : `Terminaste los ${view.totalCourses} cursos de esta ruta. Puedes repasar los contenidos desde Mis cursos.`}
            </p>
          </div>
        </div>

        {course && action ? (
          <button
            type="button"
            onClick={() => onCourseAction(course, action.destination)}
            className="theme-button theme-button-primary min-h-10 w-full flex-none px-4 py-2.5 text-sm sm:w-auto"
            aria-label={`${action.label}: ${course.course_title}`}
          >
            {action.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onViewMyCourses}
            className="theme-button theme-button-secondary min-h-10 w-full flex-none px-4 py-2.5 text-sm sm:w-auto"
          >
            Ir a mis cursos
          </button>
        )}
      </div>
    </section>
  );
}
