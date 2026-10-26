import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  KeyRound,
  LockKeyhole,
  PlayCircle,
} from 'lucide-react';
import { CourseArtwork } from './CourseArtwork';
import type {
  CourseDestination,
  LearningPathView,
  PathCourseView,
} from './model';
import {
  formatHoursShort,
  getCourseAction,
  getCourseStatus,
  getStepCountLabel,
} from './model';

interface CourseRouteProps {
  view: LearningPathView;
  onCourseAction: (course: PathCourseView, destination: CourseDestination) => void;
}

const padOrder = (order: number): string => String(order).padStart(2, '0');

const getStatusIcon = (course: PathCourseView) => {
  if (course.isCompleted) return CheckCircle2;
  if (course.hasAccess && (course.accessState === 'in_progress' || course.progress > 0)) {
    return PlayCircle;
  }
  if (course.hasAccess) return BookOpen;
  if (course.accessState === 'ready_to_redeem' || course.canRedeem) return KeyRound;
  if (course.accessState === 'payment_pending') return Clock;
  if (course.accessState === 'unavailable') return LockKeyhole;
  return Compass;
};

const getStatusTone = (course: PathCourseView): string => {
  if (course.isCompleted) return 'text-success';
  if (course.hasAccess) return 'text-[var(--link-color)]';
  if (course.accessState === 'ready_to_redeem' || course.canRedeem) return 'text-warning';
  if (course.accessState === 'payment_pending') return 'text-warning';
  return 'text-muted';
};

export function CourseRoute({ view, onCourseAction }: CourseRouteProps) {
  return (
    <section className="mt-8" aria-labelledby="course-route-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2
            id="course-route-title"
            className="text-[1.45rem] font-bold leading-tight text-paragraph sm:text-[1.65rem]"
          >
            Recorrido de la ruta
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-sm text-muted">
            Revisa cada etapa en orden: estado, avance y siguiente acción.
          </p>
        </div>
        <span className="hidden flex-none rounded-full border border-[var(--palette-border)] px-3 py-1 text-xs font-semibold text-muted sm:inline-flex">
          {getStepCountLabel(view.totalCourses)}
        </span>
      </div>

      <ol className="space-y-5">
        {view.courses.map((course, index) => {
          const status = getCourseStatus(course);
          const action = getCourseAction(course);
          const StatusIcon = getStatusIcon(course);
          const statusTone = getStatusTone(course);
          const titleId = `course-step-${course.course_id}`;
          const progressLabel = course.isOwned
            ? `${course.progress}%`
            : 'Sin avance';
          const usePrimaryAction =
            action.destination === 'player' && !course.isCompleted;

          return (
            <li key={course.course_id} className="relative pl-12">
              {index < view.courses.length - 1 && (
                <span
                  className="absolute left-[15px] top-12 -bottom-5 w-px border-l-2 border-dashed border-[var(--palette-border)]"
                  aria-hidden="true"
                />
              )}

              <span
                className={`absolute left-0 top-5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-extrabold tabular-nums ${
                  course.isCompleted
                    ? 'border-success bg-success text-white'
                    : course.isNext
                      ? 'border-[var(--palette-accent)] bg-[var(--palette-primary)] text-[var(--on-primary)] ring-4 ring-[var(--palette-accent)]/25'
                      : course.hasAccess
                        ? 'border-[var(--palette-secondary)] bg-[var(--palette-background)] text-[var(--link-color)]'
                        : 'border-[var(--palette-border)] bg-[var(--palette-surface)] text-muted'
                }`}
                aria-hidden="true"
              >
                {padOrder(course.order)}
                {course.isCompleted && (
                  <span className="absolute -bottom-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-white ring-2 ring-[var(--palette-surface)]">
                    <CheckCircle2 className="h-2 w-2" strokeWidth={3} />
                  </span>
                )}
              </span>

              <article
                className={`overflow-hidden rounded-2xl border bg-[var(--palette-surface)] ${
                  course.isNext
                    ? 'border-[var(--palette-secondary)]'
                    : 'border-[var(--palette-border)]'
                }`}
                aria-labelledby={titleId}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative h-40 w-full flex-none overflow-hidden bg-[var(--palette-primary)] sm:h-44 md:h-auto md:w-[190px]">
                    <CourseArtwork
                      imageUrl={course.course_image_url}
                      title={course.course_title}
                    />
                    {course.isNext && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--palette-primary)] px-2.5 py-1 text-[10px] font-bold text-[var(--on-primary)] shadow-sm">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[var(--palette-accent)]"
                          aria-hidden="true"
                        />
                        Siguiente en la ruta
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                      {course.category_name && (
                        <span className="font-bold text-[var(--link-color)]">
                          {course.category_name}
                        </span>
                      )}
                      {course.level_name && (
                        <span className="rounded-full border border-[var(--palette-border)] px-2 py-0.5 font-medium text-muted">
                          {course.level_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatHoursShort(course.course_duration_hours)}
                      </span>
                    </div>

                    <h3
                      id={titleId}
                      className="mt-2.5 text-lg font-bold leading-snug text-paragraph sm:text-xl"
                    >
                      <span className="sr-only">
                        Paso {course.order} de {view.totalCourses}, {status}:{' '}
                      </span>
                      {course.course_title}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                      {course.course_description ||
                        'Consulta el contenido y las condiciones de este curso.'}
                    </p>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-muted">
                          Avance del curso
                        </span>
                        <span className="text-xs font-bold text-paragraph tabular-nums">
                          {progressLabel}
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-[var(--palette-border)]"
                        role="progressbar"
                        aria-label={`Progreso de ${course.course_title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={course.progress}
                        aria-valuetext={
                          course.isOwned
                            ? `${course.progress}% de avance`
                            : 'Sin avance registrado'
                        }
                      >
                        <div
                          className={`h-full rounded-full ${
                            course.isCompleted
                              ? 'bg-success'
                              : course.progress > 0
                                ? 'bg-[var(--palette-secondary)]'
                                : 'bg-transparent'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-dashed border-[var(--palette-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold ${statusTone}`}
                      >
                        <StatusIcon className="h-4 w-4" aria-hidden="true" />
                        {status}
                      </span>

                      <button
                        type="button"
                        onClick={() => onCourseAction(course, action.destination)}
                        className={`theme-button min-h-10 w-full px-4 py-2.5 text-sm sm:w-auto ${
                          usePrimaryAction
                            ? 'theme-button-primary'
                            : 'theme-button-secondary'
                        }`}
                        aria-label={`${action.label}: ${course.course_title}`}
                      >
                        {action.label}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
