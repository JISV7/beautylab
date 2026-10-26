import { BookOpen, Compass, Play, RotateCcw } from 'lucide-react';
import type { ContinueCourse } from '../../lib/dashboardApi';

interface ContinueLearningHeroProps {
  course: ContinueCourse | null;
  disabled: boolean;
  onContinue: () => void;
  onExplore: () => void;
  onMyCourses: () => void;
}

function ProgressArc({ value, label }: { value: number; label: string }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={label}
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth="8"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#55C7E8"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-white">
          {progress}
          <span className="text-xl">%</span>
        </span>
        <span className="mt-1 text-[11px] font-medium text-white/65">de avance</span>
      </div>
    </div>
  );
}

export function ContinueLearningHero({
  course,
  disabled,
  onContinue,
  onExplore,
  onMyCourses,
}: ContinueLearningHeroProps) {
  const primaryLabel =
    course && course.progress >= 100
      ? 'Repasar curso'
      : course && course.progress <= 0
        ? 'Comenzar curso'
        : 'Continuar curso';

  const PrimaryIcon = course && course.progress >= 100 ? RotateCcw : Play;

  return (
    <section
      aria-labelledby="continue-learning-title"
      className="relative overflow-hidden rounded-2xl bg-[#0D2B4D] text-white"
    >
      <div className="relative grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center lg:gap-9">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#7DD9EC]">Continuar aprendizaje</p>

          {course ? (
            <>
              <h2
                id="continue-learning-title"
                className="mt-2.5 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[1.7rem]"
              >
                {course.title}
              </h2>

              <div className="mt-5 max-w-xl border-l border-white/20 pl-4">
                <p className="text-[11px] font-medium text-white/55">Siguiente clase</p>
                <p className="mt-1 text-sm leading-snug text-white/90">
                  {course.next_class_title ?? 'Repasa el contenido del curso desde el inicio.'}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={disabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-[#0D2B4D] transition-colors hover:bg-[#DFF6FC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55C7E8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
                  {primaryLabel}
                </button>
                <button
                  type="button"
                  onClick={onMyCourses}
                  disabled={disabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55C7E8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Ver mis cursos
                </button>
              </div>
            </>
          ) : (
            <>
              <h2
                id="continue-learning-title"
                className="mt-2.5 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[1.7rem]"
              >
                Tu próximo curso empieza aquí
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
                No tienes un curso en progreso. Explora la oferta disponible y elige el
                que mejor se ajuste a tu rol.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={onExplore}
                  disabled={disabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-[#0D2B4D] transition-colors hover:bg-[#DFF6FC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55C7E8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  Explorar catálogo
                </button>
                <button
                  type="button"
                  onClick={onMyCourses}
                  disabled={disabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55C7E8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Ver mis cursos
                </button>
              </div>
            </>
          )}
        </div>

        <div className="lg:border-l lg:border-white/10 lg:pl-9">
          <ProgressArc
            value={course?.progress ?? 0}
            label={
              course
                ? `${course.progress}% de avance en ${course.title}`
                : 'Aún no tienes un curso en progreso'
            }
          />
        </div>
      </div>
    </section>
  );
}
