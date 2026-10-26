import type {
  LearningPathCourse,
  LearningPathDetail,
  MyCatalogCourse,
  MyCourseAccessState,
} from '../../lib/learningPathsApi';

export type CourseAccessState = MyCourseAccessState | 'not_enrolled';

export interface PathCourseView extends LearningPathCourse {
  progress: number;
  hasAccess: boolean;
  canRedeem: boolean;
  accessState: CourseAccessState;
  isCompleted: boolean;
  isOwned: boolean;
  isNext: boolean;
}

export type CourseDestination = 'player' | 'details' | 'my-courses';

export interface CourseAction {
  label: string;
  destination: CourseDestination;
}

export interface LearningPathView {
  path: LearningPathDetail;
  courses: PathCourseView[];
  totalCourses: number;
  totalDurationHours: number;
  overallProgress: number;
  completedCourses: number;
  inProgressCourses: number;
  ownedCourses: number;
  nextCourse: PathCourseView | null;
}

const clampProgress = (progress: number): number => {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
};

const isCompletedCourse = (myCourse: MyCatalogCourse): boolean =>
  myCourse.access_state === 'completed' || clampProgress(myCourse.progress) >= 100;

export const buildLearningPathView = (
  path: LearningPathDetail,
  myCourses: MyCatalogCourse[],
): LearningPathView => {
  const myCoursesById = new Map(myCourses.map((course) => [course.course_id, course]));
  const orderedCourses = [...path.courses].sort((a, b) => a.order - b.order);

  const courses = orderedCourses.map<PathCourseView>((course) => {
    const myCourse = myCoursesById.get(course.course_id);
    const progress = clampProgress(myCourse?.progress ?? 0);
    const isCompleted = myCourse ? isCompletedCourse(myCourse) : false;

    return {
      ...course,
      progress,
      hasAccess: myCourse?.has_access ?? false,
      canRedeem: myCourse?.can_redeem ?? false,
      accessState: myCourse?.access_state ?? 'not_enrolled',
      isCompleted,
      isOwned: Boolean(myCourse),
      isNext: false,
    };
  });

  const nextCourse = courses.find((course) => !course.isCompleted) ?? null;

  if (nextCourse) {
    nextCourse.isNext = true;
  }

  const totalCourses = courses.length;
  const completedCourses = courses.filter((course) => course.isCompleted).length;
  const inProgressCourses = courses.filter(
    (course) =>
      !course.isCompleted &&
      course.hasAccess &&
      (course.accessState === 'in_progress' || course.progress > 0),
  ).length;
  const ownedCourses = courses.filter((course) => course.isOwned).length;
  const overallProgress =
    totalCourses === 0
      ? 0
      : Math.round(
          courses.reduce((total, course) => total + course.progress, 0) / totalCourses,
        );

  const courseDuration = courses.reduce(
    (total, course) => total + (course.course_duration_hours ?? 0),
    0,
  );
  const totalDurationHours =
    path.total_duration_hours > 0 ? path.total_duration_hours : courseDuration;

  return {
    path,
    courses,
    totalCourses,
    totalDurationHours,
    overallProgress,
    completedCourses,
    inProgressCourses,
    ownedCourses,
    nextCourse,
  };
};

export const getCourseStatus = (course: PathCourseView): string => {
  if (course.isCompleted) return 'Completado';
  if (course.hasAccess && (course.accessState === 'in_progress' || course.progress > 0)) {
    return 'En curso';
  }
  if (course.hasAccess) return 'Disponible';
  if (course.accessState === 'ready_to_redeem' || course.canRedeem) return 'Licencia lista';
  if (course.accessState === 'payment_pending') return 'Pago pendiente';
  if (course.accessState === 'unavailable') return 'Sin acceso';
  return 'Por explorar';
};

export const getCourseAction = (course: PathCourseView): CourseAction => {
  if (course.isCompleted) {
    return course.hasAccess
      ? { label: 'Repasar', destination: 'player' }
      : { label: 'Ver curso', destination: 'details' };
  }

  if (course.hasAccess) {
    return course.accessState === 'in_progress' || course.progress > 0
      ? { label: 'Continuar', destination: 'player' }
      : { label: 'Comenzar', destination: 'player' };
  }

  if (course.accessState === 'ready_to_redeem' || course.canRedeem) {
    return { label: 'Canjear', destination: 'my-courses' };
  }

  return course.accessState === 'not_enrolled'
    ? { label: 'Explorar', destination: 'details' }
    : { label: 'Ver curso', destination: 'details' };
};

export const getHeroPrimaryDestination = (
  nextCourse: PathCourseView | null,
  fallbackCourse: PathCourseView | null,
): CourseDestination => {
  const target = nextCourse ?? fallbackCourse;
  return target?.hasAccess ? 'player' : 'details';
};

export const getHeroPrimaryLabel = (
  nextCourse: PathCourseView | null,
  fallbackCourse: PathCourseView | null,
): string => {
  if (!nextCourse) return fallbackCourse ? 'Repasar la ruta' : 'Explorar cursos';

  if (nextCourse.hasAccess) {
    return nextCourse.progress > 0 ? 'Continuar la ruta' : 'Comenzar la ruta';
  }

  return 'Ver siguiente curso';
};

export const getNextStepMessage = (course: PathCourseView): string => {
  if (course.accessState === 'ready_to_redeem' || course.canRedeem) {
    return 'Tu licencia está lista. Canjéala desde Mis cursos para abrir el curso.';
  }

  if (!course.isOwned) {
    return 'Este curso aún no está en tu cuenta. Revisa el detalle para conocer cómo acceder.';
  }

  if (course.accessState === 'payment_pending') {
    return 'El pago está pendiente. Revisa el detalle del curso antes de comenzar.';
  }

  if (course.accessState === 'unavailable') {
    return 'Tus licencias actuales no dan acceso a este curso. Revisa el detalle.';
  }

  if (course.hasAccess && course.progress > 0) {
    return `Has completado el ${course.progress}%. Retoma la ruta donde la dejaste.`;
  }

  if (course.hasAccess) {
    return 'Tu acceso está activo. Abre el curso y completa la primera clase.';
  }

  return 'Revisa el detalle del curso para conocer cómo acceder.';
};

export const formatHours = (hours: number): string => {
  if (!Number.isFinite(hours) || hours <= 0) return 'Duración no indicada';
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
};

export const formatHoursShort = (hours: number | null): string => {
  if (hours === null || !Number.isFinite(hours) || hours <= 0) {
    return 'Duración no indicada';
  }
  return `${hours} h`;
};

export const getCourseCountLabel = (count: number): string =>
  `${count} ${count === 1 ? 'curso' : 'cursos'}`;

export const getStepCountLabel = (count: number): string =>
  `${count} ${count === 1 ? 'etapa' : 'etapas'}`;
