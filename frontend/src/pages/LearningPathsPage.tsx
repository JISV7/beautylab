import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  Compass,
  RefreshCw,
  Route,
} from 'lucide-react';
import {
  CourseRoute,
  LearningPathHero,
  LearningPathsSkeleton,
  NextStepCallout,
  PathSummary,
  buildLearningPathView,
  getHeroPrimaryDestination,
  type CourseDestination,
  type PathCourseView,
} from '../components/learning-paths';
import {
  learningPathsApi,
  type LearningPathDetail,
  type LearningPathSummary,
  type MyCatalogCourse,
} from '../lib/learningPathsApi';

type PagePhase = 'loading' | 'ready' | 'error' | 'empty';

const SEEDED_PATH_SLUG = 'ruta-de-capacitacion-corporativa';

export function LearningPathsPage() {
  const navigate = useNavigate();
  const requestRef = useRef(0);

  const [phase, setPhase] = useState<PagePhase>('loading');
  const [pathOptions, setPathOptions] = useState<LearningPathSummary[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [pathDetail, setPathDetail] = useState<LearningPathDetail | null>(null);
  const [myCourses, setMyCourses] = useState<MyCatalogCourse[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const loadWorkspace = useCallback(async () => {
    const requestId = ++requestRef.current;
    setPhase('loading');
    setPathDetail(null);

    try {
      const [pathList, catalogCourses] = await Promise.all([
        learningPathsApi.listPublishedPaths(),
        learningPathsApi.getMyCourses(),
      ]);

      if (requestId !== requestRef.current) return;

      setPathOptions(pathList.learning_paths);
      setMyCourses(catalogCourses);

      if (pathList.learning_paths.length === 0) {
        setSelectedPathId(null);
        setPhase('empty');
        return;
      }

      const preferredPath =
        pathList.learning_paths.find((path) => path.slug === SEEDED_PATH_SLUG) ??
        pathList.learning_paths[0];

      setSelectedPathId(preferredPath.id);
      const detail = await learningPathsApi.getLearningPath(preferredPath.id);

      if (requestId !== requestRef.current) return;

      setPathDetail(detail);
      setPhase('ready');
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error('No se pudieron cargar las rutas de aprendizaje:', error);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace, reloadKey]);

  const handleSelectPath = async (pathId: string) => {
    if (!pathId || pathId === selectedPathId) return;

    const requestId = ++requestRef.current;
    setSelectedPathId(pathId);
    setPhase('loading');
    setPathDetail(null);

    try {
      const detail = await learningPathsApi.getLearningPath(pathId);
      if (requestId !== requestRef.current) return;
      setPathDetail(detail);
      setPhase('ready');
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error('No se pudo cargar la ruta seleccionada:', error);
      setPhase('error');
    }
  };

  const openDestination = useCallback(
    (destination: CourseDestination, courseId?: string) => {
      if (destination === 'my-courses') {
        navigate('/dashboard?tab=my-courses');
        return;
      }

      if (!courseId) return;

      const tab = destination === 'player' ? 'course-player' : 'course-details';
      navigate(`/dashboard?tab=${tab}&courseId=${courseId}`);
    },
    [navigate],
  );

  const view = useMemo(
    () => (pathDetail ? buildLearningPathView(pathDetail, myCourses) : null),
    [pathDetail, myCourses],
  );

  const handleCourseAction = (
    course: PathCourseView,
    destination: CourseDestination,
  ) => {
    openDestination(destination, course.course_id);
  };

  const handleHeroPrimaryAction = () => {
    if (!view) return;

    const targetCourse = view.nextCourse ?? view.courses[0] ?? null;
    if (!targetCourse) {
      navigate('/dashboard?tab=explore');
      return;
    }

    const destination = getHeroPrimaryDestination(
      view.nextCourse,
      view.courses[0] ?? null,
    );
    openDestination(destination, targetCourse.course_id);
  };

  const handleViewMyCourses = () => {
    navigate('/dashboard?tab=my-courses');
  };

  const handleExploreCourses = () => {
    navigate('/dashboard?tab=explore');
  };

  const routeSwitcher =
    pathOptions.length > 1 ? (
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:gap-2">
        <span>Ruta activa</span>
        <select
          value={selectedPathId ?? ''}
          onChange={(event) => void handleSelectPath(event.target.value)}
          className="min-h-10 w-full rounded-lg border border-[var(--palette-border)] bg-[var(--palette-surface)] px-3 py-2 text-sm font-semibold text-paragraph focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-primary)] sm:w-auto sm:max-w-[280px]"
          aria-label="Seleccionar ruta de aprendizaje"
        >
          {pathOptions.map((path) => (
            <option key={path.id} value={path.id}>
              {path.title}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const pageHeader = (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--link-color)]">
        <Route className="h-4 w-4" aria-hidden="true" />
        Rutas de aprendizaje
      </p>
      {routeSwitcher}
    </div>
  );

  if (phase === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[1280px]">
        <LearningPathsSkeleton />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mx-auto w-full max-w-[1280px]">
        {pageHeader}
        <div
          className="rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] px-6 py-12 text-center sm:px-10"
          role="alert"
        >
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--palette-background)] text-warning">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-paragraph">
            No pudimos cargar la ruta de aprendizaje
          </h1>
          <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
            Revisa tu conexión e inténtalo de nuevo. Tus cursos y tu avance no se han
            modificado.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="theme-button theme-button-primary min-h-11 px-5 py-2.5 text-sm"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
            <button
              type="button"
              onClick={handleExploreCourses}
              className="theme-button theme-button-secondary min-h-11 px-5 py-2.5 text-sm"
            >
              Explorar cursos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="mx-auto w-full max-w-[1280px]">
        {pageHeader}
        <div className="overflow-hidden rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)]">
          <div className="relative border-b border-[var(--palette-border)] px-6 py-10 sm:px-10 sm:py-12">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--palette-accent) 18%, transparent) 0, transparent 34%)',
              }}
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--palette-primary)] text-[var(--on-primary)]">
                <Route className="h-5 w-5" aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-2xl font-bold leading-tight text-paragraph sm:text-3xl">
                Todavía no hay rutas publicadas
              </h1>
              <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted sm:text-base">
                Cuando se publique una ruta corporativa, aparecerá aquí con sus cursos
                ordenados y tu avance. Mientras tanto, puedes explorar la oferta formativa.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleExploreCourses}
                  className="theme-button theme-button-primary min-h-11 px-5 py-2.5 text-sm"
                >
                  <Compass className="h-4 w-4" aria-hidden="true" />
                  Explorar cursos
                </button>
                <button
                  type="button"
                  onClick={handleViewMyCourses}
                  className="theme-button theme-button-secondary min-h-11 px-5 py-2.5 text-sm"
                >
                  Ir a mis cursos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="mx-auto w-full max-w-[1280px]">
        {pageHeader}
        <div className="rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] p-8 text-center">
          <p className="text-paragraph">No hay información disponible para esta ruta.</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 text-sm font-bold text-link"
          >
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      {pageHeader}

      <LearningPathHero
        view={view}
        onPrimaryAction={handleHeroPrimaryAction}
        onSecondaryAction={handleViewMyCourses}
      />

      {view.courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] p-8 text-center">
          <Route
            className="mx-auto h-10 w-10 text-[var(--link-color)] opacity-70"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-xl font-bold text-paragraph">
            Esta ruta todavía no tiene cursos
          </h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-sm text-muted">
            La ruta está publicada, pero aún no se han añadido etapas. Explora otros cursos
            mientras se completa.
          </p>
          <button
            type="button"
            onClick={handleExploreCourses}
            className="theme-button theme-button-primary mt-5 px-5 py-2.5 text-sm"
          >
            Explorar cursos
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_310px] xl:items-start">
          <div className="min-w-0">
            <NextStepCallout
              view={view}
              onCourseAction={handleCourseAction}
              onViewMyCourses={handleViewMyCourses}
            />
            <CourseRoute view={view} onCourseAction={handleCourseAction} />
          </div>

          <div className="min-w-0 xl:sticky xl:top-6">
            <PathSummary view={view} onViewMyCourses={handleViewMyCourses} />
          </div>
        </div>
      )}
    </div>
  );
}
