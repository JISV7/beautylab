import { BookOpen, Compass } from 'lucide-react';
import type { WeeklyActivityItem } from '../../lib/dashboardApi';
import {
  formatShortDate,
  formatWeekday,
  formatWeekRange,
  localDateKey,
} from './dateFormat';

interface WeeklyRhythmProps {
  days: WeeklyActivityItem[];
  currentStreak: number;
  longestStreak: number;
  hasCourses: boolean;
  disabled: boolean;
  onOpenCourses: () => void;
  onExplore: () => void;
}

function activityLabel(count: number): string {
  return count === 1 ? '1 actividad' : `${count} actividades`;
}

export function WeeklyRhythm({
  days,
  currentStreak,
  longestStreak,
  hasCourses,
  disabled,
  onOpenCourses,
  onExplore,
}: WeeklyRhythmProps) {
  const totalActivities = days.reduce((total, day) => total + day.activity_count, 0);
  const totalMinutes = days.reduce((total, day) => total + day.minutes, 0);
  const peak = Math.max(1, ...days.map((day) => day.activity_count));
  const todayKey = localDateKey(new Date());
  const hasActivity = totalActivities > 0;
  const chartLabel = hasActivity
    ? `Actividad de los últimos siete días: ${activityLabel(totalActivities)} y ${totalMinutes} minutos.`
    : 'Sin actividad registrada en los últimos siete días.';

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-bold text-paragraph">Ritmo de la semana</h3>
        {days.length > 0 && (
          <p className="text-[11px] text-muted">
            {formatWeekRange(days[0].date, days[days.length - 1].date)}
          </p>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Días con clases completadas o evaluaciones registradas.
      </p>

      <div
        className="mt-5 flex h-28 items-end gap-2 border-b border-[var(--palette-border)] pb-0 sm:h-32"
        role="img"
        aria-label={chartLabel}
      >
        {days.map((day) => {
          const isToday = day.date === todayKey;
          const height =
            day.activity_count > 0
              ? Math.max(10, (day.activity_count / peak) * 100)
              : 0;

          return (
            <div
              key={day.date}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${formatWeekday(day.date)} ${formatShortDate(day.date)}: ${activityLabel(
                day.activity_count,
              )}, ${day.minutes} min`}
            >
              <div className="relative flex w-full flex-1 items-end justify-center">
                {height > 0 ? (
                  <div
                    className={`w-full max-w-6 rounded-t-[4px] transition-[height] duration-500 motion-reduce:transition-none ${
                      isToday ? 'bg-[#1E5AA8]' : 'bg-[#1E5AA8]/35'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ) : (
                  <div className="h-[3px] w-full max-w-6 rounded-full bg-[#0D2B4D]/10" />
                )}
              </div>
              <div className="flex flex-col items-center leading-none" aria-hidden="true">
                <span
                  className={`text-[10px] ${
                    isToday ? 'font-bold text-[#1E5AA8]' : 'text-muted'
                  }`}
                >
                  {formatWeekday(day.date)}
                </span>
                <span
                  className={`mt-0.5 text-[10px] tabular-nums ${
                    isToday ? 'font-semibold text-paragraph' : 'text-muted'
                  }`}
                >
                  {Number(day.date.slice(-2))}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {!hasActivity && (
        <div className="mt-4">
          <p className="text-xs leading-relaxed text-muted">
            Aún no hay actividad esta semana. Cuando completes una clase o una evaluación,
            quedará registrada aquí.
          </p>
          <button
            type="button"
            onClick={hasCourses ? onOpenCourses : onExplore}
            disabled={disabled}
            className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasCourses ? (
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {hasCourses ? 'Ir a mis cursos' : 'Explorar catálogo'}
          </button>
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-[var(--palette-border)] pt-4">
        <div>
          <p className="text-[11px] font-medium text-muted">Racha actual</p>
          <p className="mt-1 text-base font-bold tabular-nums text-paragraph">
            {currentStreak > 0
              ? `${currentStreak} ${currentStreak === 1 ? 'día' : 'días'}`
              : 'Sin racha'}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            {currentStreak > 0
              ? `Mejor racha: ${longestStreak} ${
                  longestStreak === 1 ? 'día' : 'días'
                }`
              : 'Empieza con tu próxima clase.'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted">Esta semana</p>
          <p className="mt-1 text-base font-bold tabular-nums text-paragraph">
            {activityLabel(totalActivities)}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            {totalMinutes > 0
              ? `${totalMinutes} min registrados`
              : 'Sin minutos registrados'}
          </p>
        </div>
      </div>
    </div>
  );
}
