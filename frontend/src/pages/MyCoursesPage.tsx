import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import {
    AlertTriangle,
    Book,
    CheckCircle,
    ChevronDown,
    Clock,
    Gift,
    Key,
    KeyRound,
    Loader2,
    PlayCircle,
    RefreshCw,
    X,
} from 'lucide-react';
import { MyCoursesFilters, type Category } from '../components/user/MyCoursesFilters';
import { normalizeUrl } from '../utils/url';

const API_URL = 'http://localhost:8000';

interface License {
    id: string;
    license_code: string;
    status: string;
    license_type: string;
    redeemed_at: string | null;
    redeemed_by_user_id: string | null;
    can_redeem: boolean;
}

interface UserCourse {
    course_id: string;
    course_title: string;
    course_slug: string;
    course_image_url: string | null;
    category_id: number | null;
    category_name: string | null;
    licenses: License[];
    total_paid: string;
    total_required: string;
    payment_progress: number;
    is_fully_paid: boolean;
    enrollment_id: number | null;
    enrollment_status: string | null;
    progress: number;
    completed_at: string | null;
    has_access: boolean;
    can_redeem: boolean;
    access_state: 'payment_pending' | 'ready_to_redeem' | 'in_progress' | 'completed' | 'unavailable';
}

const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const formatMoney = (value: string): string => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return value;
    return amount.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default function MyCoursesPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<UserCourse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [redeemingCourseId, setRedeemingCourseId] = useState<string | null>(null);
    const [expandedLicenses, setExpandedLicenses] = useState<string[]>([]);

    // Redeem license modal
    const [redeemModalOpen, setRedeemModalOpen] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemError, setRedeemError] = useState<string | null>(null);
    const [redeemLoading, setRedeemLoading] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [includeChildren, setIncludeChildren] = useState(false);

    const toggleLicenses = (courseId: string) => {
        setExpandedLicenses((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId]
        );
    };

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const response = await api.get<UserCourse[]>('/catalog/my-courses');
            setCourses(response.data);
        } catch (error) {
            console.error('No se pudieron cargar los cursos:', error);
            setLoadError('No pudimos cargar tus cursos. Recarga la página e inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/catalog/categories');
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('No se pudieron cargar las categorías:', error);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
        fetchCategories();
    }, [fetchCourses, fetchCategories]);

    const openPlayer = (courseId: string) => {
        navigate(`/dashboard?tab=course-player&courseId=${courseId}`);
    };

    const openCourseDetails = (courseId: string) => {
        navigate(`/dashboard?tab=course-details&courseId=${courseId}`);
    };

    const handleRedeemAndStart = async (course: UserCourse) => {
        const candidate = course.licenses.find((license) => license.can_redeem);

        if (!candidate) {
            setActionError(
                'No encontramos una licencia disponible para este curso. Revisa tus licencias o contacta a tu administrador.'
            );
            return;
        }

        setActionError(null);
        setRedeemingCourseId(course.course_id);
        try {
            await api.post('/licenses/redeem', {
                license_code: candidate.license_code,
            });
            openPlayer(course.course_id);
        } catch (err: unknown) {
            const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
            setActionError(
                typeof detail === 'string'
                    ? detail
                    : 'No pudimos canjear la licencia. Inténtalo de nuevo.'
            );
            void fetchCourses();
        } finally {
            setRedeemingCourseId(null);
        }
    };

    const handleRedeemLicense = async () => {
        if (!redeemCode.trim()) {
            setRedeemError('Ingresa un código de licencia.');
            return;
        }
        try {
            setRedeemLoading(true);
            setRedeemError(null);
            await api.post('/licenses/redeem', { license_code: redeemCode.trim() });
            setRedeemModalOpen(false);
            setRedeemCode('');
            await fetchCourses();
        } catch (err: unknown) {
            const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
            setRedeemError(
                typeof detail === 'string'
                    ? detail
                    : 'No pudimos canjear la licencia. Verifica el código e inténtalo de nuevo.'
            );
        } finally {
            setRedeemLoading(false);
        }
    };

    const getStatusBadge = (course: UserCourse) => {
        if (course.access_state === 'completed') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Completado
                </span>
            );
        }

        if (course.access_state === 'in_progress') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <PlayCircle className="w-3 h-3 inline mr-1" />
                    En progreso
                </span>
            );
        }

        if (course.access_state === 'ready_to_redeem') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <Key className="w-3 h-3 inline mr-1" />
                    Listo para canjear
                </span>
            );
        }

        if (course.access_state === 'unavailable') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Sin acceso
                </span>
            );
        }

        return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Clock className="w-3 h-3 inline mr-1" />
                {course.is_fully_paid
                    ? 'Pago en revisión'
                    : `Pago parcial (${course.payment_progress.toFixed(0)}%)`}
            </span>
        );
    };

    const getPrimaryAction = (course: UserCourse) => {
        if (course.has_access) {
            const isCompleted =
                course.access_state === 'completed' || course.progress >= 100;
            const label = isCompleted
                ? 'Repasar curso'
                : course.progress > 0
                  ? 'Continuar curso'
                  : 'Comenzar curso';

            return (
                <button
                    onClick={() => openPlayer(course.course_id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg theme-button theme-button-primary text-sm font-bold"
                >
                    <PlayCircle className="w-4 h-4" />
                    {label}
                </button>
            );
        }

        if (course.can_redeem) {
            const isRedeeming = redeemingCourseId === course.course_id;
            return (
                <button
                    onClick={() => handleRedeemAndStart(course)}
                    disabled={isRedeeming}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg theme-button theme-button-primary text-sm font-bold disabled:opacity-60 disabled:cursor-wait"
                >
                    {isRedeeming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <KeyRound className="w-4 h-4" />
                    )}
                    {isRedeeming ? 'Canjeando...' : 'Canjear y comenzar'}
                </button>
            );
        }

        return (
            <button
                onClick={() => openCourseDetails(course.course_id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg theme-button theme-button-secondary text-sm font-bold"
            >
                <Book className="w-4 h-4" />
                Ver curso
            </button>
        );
    };

    // Filter courses based on search and filters
    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.course_title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesCategory = (() => {
            if (!categoryFilter) return true;
            if (includeChildren) {
                const getChildIds = (parentId: number): number[] => {
                    return categories
                        .filter((category) => category.parent_id === parentId)
                        .flatMap((category) => [
                            category.id,
                            ...getChildIds(category.id),
                        ]);
                };
                const allowedIds = [
                    parseInt(categoryFilter),
                    ...getChildIds(parseInt(categoryFilter)),
                ];
                return allowedIds.includes(course.category_id || 0);
            }
            return course.category_id?.toString() === categoryFilter;
        })();

        const matchesStatus =
            statusFilter === 'all' || statusFilter === course.access_state;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-paragraph">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando tus cursos...
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-h1 font-bold mb-1">Mis cursos</h1>
                        <p className="text-paragraph">
                            Consulta tus cursos, licencias y avance de aprendizaje.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setRedeemModalOpen(true);
                            setRedeemError(null);
                            setRedeemCode('');
                        }}
                        className="theme-button theme-button-primary inline-flex items-center justify-center gap-2"
                    >
                        <KeyRound className="w-4 h-4" />
                        Canjear licencia
                    </button>
                </div>

                {loadError && (
                    <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-paragraph">{loadError}</p>
                        </div>
                        <button
                            onClick={() => void fetchCourses()}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-400 whitespace-nowrap"
                        >
                            <RefreshCw size={15} />
                            Reintentar
                        </button>
                    </div>
                )}

                {actionError && (
                    <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-paragraph">{actionError}</p>
                        </div>
                        <button
                            onClick={() => setActionError(null)}
                            aria-label="Cerrar aviso"
                            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Filters */}
                <MyCoursesFilters
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    categoryFilter={categoryFilter}
                    includeChildren={includeChildren}
                    categories={categories}
                    onSearchChange={setSearchQuery}
                    onStatusFilterChange={setStatusFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    onIncludeChildrenChange={setIncludeChildren}
                />

                {/* Results Count */}
                <div className="mb-6 mt-4 flex items-center justify-between">
                    <p className="text-paragraph opacity-60">
                        Mostrando{' '}
                        <span className="font-bold text-paragraph">
                            {filteredCourses.length}
                        </span>{' '}
                        {filteredCourses.length === 1 ? 'curso' : 'cursos'}
                    </p>
                </div>

                {courses.length === 0 ? (
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                        <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-paragraph font-semibold">Aún no tienes cursos.</p>
                        <p className="text-paragraph opacity-75 text-sm mt-2">
                            Cuando compres un curso, aparecerá aquí. También puedes canjear
                            una licencia si ya tienes tu código.
                        </p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                        <Book className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-paragraph font-semibold">
                            No hay cursos que coincidan con los filtros.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setCategoryFilter('');
                                setIncludeChildren(false);
                            }}
                            className="mt-4 text-sm font-bold text-[var(--palette-primary)] hover:opacity-75"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => {
                            const isCompleted =
                                course.access_state === 'completed' ||
                                course.progress >= 100;

                            return (
                                <div
                                    key={course.course_id}
                                    className="palette-surface palette-border border rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                                >
                                    {/* Course Image */}
                                    <div className="h-44 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                                        {course.course_image_url ? (
                                            <img
                                                src={normalizeUrl(course.course_image_url)}
                                                alt={course.course_title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Book className="w-16 h-16 text-primary opacity-50" />
                                        )}
                                    </div>

                                    {/* Course Info */}
                                    <div className="p-4 flex flex-col flex-1">
                                        {course.category_name && (
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--palette-primary)] mb-1.5">
                                                {course.category_name}
                                            </p>
                                        )}

                                        <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem] mb-3">
                                            {course.course_title}
                                        </h3>

                                        <div className="mb-3">{getStatusBadge(course)}</div>

                                        {/* Learning progress */}
                                        {course.has_access && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between text-sm mb-1.5">
                                                    <span className="text-paragraph opacity-75">
                                                        Avance del curso
                                                    </span>
                                                    <span className="font-bold">
                                                        {course.progress}%
                                                    </span>
                                                </div>
                                                <div
                                                    className="h-2 bg-[var(--palette-surface)] rounded-full overflow-hidden"
                                                    role="progressbar"
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-valuenow={course.progress}
                                                    aria-label={`Progreso de ${course.course_title}`}
                                                >
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            isCompleted
                                                                ? 'bg-green-500'
                                                                : 'bg-[var(--palette-primary)]'
                                                        }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                course.progress,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                                {isCompleted && (
                                                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                                                        <CheckCircle size={13} />
                                                        Curso completado
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Payment Progress */}
                                        {!course.is_fully_paid && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                                                    <span className="text-paragraph opacity-75">
                                                        Progreso de pago
                                                    </span>
                                                    <span className="font-medium text-right">
                                                        Bs. {formatMoney(course.total_paid)} / Bs.{' '}
                                                        {formatMoney(course.total_required)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-[var(--palette-surface)] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full"
                                                        style={{
                                                            width: `${Math.min(
                                                                course.payment_progress,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Licenses Toggle */}
                                        {course.licenses.length > 0 && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={() =>
                                                        toggleLicenses(course.course_id)
                                                    }
                                                    className="w-full flex items-center justify-between p-3 bg-[var(--palette-surface)] rounded-lg hover:opacity-80 transition-opacity"
                                                    aria-expanded={expandedLicenses.includes(
                                                        course.course_id
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Gift className="w-4 h-4 text-paragraph opacity-50" />
                                                        <span className="text-sm font-semibold text-paragraph opacity-75">
                                                            Licencias ({course.licenses.length})
                                                        </span>
                                                    </div>
                                                    <ChevronDown
                                                        className={`w-4 h-4 transition-transform ${
                                                            expandedLicenses.includes(
                                                                course.course_id
                                                            )
                                                                ? 'rotate-180'
                                                                : ''
                                                        }`}
                                                    />
                                                </button>

                                                {expandedLicenses.includes(
                                                    course.course_id
                                                ) && (
                                                    <div className="mt-2 space-y-2">
                                                        {(() => {
                                                            const counts = {
                                                                pending: course.licenses.filter(
                                                                    (license) =>
                                                                        license.status ===
                                                                        'pending'
                                                                ).length,
                                                                active: course.licenses.filter(
                                                                    (license) =>
                                                                        license.status ===
                                                                        'active'
                                                                ).length,
                                                                redeemed: course.licenses.filter(
                                                                    (license) =>
                                                                        license.status ===
                                                                        'redeemed'
                                                                ).length,
                                                                expired: course.licenses.filter(
                                                                    (license) =>
                                                                        license.status ===
                                                                        'expired'
                                                                ).length,
                                                                cancelled:
                                                                    course.licenses.filter(
                                                                        (license) =>
                                                                            license.status ===
                                                                            'cancelled'
                                                                    ).length,
                                                            };
                                                            const statusLabels: Record<
                                                                string,
                                                                string
                                                            > = {
                                                                pending: 'Pendiente',
                                                                active: 'Activa',
                                                                redeemed: 'Canjeada',
                                                                expired: 'Vencida',
                                                                cancelled: 'Cancelada',
                                                            };
                                                            return Object.entries(counts)
                                                                .filter(
                                                                    ([, count]) => count > 0
                                                                )
                                                                .map(([status, count]) => (
                                                                    <div
                                                                        key={status}
                                                                        className="flex items-center justify-between p-2 bg-[var(--palette-surface)] rounded-lg"
                                                                    >
                                                                        <span className="text-sm text-paragraph opacity-75">
                                                                            {
                                                                                statusLabels[
                                                                                    status
                                                                                ]
                                                                            }
                                                                        </span>
                                                                        <span className="font-bold text-paragraph">
                                                                            {count}
                                                                        </span>
                                                                    </div>
                                                                ));
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {course.access_state === 'unavailable' && (
                                            <p className="mb-4 text-xs text-paragraph opacity-70">
                                                Tus licencias para este curso no están
                                                vigentes. Revisa el detalle o contacta a tu
                                                administrador.
                                            </p>
                                        )}

                                        {/* Spacer */}
                                        <div className="flex-1" />

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4 border-t border-[var(--palette-border)]">
                                            {getPrimaryAction(course)}
                                            {course.has_access && (
                                                <button
                                                    onClick={() =>
                                                        openCourseDetails(course.course_id)
                                                    }
                                                    className="px-3 py-2.5 rounded-lg theme-button theme-button-secondary text-sm"
                                                    title="Ver detalles del curso"
                                                    aria-label="Ver detalles del curso"
                                                >
                                                    <Book className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Redeem License Modal */}
            {redeemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => {
                            setRedeemModalOpen(false);
                            setRedeemCode('');
                            setRedeemError(null);
                        }}
                    />
                    <div
                        className="relative z-10 w-full max-w-md palette-surface palette-border border rounded-xl shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--palette-border)]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <KeyRound
                                        size={20}
                                        className="text-green-600 dark:text-green-400"
                                    />
                                </div>
                                <h3 className="text-h4">Canjear licencia</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setRedeemModalOpen(false);
                                    setRedeemCode('');
                                    setRedeemError(null);
                                }}
                                aria-label="Cerrar"
                                className="p-2 hover:bg-[var(--palette-border)] rounded-lg transition-colors"
                            >
                                <X size={18} className="text-paragraph" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertTriangle
                                    size={18}
                                    className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                                />
                                <p className="text-paragraph text-sm">
                                    Ingresa el código de licencia para canjearla. La licencia
                                    quedará vinculada a tu cuenta y esta acción no se puede
                                    deshacer.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-paragraph uppercase tracking-wider mb-2">
                                    Código de licencia
                                </label>
                                <input
                                    type="text"
                                    value={redeemCode}
                                    onChange={(event) => {
                                        setRedeemCode(event.target.value);
                                        setRedeemError(null);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') handleRedeemLicense();
                                    }}
                                    placeholder="Pega aquí tu código de licencia..."
                                    className="theme-input w-full font-mono text-sm"
                                    autoFocus
                                    disabled={redeemLoading}
                                />
                            </div>

                            {redeemError && (
                                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                                    {redeemError}
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 p-6 border-t border-[var(--palette-border)]">
                            <button
                                onClick={() => {
                                    setRedeemModalOpen(false);
                                    setRedeemCode('');
                                    setRedeemError(null);
                                }}
                                className="flex-1 theme-button theme-button-secondary"
                                disabled={redeemLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRedeemLicense}
                                disabled={redeemLoading || !redeemCode.trim()}
                                className="flex-1 theme-button theme-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {redeemLoading ? 'Canjeando...' : 'Canjear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
