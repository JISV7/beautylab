import { ArrowUpRight, Route } from 'lucide-react';
import type { LearningPathSummary } from '../../lib/dashboardApi';

interface LearningPathPanelProps {
  path: LearningPathSummary | null;
  disabled: boolean;
  onOpenPaths: () => void;
}

export function LearningPathPanel({
  path,
  disabled,
  onOpenPaths,
}: LearningPathPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-paragraph">Tu ruta</h3>
        <Route className="h-4 w-4 text-muted" aria-hidden="true" />
      </div>

      {path ? (
        <>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-paragraph">
            {path.title}
          </p>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-4xl font-bold tabular-nums leading-none text-[#0D2B4D]">
              {path.progress}
              <span className="text-lg font-semibold">%</span>
            </p>
            <p className="max-w-[7.5rem] text-right text-[11px] leading-snug text-muted">
              de avance promedio en la ruta
            </p>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-[#0D2B4D]/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={path.progress}
            aria-label={`Progreso en la ruta ${path.title}`}
          >
            <div
              className="h-full rounded-full bg-[#1E5AA8] transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${Math.min(100, Math.max(0, path.progress))}%` }}
            />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            {path.completed_courses} de {path.total_courses}{' '}
            {path.total_courses === 1 ? 'curso completado' : 'cursos completados'}
          </p>

          <button
            type="button"
            onClick={onOpenPaths}
            disabled={disabled}
            className="mt-auto inline-flex min-h-9 items-center gap-1.5 self-start pt-4 text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ver ruta completa
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm font-semibold leading-snug text-paragraph">
            Aún no hay una ruta publicada
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Cuando tu empresa publique una ruta, verás aquí tu avance por etapas.
          </p>
          <button
            type="button"
            onClick={onOpenPaths}
            disabled={disabled}
            className="mt-auto inline-flex min-h-9 items-center gap-1.5 self-start pt-4 text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ver rutas de aprendizaje
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
