import {
  ArrowRight,
  BookOpen,
  Clock,
  ListOrdered,
  Route,
} from 'lucide-react';
import type { LearningPathView } from './model';
import {
  getHeroPrimaryDestination,
  getHeroPrimaryLabel,
} from './model';

interface LearningPathHeroProps {
  view: LearningPathView;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}

const padOrder = (order: number): string => String(order).padStart(2, '0');

export function LearningPathHero({
  view,
  onPrimaryAction,
  onSecondaryAction,
}: LearningPathHeroProps) {
  const { path, courses, overallProgress } = view;
  const fallbackCourse = courses[0] ?? null;
  const targetCourse = view.nextCourse ?? fallbackCourse;
  const primaryLabel = getHeroPrimaryLabel(view.nextCourse, fallbackCourse);
  const destination = getHeroPrimaryDestination(view.nextCourse, fallbackCourse);

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] bg-[var(--palette-primary)]"
      aria-labelledby="learning-path-title"
    >
      <svg
        className="pointer-events-none absolute -right-28 -top-36 h-[640px] w-[760px] opacity-20 sm:-right-20 sm:-top-24 xl:opacity-30"
        viewBox="0 0 760 640"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M76 572C205 572 214 462 333 451C458 439 469 529 587 433C661 373 691 225 762 152"
          stroke="var(--palette-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 11"
        />
        <path
          d="M154 638C271 588 262 512 380 486C511 457 550 367 636 287C690 236 731 190 786 178"
          stroke="var(--palette-accent)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2 14"
          opacity=".55"
        />
        <circle cx="333" cy="451" r="5" fill="var(--palette-accent)" />
        <circle cx="587" cy="433" r="3.5" fill="var(--palette-accent)" />
        <circle cx="636" cy="287" r="3" fill="var(--palette-accent)" />
        <circle cx="333" cy="451" r="12" stroke="var(--palette-accent)" opacity=".35" />
      </svg>

      <div className="relative grid gap-9 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch xl:gap-12 xl:p-10">
        <div className="flex min-w-0 flex-col justify-center">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--palette-accent)]">
            <Route className="h-4 w-4" aria-hidden="true" />
            Ruta de aprendizaje
          </p>

          <h1
            id="learning-path-title"
            className="mt-4 max-w-[18ch] text-[clamp(2rem,4.3vw,3.35rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-[var(--on-primary)]"
          >
            {path.title}
          </h1>

          {path.description && (
            <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[var(--on-primary)] opacity-80 sm:text-base">
              {path.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[var(--on-primary)] opacity-90">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4 opacity-70" aria-hidden="true" />
              {view.totalCourses} {view.totalCourses === 1 ? 'curso' : 'cursos'}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 opacity-70" aria-hidden="true" />
              {view.totalDurationHours} h de formación
            </span>
            <span className="inline-flex items-center gap-2">
              <ListOrdered className="h-4 w-4 opacity-70" aria-hidden="true" />
              Secuencia de {view.totalCourses} etapas
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--palette-accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)] transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--palette-primary)] motion-reduce:transition-none"
              aria-label={
                targetCourse
                  ? `${primaryLabel}: ${targetCourse.course_title}`
                  : primaryLabel
              }
              data-destination={destination}
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--palette-primary)] motion-reduce:transition-none"
            >
              Ir a mis cursos
            </button>
          </div>
        </div>

        <div className="relative flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.07] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[13px] font-semibold text-[var(--on-primary)]">
              Avance de la ruta
            </p>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--on-primary)] opacity-80">
              {view.completedCourses} de {view.totalCourses}
            </span>
          </div>

          <div className="mt-7 flex items-end gap-2">
            <span className="text-6xl font-extrabold leading-none tracking-[-0.05em] text-[var(--on-primary)] tabular-nums">
              {overallProgress}%
            </span>
            <span className="pb-1.5 text-xs font-medium text-[var(--on-primary)] opacity-55">
              completado
            </span>
          </div>

          <div className="mt-7">
            <div
              className="grid grid-cols-5 gap-1.5"
              role="progressbar"
              aria-label={`Avance general de ${path.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallProgress}
              aria-valuetext={`${overallProgress}% de avance; ${view.completedCourses} de ${view.totalCourses} cursos completados`}
            >
              {courses.map((course) => (
                <span
                  key={course.course_id}
                  className="h-1.5 overflow-hidden rounded-full bg-white/15"
                  aria-hidden="true"
                >
                  <span
                    className={`block h-full rounded-full ${
                      course.isCompleted
                        ? 'bg-emerald-300'
                        : 'bg-[var(--palette-accent)]'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  />
                </span>
              ))}
            </div>
            <div
              className="mt-2 grid grid-cols-5 gap-1.5 text-[10px] font-semibold text-[var(--on-primary)] opacity-45"
              aria-hidden="true"
            >
              {courses.map((course) => (
                <span key={course.course_id} className="tabular-nums">
                  {padOrder(course.order)}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-[var(--on-primary)] opacity-70">
            {view.completedCourses === view.totalCourses && view.totalCourses > 0
              ? 'Ruta completada. Puedes repasar cualquier etapa.'
              : `${view.completedCourses} de ${view.totalCourses} cursos completados`}
            {view.inProgressCourses > 0 && (
              <span className="text-[var(--palette-accent)]">
                {` · ${view.inProgressCourses} en curso`}
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
