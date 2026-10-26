import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import {
    ArrowLeft,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Cloud,
    HelpCircle,
    Loader2,
    LockKeyhole,
    PlayCircle,
    ShieldCheck,
    VideoOff,
} from 'lucide-react';
import { CourseVideoPlayer } from '../components/course/CourseVideoPlayer';
import { ClassQuizPanel } from '../components/course/ClassQuizPanel';
import { normalizeUrl } from '../utils/url';
import { learningApi, type ClassContent, type CourseContent } from '../lib/learningApi';

const API_URL = 'http://localhost:8000';

const getAuthToken = (): string | null => localStorage.getItem('access_token');

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface PlayerCourse {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    duration_hours: number | null;
    level_name: string | null;
    category_name: string | null;
    video_url: string | null;
}

interface PlayerEnrollment {
    id: number;
    status: string;
    progress: number;
    enrolled_at: string | null;
    completed_at: string | null;
}

interface PlayerPayload {
    course: PlayerCourse;
    enrollment: PlayerEnrollment;
    license_id: string;
    license_type: string;
}

interface PlayerError {
    status?: number;
    message: string;
}

interface CoursePlayerPageProps {
    courseId: string;
    onBack?: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const formatLicenseType = (licenseType: string): string => {
    const labels: Record<string, string> = {
        gift: 'Licencia individual',
        corporate: 'Licencia corporativa',
        bulk: 'Licencia por volumen',
    };
    return labels[licenseType] || 'Licencia de acceso';
};

export default function CoursePlayerPage({ courseId, onBack }: CoursePlayerPageProps) {
    const navigate = useNavigate();
    const [data, setData] = useState<PlayerPayload | null>(null);
    const [content, setContent] = useState<CourseContent | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PlayerError | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');

    const enrollmentIdRef = useRef<number | null>(null);
    const savedProgressRef = useRef(0);
    const lastSaveAtRef = useRef(0);
    const savedStateTimerRef = useRef<number | null>(null);
    const completedClassRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        let active = true;

        const loadPlayer = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get<PlayerPayload>(
                    `/catalog/my-courses/${courseId}/player`
                );
                if (!active) return;

                setData(response.data);
                enrollmentIdRef.current = response.data.enrollment.id;
                savedProgressRef.current = response.data.enrollment.progress;
            } catch (requestError: unknown) {
                if (!active) return;

                if (axios.isAxiosError(requestError)) {
                    const detail = requestError.response?.data?.detail;
                    setError({
                        status: requestError.response?.status,
                        message:
                            typeof detail === 'string'
                                ? detail
                                : 'No pudimos abrir este curso. Inténtalo de nuevo.',
                    });
                } else {
                    setError({
                        message: 'No pudimos abrir este curso. Inténtalo de nuevo.',
                    });
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadPlayer();
        return () => {
            active = false;
        };
    }, [courseId]);

    const loadContent = useCallback(async () => {
        try {
            const next = await learningApi.getCourseContent(courseId);
            setContent(next);
            setData((previous) =>
                previous
                    ? {
                          ...previous,
                          enrollment: {
                              ...previous.enrollment,
                              progress: next.progress,
                              status: next.status,
                          },
                      }
                    : previous
            );
            setOpenModules((previous) =>
                Object.keys(previous).length > 0
                    ? previous
                    : Object.fromEntries(next.modules.map((module) => [module.id, true]))
            );
        } catch {
            // Legacy courses without class content keep the single-video player.
        }
    }, [courseId]);

    useEffect(() => {
        if (!data) return;
        void loadContent();
        // Only reload when the course changes; progress updates do not refetch content.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.course.id, loadContent]);

    useEffect(() => {
        return () => {
            if (savedStateTimerRef.current) {
                window.clearTimeout(savedStateTimerRef.current);
            }
        };
    }, []);

    const persistProgress = useCallback(async (percent: number) => {
        const enrollmentId = enrollmentIdRef.current;
        if (!enrollmentId || percent <= savedProgressRef.current) return;

        setSaveState('saving');
        try {
            const response = await api.patch<PlayerEnrollment>(
                `/enrollments/my/${enrollmentId}`,
                { progress: percent }
            );
            const savedProgress = response.data.progress;
            savedProgressRef.current = Math.max(savedProgressRef.current, savedProgress);

            setData((previous) => {
                if (!previous) return previous;
                return {
                    ...previous,
                    enrollment: {
                        ...previous.enrollment,
                        ...response.data,
                        progress: Math.max(previous.enrollment.progress, savedProgress),
                    },
                };
            });

            setSaveState('saved');
            if (savedStateTimerRef.current) {
                window.clearTimeout(savedStateTimerRef.current);
            }
            savedStateTimerRef.current = window.setTimeout(() => {
                setSaveState('idle');
            }, 2500);
        } catch {
            setSaveState('error');
        }
    }, []);

    const handleProgress = useCallback(
        (percent: number) => {
            if (!enrollmentIdRef.current || percent <= savedProgressRef.current) {
                return;
            }

            const now = Date.now();
            if (percent < 100 && now - lastSaveAtRef.current < 12000) {
                return;
            }

            lastSaveAtRef.current = now;
            void persistProgress(percent);
        },
        [persistProgress]
    );

    const allClasses = useMemo<ClassContent[]>(
        () => content?.modules.flatMap((module) => module.classes) ?? [],
        [content]
    );

    useEffect(() => {
        if (allClasses.length === 0) {
            setSelectedClassId(null);
            return;
        }
        if (selectedClassId && allClasses.some((item) => item.id === selectedClassId)) {
            return;
        }
        const firstPending = allClasses.find((item) => !item.is_completed);
        setSelectedClassId((firstPending || allClasses[0]).id);
    }, [allClasses, selectedClassId]);

    const activeClass = useMemo(
        () => allClasses.find((item) => item.id === selectedClassId) || null,
        [allClasses, selectedClassId]
    );

    const refreshAfterCompletion = useCallback(async () => {
        await loadContent();
    }, [loadContent]);

    const handleClassVideoProgress = useCallback(
        (percent: number) => {
            if (!activeClass || activeClass.content_type !== 'video') return;
            if (percent < 100 || completedClassRef.current.has(activeClass.id)) return;

            completedClassRef.current.add(activeClass.id);
            learningApi
                .completeClass(courseId, activeClass.id)
                .then((result) => {
                    setContent((previous) => {
                        if (!previous) return previous;
                        return {
                            ...previous,
                            progress: Math.max(previous.progress, result.progress),
                            status: result.status,
                            modules: previous.modules.map((module) => ({
                                ...module,
                                classes: module.classes.map((item) =>
                                    item.id === activeClass.id
                                        ? { ...item, is_completed: true }
                                        : item
                                ),
                            })),
                        };
                    });
                    setData((previous) =>
                        previous
                            ? {
                                  ...previous,
                                  enrollment: {
                                      ...previous.enrollment,
                                      progress: Math.max(
                                          previous.enrollment.progress,
                                          result.progress
                                      ),
                                      status: result.status,
                                  },
                              }
                            : previous
                    );
                })
                .catch(() => {
                    completedClassRef.current.delete(activeClass.id);
                });
        },
        [activeClass, courseId]
    );

    const toggleModule = (moduleId: string) => {
        setOpenModules((previous) => ({
            ...previous,
            [moduleId]: !previous[moduleId],
        }));
    };

    const handleBack = () => {
        if (onBack) onBack();
        else navigate('/dashboard?tab=my-courses');
    };

    if (loading) {
        return (
            <main className="flex-1 p-6 md:p-8 overflow-auto">
                <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[420px]">
                    <div className="flex items-center gap-3 text-paragraph">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Preparando tu curso...
                    </div>
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="flex-1 p-6 md:p-8 overflow-auto">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-muted hover:opacity-100 transition-opacity mb-6"
                    >
                        <ArrowLeft size={18} />
                        Volver a mis cursos
                    </button>

                    <div className="palette-surface palette-border border rounded-2xl p-8 md:p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <LockKeyhole className="w-8 h-8 text-warning dark:text-warning" />
                        </div>
                        <h1 className="text-h2 mb-3">Acceso al curso</h1>
                        <p className="text-muted max-w-lg mx-auto">
                            {error?.message ||
                                'No pudimos verificar tu acceso a este curso.'}
                        </p>
                        <button
                            onClick={handleBack}
                            className="mt-6 theme-button theme-button-primary inline-flex items-center gap-2"
                        >
                            <BookOpen size={18} />
                            Ir a mis cursos
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const { course, enrollment } = data;
    const displayProgress = content?.progress ?? enrollment.progress;
    const displayStatus = content?.status ?? enrollment.status;
    const isCompleted = displayProgress >= 100 || displayStatus === 'completed';
    const legacyVideoUrl = normalizeUrl(course.video_url);
    const posterUrl = normalizeUrl(course.image_url);

    const renderLegacyVideo = () => (
        <div className="rounded-2xl overflow-hidden palette-border border bg-black shadow-xl">
            {legacyVideoUrl ? (
                <CourseVideoPlayer
                    src={legacyVideoUrl}
                    poster={posterUrl || null}
                    title={course.title}
                    initialProgress={enrollment.progress}
                    onProgress={handleProgress}
                />
            ) : (
                <div className="aspect-video flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                    <VideoOff className="w-12 h-12 text-white/40 mb-4" />
                    <p className="text-white font-semibold">
                        El video de este curso aún no está configurado.
                    </p>
                    <p className="text-white/60 text-sm mt-2 max-w-md">
                        Tu acceso está verificado. Cuando el administrador publique el
                        video, aparecerá aquí automáticamente.
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <main className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-muted hover:opacity-100 transition-opacity mb-5"
                >
                    <ArrowLeft size={18} />
                    Mis cursos
                </button>

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        {course.category_name && (
                            <span className="text-link">{course.category_name}</span>
                        )}
                        {course.level_name && (
                            <span className="px-2.5 py-1 rounded-lg bg-[var(--palette-primary)]/10 text-link">
                                {course.level_name}
                            </span>
                        )}
                        {course.duration_hours && (
                            <span className="inline-flex items-center gap-1.5 text-muted">
                                <Clock size={13} />
                                {course.duration_hours} h
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                            <h1 className="text-h1 mb-2">{course.title}</h1>
                            {course.description && (
                                <p className="text-muted max-w-3xl leading-relaxed">
                                    {course.description}
                                </p>
                            )}
                        </div>
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold self-start whitespace-nowrap ${
                                isCompleted
                                    ? 'bg-green-500/10 text-success dark:text-success'
                                    : 'bg-[var(--palette-primary)]/10 text-link'
                            }`}
                        >
                            {isCompleted ? (
                                <CheckCircle2 size={18} />
                            ) : (
                                <PlayCircle size={18} />
                            )}
                            {isCompleted ? 'Curso completado' : 'Curso en progreso'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                    <div className="space-y-6">
                        {activeClass ? (
                            <>
                                {activeClass.content_type !== 'quiz' && (
                                    <div className="rounded-2xl overflow-hidden palette-border border bg-black shadow-xl">
                                        {activeClass.video_url || legacyVideoUrl ? (
                                            <CourseVideoPlayer
                                                key={activeClass.id}
                                                src={
                                                    normalizeUrl(
                                                        activeClass.video_url ||
                                                            course.video_url
                                                    ) || ''
                                                }
                                                poster={
                                                    normalizeUrl(
                                                        activeClass.thumbnail_url ||
                                                            course.image_url
                                                    ) || null
                                                }
                                                title={activeClass.title}
                                                initialProgress={
                                                    activeClass.is_completed ? 100 : 0
                                                }
                                                onProgress={handleClassVideoProgress}
                                            />
                                        ) : (
                                            <div className="aspect-video flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                                                <VideoOff className="w-12 h-12 text-white/40 mb-4" />
                                                <p className="text-white font-semibold">
                                                    El video de esta clase aún no está
                                                    configurado.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeClass.content_type !== 'video' &&
                                    activeClass.has_quiz && (
                                        <ClassQuizPanel
                                            courseId={courseId}
                                            classItem={activeClass}
                                            onCompleted={refreshAfterCompletion}
                                        />
                                    )}

                                {activeClass.content_type === 'quiz' &&
                                    !activeClass.has_quiz && (
                                        <div className="rounded-2xl border palette-border bg-[var(--palette-surface)] p-6 text-sm text-muted">
                                            Esta clase todavía no tiene una evaluación
                                            publicada.
                                        </div>
                                    )}
                            </>
                        ) : (
                            renderLegacyVideo()
                        )}

                        <section className="palette-surface palette-border border rounded-2xl p-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={20} className="text-link" />
                                    <h2 className="text-h4">Contenido del curso</h2>
                                </div>
                                <span className="text-xs text-muted">
                                    {allClasses.filter((item) => item.is_completed).length}/
                                    {allClasses.length || 0} clases
                                </span>
                            </div>

                            {allClasses.length > 0 && content ? (
                                <div className="space-y-3">
                                    {content.modules.map((module) => {
                                        const isOpen = openModules[module.id] !== false;
                                        return (
                                            <div
                                                key={module.id}
                                                className="rounded-xl border palette-border overflow-hidden"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModule(module.id)}
                                                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5"
                                                    aria-expanded={isOpen}
                                                >
                                                    {isOpen ? (
                                                        <ChevronDown
                                                            size={16}
                                                            className="text-link flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <ChevronRight
                                                            size={16}
                                                            className="text-muted flex-shrink-0"
                                                        />
                                                    )}
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-bold text-paragraph truncate">
                                                            {module.title}
                                                        </span>
                                                        <span className="block text-xs text-muted mt-0.5">
                                                            {module.classes.length} clases
                                                        </span>
                                                    </span>
                                                </button>

                                                {isOpen && (
                                                    <div className="border-t palette-border divide-y palette-border">
                                                        {module.classes.map((item) => {
                                                            const isActive =
                                                                item.id ===
                                                                activeClass?.id;
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedClassId(
                                                                            item.id
                                                                        )
                                                                    }
                                                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                                        isActive
                                                                            ? 'bg-[var(--palette-primary)]/8'
                                                                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                            item.content_type ===
                                                                            'video'
                                                                                ? 'bg-[var(--palette-primary)]/10'
                                                                                : 'bg-amber-500/10'
                                                                        }`}
                                                                    >
                                                                        {item.content_type ===
                                                                        'video' ? (
                                                                            <PlayCircle
                                                                                size={16}
                                                                                className="text-link"
                                                                            />
                                                                        ) : (
                                                                            <HelpCircle
                                                                                size={16}
                                                                                className="text-amber-700"
                                                                            />
                                                                        )}
                                                                    </span>
                                                                    <span className="min-w-0 flex-1">
                                                                        <span className="block text-sm font-semibold text-paragraph truncate">
                                                                            {item.title}
                                                                        </span>
                                                                        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                                                                            <span>
                                                                                {item.content_type ===
                                                                                'quiz'
                                                                                    ? 'Quiz'
                                                                                    : item.content_type ===
                                                                                        'mixed'
                                                                                      ? 'Video + quiz'
                                                                                      : 'Video'}
                                                                            </span>
                                                                            {item.duration_minutes && (
                                                                                <span>
                                                                                    ·{' '}
                                                                                    {
                                                                                        item.duration_minutes
                                                                                    }{' '}
                                                                                    min
                                                                                </span>
                                                                            )}
                                                                            {item.has_quiz &&
                                                                                item.quiz && (
                                                                                    <span>
                                                                                        ·{' '}
                                                                                        {
                                                                                            item
                                                                                                .quiz
                                                                                                .question_count
                                                                                        }{' '}
                                                                                        preguntas
                                                                                    </span>
                                                                                )}
                                                                            {item.best_score !==
                                                                                null && (
                                                                                <span>
                                                                                    · Mejor:{' '}
                                                                                    {
                                                                                        item.best_score
                                                                                    }
                                                                                    %
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </span>
                                                                    {item.is_completed ? (
                                                                        <CheckCircle2
                                                                            size={18}
                                                                            className="text-success flex-shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <span className="w-4 h-4 rounded-full border border-[var(--palette-border)] flex-shrink-0" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-4 rounded-xl border palette-border p-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--palette-primary)]/10 flex items-center justify-center flex-shrink-0">
                                            <PlayCircle size={20} className="text-link" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-paragraph truncate">
                                                Video del curso
                                            </p>
                                            <p className="text-xs text-muted mt-0.5">
                                                Reproducción protegida con tu licencia
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                                            legacyVideoUrl
                                                ? 'bg-green-500/10 text-success dark:text-success'
                                                : 'bg-amber-500/10 text-warning dark:text-warning'
                                        }`}
                                    >
                                        {legacyVideoUrl ? 'Disponible' : 'Pendiente'}
                                    </span>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-6">
                        <section className="palette-surface palette-border border rounded-2xl p-5">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={19} className="text-link" />
                                    <h2 className="font-bold text-paragraph">
                                        Tu progreso
                                    </h2>
                                </div>
                                <span className="text-2xl font-black text-paragraph">
                                    {displayProgress}%
                                </span>
                            </div>

                            <div
                                className="h-2.5 rounded-full bg-[var(--palette-border)] overflow-hidden"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={displayProgress}
                                aria-label="Progreso del curso"
                            >
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isCompleted
                                            ? 'bg-green-500'
                                            : 'bg-[var(--palette-primary)]'
                                    }`}
                                    style={{ width: `${displayProgress}%` }}
                                />
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-muted min-h-5">
                                {content ? (
                                    isCompleted ? (
                                        <>
                                            <CheckCircle2 size={13} />
                                            Completaste este curso
                                        </>
                                    ) : (
                                        <>
                                            <Cloud size={13} />
                                            Tu avance se calcula con clases y
                                            evaluaciones completadas
                                        </>
                                    )
                                ) : (
                                    <>
                                        {saveState === 'saving' && (
                                            <>
                                                <Loader2
                                                    size={13}
                                                    className="animate-spin"
                                                />
                                                Guardando progreso...
                                            </>
                                        )}
                                        {saveState === 'saved' && (
                                            <>
                                                <Cloud size={13} />
                                                Progreso guardado
                                            </>
                                        )}
                                        {saveState === 'error' && (
                                            <span className="text-warning dark:text-warning">
                                                No se pudo guardar el avance. Se
                                                reintentará al continuar.
                                            </span>
                                        )}
                                        {saveState === 'idle' && (
                                            <>
                                                {isCompleted ? (
                                                    <>
                                                        <CheckCircle2 size={13} />
                                                        Completaste este curso
                                                    </>
                                                ) : (
                                                    <>
                                                        <Cloud size={13} />
                                                        Tu avance se guarda
                                                        automáticamente
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>

                        <section className="palette-surface palette-border border rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck
                                    size={19}
                                    className="text-success dark:text-success"
                                />
                                <h2 className="font-bold text-paragraph">
                                    Acceso verificado
                                </h2>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted">Licencia</span>
                                    <span className="font-semibold text-paragraph text-right">
                                        {formatLicenseType(data.license_type)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted">Estado</span>
                                    <span className="font-semibold text-success dark:text-success">
                                        Activa
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="palette-surface palette-border border rounded-2xl p-5">
                            <h2 className="font-bold text-paragraph mb-4">Detalles</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted">Categoría</span>
                                    <span className="font-semibold text-paragraph text-right">
                                        {course.category_name || 'General'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted">Nivel</span>
                                    <span className="font-semibold text-paragraph text-right">
                                        {course.level_name || 'Todos los niveles'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted">Duración</span>
                                    <span className="font-semibold text-paragraph text-right">
                                        {course.duration_hours
                                            ? `${course.duration_hours} horas`
                                            : 'No especificada'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className="mt-8 flex items-center gap-2 text-xs text-muted">
                    <ChevronRight size={13} />
                    El enlace del video se entrega solo a clientes con acceso vigente.
                </div>
            </div>
        </main>
    );
}
