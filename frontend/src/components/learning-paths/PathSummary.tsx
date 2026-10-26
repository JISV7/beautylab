import { ArrowRight, CheckCircle2, Route } from 'lucide-react';
import type { LearningPathView } from './model';
import { formatHours } from './model';

interface PathSummaryProps {
  view: LearningPathView;
  onViewMyCourses: () => void;
}

export function PathSummary({ view, onViewMyCourses }: PathSummaryProps) {
  const isComplete = view.totalCourses > 0 && view.completedCourses === view.totalCourses;

  return (
    <aside
      className="overflow-hidden rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)]"
      aria-labelledby="path-summary-title"
    >
      <div className="relative border-b border-[var(--palette-border)] px-5 pb-4 pt-5">
        <span
          className="absolute inset-x-0 top-0 h-1 bg-[var(--palette-accent)]"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[var(--link-color)]">Tu recorrido</p>
            <h2
              id="path-summary-title"
              className="mt-1 text-lg font-bold leading-snug text-paragraph"
            >
              Resumen de la ruta
            </h2>
          </div>
          <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--palette-border)] bg-[var(--palette-background)] text-[var(--link-color)]">
            <Route className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-extrabold leading-none tracking-[-0.05em] text-paragraph tabular-nums">
              {view.overallProgress}
            </span>
            <span className="text-lg font-bold text-paragraph">%</span>
          </div>
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Ruta completa
            </span>
          ) : (
            <span className="text-xs font-medium text-muted">de avance total</span>
          )}
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--palette-border)]"
          role="progressbar"
          aria-label={`Avance general de ${view.path.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={view.overallProgress}
          aria-valuetext={`${view.overallProgress}% de avance; ${view.completedCourses} de ${view.totalCourses} cursos completados`}
        >
          <div
            className={`h-full rounded-full ${
              isComplete ? 'bg-success' : 'bg-[var(--palette-secondary)]'
            }`}
            style={{ width: `${view.overallProgress}%` }}
          />
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted">
          {view.completedCourses} de {view.totalCourses} cursos completados. El porcentaje
          promedia el avance de las {view.totalCourses} etapas.
        </p>

        <dl className="mt-5 space-y-3 border-t border-[var(--palette-border)] pt-4 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Cursos completados</dt>
            <dd className="font-bold text-paragraph tabular-nums">
              {view.completedCourses} / {view.totalCourses}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">En curso</dt>
            <dd className="font-bold text-paragraph tabular-nums">
              {view.inProgressCourses}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Con acceso</dt>
            <dd className="font-bold text-paragraph tabular-nums">
              {view.ownedCourses} / {view.totalCourses}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Duración total</dt>
            <dd className="font-bold text-paragraph">{formatHours(view.totalDurationHours)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onViewMyCourses}
          className="theme-button theme-button-secondary mt-5 w-full px-4 py-2.5 text-sm"
        >
          Ir a mis cursos
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
