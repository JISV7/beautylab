import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    AlertTriangle,
    ArrowRight,
    Book,
    CheckCircle,
    ChevronRight,
    Clock,
    Compass,
    Key,
    KeyRound,
    Loader2,
    PlayCircle,
    RefreshCw,
    type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    learningApi,
    type CourseAccessState,
    type CourseContent,
    type UserCourse,
} from '../lib/learningApi';
import { fetchInvoices, fetchSummary } from '../lib/invoiceApi';
import {
    invoiceStatusClasses,
    invoiceStatusLabels,
    type Invoice,
    type InvoiceSummary,
} from '../data/invoice.types';
import { formatCurrency } from '../utils/formatCurrency';
import { normalizeUrl } from '../utils/url';
import {
    demoCourses,
    demoInvoices,
    demoInvoiceSummary,
    demoModeAllowed,
    getDemoCourseContent,
    isDemoSession,
    isNetworkError,
} from '../data/demoData';

interface DashboardHomePageProps {
    onNavigate: (tab: string) => void;
}

const courseStatus: Record<CourseAccessState, { label: string; className: string; icon: LucideIcon }> = {
    in_progress: {
        label: 'En curso',
        className: 'bg-blue-100 text-info dark:bg-blue-900/30',
        icon: PlayCircle,
    },
    completed: {
        label: 'Completado',
        className: 'bg-green-100 text-success dark:bg-green-900/30',
        icon: CheckCircle,
    },
    ready_to_redeem: {
        label: 'Listo para canjear',
        className: 'bg-blue-100 text-info dark:bg-blue-900/30',
        icon: Key,
    },
    payment_pending: {
        label: 'Pago pendiente',
        className: 'bg-yellow-100 text-warning dark:bg-yellow-900/30',
        icon: Clock,
    },
    unavailable: {
        label: 'Sin acceso',
        className: 'bg-red-100 text-danger dark:bg-red-900/30',
        icon: AlertTriangle,
    },
};

const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const relativeSteps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
    ['year', Infinity],
];

const formatRelative = (value: string | null): string | null => {
    if (!value) return null;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return null;
    // Naive server timestamps can land slightly in the future; treat them as "now".
    let amount = Math.min((time - Date.now()) / 1000, 0);
    for (const [unit, size] of relativeSteps) {
        if (Math.abs(amount) < size) {
            return unit === 'second'
                ? 'hace un momento'
                : relativeFormat.format(Math.round(amount), unit);
        }
        amount /= size;
    }
    return null;
};

const formatIssueDate = (value: string) =>
    new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        new Date(`${value.slice(0, 10)}T00:00:00`),
    );

const activityTime = (course: UserCourse) =>
    course.last_activity_at ? new Date(course.last_activity_at).getTime() || 0 : 0;

const plural = (count: number, singular: string, pluralForm: string) =>
    `${count} ${count === 1 ? singular : pluralForm}`;

const needsAttention = (course: UserCourse) =>
    course.access_state === 'ready_to_redeem' ||
    course.access_state === 'payment_pending' ||
    course.access_state === 'unavailable';

function StatusBadge({ state }: { state: CourseAccessState }) {
    const status = courseStatus[state] ?? courseStatus.unavailable;
    const Icon = status.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${status.className}`}
        >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {status.label}
        </span>
    );
}

function CourseThumb({ course, className }: { course: UserCourse; className: string }) {
    return (
        <span
            className={`flex items-center justify-center overflow-hidden bg-palette-border/50 flex-shrink-0 ${className}`}
        >
            {course.course_image_url ? (
                <img
                    src={normalizeUrl(course.course_image_url)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            ) : (
                <Book className="w-5 h-5 text-muted" aria-hidden="true" />
            )}
        </span>
    );
}

function ContinuePanel({ course, onOpen }: { course: UserCourse; onOpen: () => void }) {
    const [content, setContent] = useState<CourseContent | null>(null);
    const [barReady, setBarReady] = useState(false);

    useEffect(() => {
        let active = true;
        learningApi
            .getCourseContent(course.course_id)
            .then((data) => active && setContent(data))
            .catch(() => active && setContent(getDemoCourseContent(course.course_id)));
        return () => {
            active = false;
        };
    }, [course.course_id]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setBarReady(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const classes =
        content?.modules.flatMap((module) =>
            module.classes.map((item) => ({ ...item, moduleTitle: module.title })),
        ) ?? [];
    const required = classes.filter((item) => item.is_required);
    const nextClass =
        required.find((item) => !item.is_completed) ?? classes.find((item) => !item.is_completed);
    const progress = Math.min(content?.progress ?? course.progress, 100);
    const lastActivity = formatRelative(course.last_activity_at);

    return (
        <section
            aria-labelledby="continue-course-title"
            className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] rounded-2xl overflow-hidden bg-palette-primary text-on-primary shadow-[0_24px_48px_-32px_rgba(13,43,77,0.7)]"
        >
            <div className="relative aspect-video md:aspect-auto md:min-h-64 bg-black/20">
                {course.course_image_url ? (
                    <img
                        src={normalizeUrl(course.course_image_url)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <Book
                        className="absolute inset-0 m-auto w-12 h-12 opacity-40"
                        aria-hidden="true"
                    />
                )}
            </div>

            <div className="flex flex-col gap-6 p-6 md:p-8">
                <div>
                    <h2 id="continue-course-title" className="text-h3 text-on-primary">
                        {course.course_title}
                    </h2>
                    <p className="mt-3 text-sm text-on-primary/80">
                        {nextClass ? (
                            <>
                                Siguiente clase:{' '}
                                <span className="font-semibold text-on-primary">
                                    {nextClass.title}
                                </span>
                                <span className="block mt-0.5">{nextClass.moduleTitle}</span>
                            </>
                        ) : (
                            course.category_name ?? 'Retoma tu curso donde lo dejaste.'
                        )}
                    </p>
                </div>

                <div>
                    <div className="flex items-baseline justify-between gap-3 mb-2 text-sm">
                        <span className="text-on-primary/80">
                            {required.length > 0
                                ? `${required.filter((item) => item.is_completed).length} de ${required.length} clases completadas`
                                : 'Avance del curso'}
                        </span>
                        <span className="font-bold tabular-nums">{progress}%</span>
                    </div>
                    <div
                        className="h-2 rounded-full bg-on-primary/15 overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-label={`Progreso de ${course.course_title}`}
                    >
                        <div
                            className="h-full rounded-full bg-palette-accent transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                            style={{ width: `${barReady ? progress : 0}%` }}
                        />
                    </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3">
                    <button
                        onClick={onOpen}
                        className="theme-button bg-palette-accent text-on-accent hover:opacity-90 active:scale-[0.98]"
                    >
                        <PlayCircle className="w-4 h-4" aria-hidden="true" />
                        Continuar curso
                    </button>
                    {lastActivity && (
                        <span className="text-sm text-on-primary/75">
                            Última actividad {lastActivity}
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
}

export function DashboardHomePage({ onNavigate }: DashboardHomePageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [courses, setCourses] = useState<UserCourse[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        const [coursesResult, invoicesResult, summaryResult] = await Promise.allSettled([
            learningApi.getMyCourses(),
            fetchInvoices(1, 4),
            fetchSummary(),
        ]);
        const useDemo =
            coursesResult.status === 'rejected' &&
            demoModeAllowed &&
            (isDemoSession() || isNetworkError(coursesResult.reason));
        setIsDemo(useDemo);
        if (coursesResult.status === 'fulfilled') {
            setCourses(coursesResult.value);
        } else if (useDemo) {
            setCourses(demoCourses);
        } else {
            setLoadError('No pudimos cargar tu resumen. Revisa tu conexión e inténtalo de nuevo.');
        }
        const invoiceData = invoicesResult.status === 'fulfilled' ? invoicesResult.value : null;
        const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
        setInvoices(invoiceData?.invoices ?? (useDemo ? demoInvoices : []));
        setInvoiceSummary(summaryData ?? (useDemo ? demoInvoiceSummary : null));
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const openPlayer = (courseId: string) =>
        navigate(`/dashboard?tab=course-player&courseId=${courseId}`);

    const openCourse = (course: UserCourse) => {
        if (course.has_access) openPlayer(course.course_id);
        else if (course.access_state === 'payment_pending') onNavigate('invoices');
        else onNavigate('my-courses');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-paragraph">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando tu resumen...
                </div>
            </div>
        );
    }

    const firstName =
        (user?.full_name || user?.name || '').trim().split(/\s+/)[0] ||
        user?.email?.split('@')[0] ||
        '';
    const recent = [...courses].sort((a, b) => activityTime(b) - activityTime(a));
    const continueCourse = recent.find((course) => course.access_state === 'in_progress');
    const attention = courses.filter(needsAttention);
    const inProgressCount = courses.filter((course) => course.access_state === 'in_progress').length;
    const completedCount = courses.filter((course) => course.access_state === 'completed').length;

    const summaryParts = [
        inProgressCount > 0 && plural(inProgressCount, 'curso en curso', 'cursos en curso'),
        completedCount > 0 && plural(completedCount, 'completado', 'completados'),
        attention.length > 0 && plural(attention.length, 'pendiente por activar', 'pendientes por activar'),
    ].filter((part): part is string => Boolean(part));
    const summaryLine =
        courses.length === 0
            ? 'Aún no tienes cursos. Explora el catálogo o canjea una licencia para empezar.'
            : summaryParts.length > 0
              ? `Tienes ${new Intl.ListFormat('es', { type: 'conjunction' }).format(summaryParts)}.`
              : 'Este es el resumen de tu formación.';

    const stats = [
        { id: 'in-progress', label: 'En curso', value: inProgressCount, tab: 'my-courses' },
        { id: 'completed', label: 'Completados', value: completedCount, tab: 'my-courses' },
        { id: 'pending', label: 'Por activar', value: attention.length, tab: 'my-courses' },
        {
            id: 'invoices',
            label: 'Facturas',
            value: invoiceSummary?.total_invoices ?? invoices.length,
            tab: 'invoices',
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-h1">{firstName ? `Hola, ${firstName}` : 'Inicio'}</h1>
                    <p className="text-paragraph text-muted mt-2 max-w-[65ch]">{summaryLine}</p>
                </div>
                {courses.length > 0 && (
                    <button
                        onClick={() => onNavigate('explore')}
                        className="theme-button theme-button-secondary self-start sm:self-auto"
                    >
                        <Compass className="w-4 h-4" aria-hidden="true" />
                        Explorar cursos
                    </button>
                )}
            </header>

            {isDemo && (
                <p className="flex items-center gap-2 rounded-lg border border-palette-border bg-palette-surface px-4 py-2.5 text-sm text-muted">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    Datos de ejemplo: el servidor no está disponible en este momento.
                </p>
            )}

            {loadError && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-paragraph">{loadError}</p>
                    </div>
                    <button
                        onClick={() => void load()}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-danger whitespace-nowrap"
                    >
                        <RefreshCw size={15} />
                        Reintentar
                    </button>
                </div>
            )}

            {!loadError && courses.length === 0 ? (
                <section className="rounded-2xl border border-palette-border bg-palette-surface p-8 md:p-12">
                    <Compass className="w-10 h-10 text-link mb-5" aria-hidden="true" />
                    <h2 className="text-h4">Tu formación empieza aquí</h2>
                    <p className="text-paragraph text-muted mt-2 max-w-[60ch]">
                        Cuando compres un curso o canjees una licencia de tu empresa, verás aquí
                        tu avance, la próxima clase y tus facturas.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => onNavigate('explore')}
                            className="theme-button theme-button-primary"
                        >
                            Explorar cursos
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                            onClick={() => onNavigate('my-courses')}
                            className="theme-button theme-button-secondary"
                        >
                            <KeyRound className="w-4 h-4" aria-hidden="true" />
                            Canjear licencia
                        </button>
                    </div>
                </section>
            ) : courses.length > 0 ? (
                <>
                    {continueCourse && (
                        <ContinuePanel
                            course={continueCourse}
                            onOpen={() => openPlayer(continueCourse.course_id)}
                        />
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden border border-palette-border bg-palette-border">
                        {stats.map((stat) => (
                            <button
                                key={stat.id}
                                onClick={() => onNavigate(stat.tab)}
                                className="bg-palette-surface p-4 sm:p-5 text-left transition-colors hover:bg-palette-background focus-visible:-outline-offset-2"
                            >
                                <span className="block text-3xl font-bold leading-none tabular-nums">
                                    {stat.value}
                                </span>
                                <span className="block mt-2 text-sm text-muted">{stat.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <section
                            aria-labelledby="recent-courses-title"
                            className="lg:col-span-2 rounded-xl border border-palette-border bg-palette-surface overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-palette-border">
                                <h2 id="recent-courses-title" className="text-h6">
                                    Cursos recientes
                                </h2>
                                <button
                                    onClick={() => onNavigate('my-courses')}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline underline-offset-4"
                                >
                                    Ver todos ({courses.length})
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                            <ul className="divide-y divide-palette-border">
                                {recent.slice(0, 5).map((course) => {
                                    const lastActivity = formatRelative(course.last_activity_at);
                                    return (
                                        <li key={course.course_id}>
                                            <button
                                                onClick={() => openCourse(course)}
                                                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-palette-background focus-visible:-outline-offset-2"
                                            >
                                                <CourseThumb
                                                    course={course}
                                                    className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg"
                                                />
                                                <span className="flex-1 min-w-0">
                                                    <span className="block font-semibold truncate">
                                                        {course.course_title}
                                                    </span>
                                                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                                                        <StatusBadge state={course.access_state} />
                                                        {course.category_name && (
                                                            <span>{course.category_name}</span>
                                                        )}
                                                        {lastActivity && <span>{lastActivity}</span>}
                                                    </span>
                                                </span>
                                                {course.has_access && (
                                                    <span className="hidden sm:flex w-28 flex-shrink-0 flex-col items-end gap-1.5">
                                                        <span className="text-sm font-bold tabular-nums">
                                                            {Math.min(course.progress, 100)}%
                                                        </span>
                                                        <span className="w-full h-1.5 rounded-full bg-palette-border overflow-hidden">
                                                            <span
                                                                className="block h-full rounded-full bg-palette-secondary"
                                                                style={{
                                                                    width: `${Math.min(course.progress, 100)}%`,
                                                                }}
                                                            />
                                                        </span>
                                                    </span>
                                                )}
                                                <ChevronRight
                                                    className="w-4 h-4 text-muted flex-shrink-0"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        <div className="space-y-6">
                            {attention.length > 0 && (
                                <section
                                    aria-labelledby="attention-title"
                                    className="rounded-xl border border-palette-border bg-palette-surface overflow-hidden"
                                >
                                    <h2
                                        id="attention-title"
                                        className="text-h6 px-5 py-4 border-b border-palette-border"
                                    >
                                        Requiere tu atención
                                    </h2>
                                    <ul className="divide-y divide-palette-border">
                                        {attention.slice(0, 4).map((course) => (
                                            <li key={course.course_id}>
                                                <button
                                                    onClick={() => openCourse(course)}
                                                    className="w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-palette-background focus-visible:-outline-offset-2"
                                                >
                                                    <span className="flex-1 min-w-0">
                                                        <span className="block text-sm font-semibold line-clamp-2">
                                                            {course.course_title}
                                                        </span>
                                                        <span className="block mt-1 text-xs text-muted">
                                                            {course.access_state === 'ready_to_redeem'
                                                                ? 'Tu licencia está lista. Canjéala para empezar.'
                                                                : course.access_state === 'payment_pending'
                                                                  ? `Pagado ${formatCurrency(course.total_paid)} de ${formatCurrency(course.total_required)}`
                                                                  : 'Tu licencia no está vigente. Contacta a tu administrador.'}
                                                        </span>
                                                    </span>
                                                    <StatusBadge state={course.access_state} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <section
                                aria-labelledby="recent-invoices-title"
                                className="rounded-xl border border-palette-border bg-palette-surface overflow-hidden"
                            >
                                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-palette-border">
                                    <h2 id="recent-invoices-title" className="text-h6">
                                        Últimas facturas
                                    </h2>
                                    {invoices.length > 0 && (
                                        <button
                                            onClick={() => onNavigate('invoices')}
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline underline-offset-4"
                                        >
                                            Ver todas
                                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                                {invoices.length === 0 ? (
                                    <p className="px-5 py-8 text-sm text-muted">
                                        Aún no tienes facturas. Aparecerán aquí después de tu primera
                                        compra.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-palette-border">
                                        {invoices.map((invoice) => (
                                            <li key={invoice.id}>
                                                <button
                                                    onClick={() => onNavigate('invoices')}
                                                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-palette-background focus-visible:-outline-offset-2"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-semibold truncate">
                                                            N° {invoice.invoice_number}
                                                        </span>
                                                        <span className="block mt-0.5 text-xs text-muted">
                                                            {formatIssueDate(invoice.issue_date)}
                                                        </span>
                                                    </span>
                                                    <span className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <span className="text-sm font-semibold tabular-nums">
                                                            {formatCurrency(invoice.total)}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${invoiceStatusClasses[invoice.status] || invoiceStatusClasses.issued}`}
                                                        >
                                                            {invoiceStatusLabels[invoice.status] || invoice.status}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
