export function LearningPathsSkeleton() {
  return (
    <div
      className="animate-pulse motion-reduce:animate-none"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando la ruta de aprendizaje</span>

      <div className="mb-5 h-4 w-40 rounded bg-[var(--palette-border)]" />

      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--palette-border)] bg-[var(--palette-surface)]">
        <div className="grid gap-9 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12 xl:p-10">
          <div>
            <div className="h-4 w-36 rounded bg-[var(--palette-border)]" />
            <div className="mt-5 h-10 w-11/12 rounded bg-[var(--palette-border)] sm:h-12" />
            <div className="mt-2 h-10 w-8/12 rounded bg-[var(--palette-border)] sm:h-12" />
            <div className="mt-6 space-y-2.5">
              <div className="h-3.5 w-full max-w-xl rounded bg-[var(--palette-border)]" />
              <div className="h-3.5 w-10/12 max-w-lg rounded bg-[var(--palette-border)]" />
            </div>
            <div className="mt-6 flex flex-wrap gap-5">
              <div className="h-4 w-24 rounded bg-[var(--palette-border)]" />
              <div className="h-4 w-28 rounded bg-[var(--palette-border)]" />
              <div className="h-4 w-32 rounded bg-[var(--palette-border)]" />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="h-12 w-full rounded-xl bg-[var(--palette-border)] sm:w-44" />
              <div className="h-12 w-full rounded-xl bg-[var(--palette-border)] sm:w-36" />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--palette-border)] p-5 sm:p-6">
            <div className="flex justify-between gap-4">
              <div className="h-4 w-28 rounded bg-[var(--palette-border)]" />
              <div className="h-6 w-14 rounded-full bg-[var(--palette-border)]" />
            </div>
            <div className="mt-9 h-14 w-32 rounded bg-[var(--palette-border)]" />
            <div className="mt-8 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-1.5 flex-1 rounded-full bg-[var(--palette-border)]"
                />
              ))}
            </div>
            <div className="mt-8 h-4 w-40 rounded bg-[var(--palette-border)]" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
        <div>
          <div className="h-28 rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)]" />
          <div className="mt-8 h-7 w-52 rounded bg-[var(--palette-border)]" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-[var(--palette-border)]" />
          <div className="mt-5 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)]"
              />
            ))}
          </div>
        </div>
        <div className="hidden h-96 rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] lg:block" />
      </div>
    </div>
  );
}
