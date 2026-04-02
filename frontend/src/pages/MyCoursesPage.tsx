import { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, Gift, Key, Share2, CheckCircle, Clock } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface License {
    id: string;
    license_code: string;
    status: string;
    license_type: string;
    redeemed_at: string | null;
}

interface UserCourse {
    course_id: string;
    course_title: string;
    course_slug: string;
    course_image_url: string | null;
    licenses: License[];
    total_paid: string;
    total_required: string;
    payment_progress: number;
    is_fully_paid: boolean;
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

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<UserCourse[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get<UserCourse[]>('/catalog/my-courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const getStatusBadge = (course: UserCourse) => {
        if (course.is_fully_paid) {
            const redeemedCount = course.licenses.filter(l => l.status === 'redeemed').length;
            if (redeemedCount > 0) {
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Active
                    </span>
                );
            } else {
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <Key className="w-3 h-3 inline mr-1" />
                        Ready to Redeem
                    </span>
                );
            }
        } else {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Partial ({course.payment_progress.toFixed(0)}%)
                </span>
            );
        }
    };

    const getLicenseStatusBadge = (license: License) => {
        const badges = {
            pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            redeemed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${badges[license.status as keyof typeof badges] || badges.pending}`}>
                {license.status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-p-color">Loading your courses...</div>
            </div>
        );
    }

    return (
        <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-primary mb-6">My Courses</h2>

                {courses.length === 0 ? (
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                        <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-p-color">No courses yet.</p>
                        <p className="text-p-color opacity-75 text-sm mt-2">
                            When you purchase a course, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div
                                key={course.course_id}
                                className="palette-surface palette-border border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Course Image */}
                                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    {course.course_image_url ? (
                                        <img
                                            src={course.course_image_url}
                                            alt={course.course_title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Book className="w-16 h-16 text-primary opacity-50" />
                                    )}
                                </div>

                                {/* Course Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-lg line-clamp-2">
                                            {course.course_title}
                                        </h3>
                                        {getStatusBadge(course)}
                                    </div>

                                    {/* Payment Progress */}
                                    {!course.is_fully_paid && (
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-p-color opacity-75">Payment Progress</span>
                                                <span className="font-medium">
                                                    Bs. {course.total_paid} / Bs. {course.total_required}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[var(--palette-surface)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min(course.payment_progress, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-p-color opacity-50 mt-1">
                                                Complete payment to unlock full access
                                            </p>
                                        </div>
                                    )}

                                    {/* Licenses */}
                                    {course.licenses.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-p-color opacity-75 mb-2">
                                                Licenses
                                            </h4>
                                            <div className="space-y-2">
                                                {course.licenses.map((license) => (
                                                    <div
                                                        key={license.id}
                                                        className="flex items-center justify-between p-2 bg-[var(--palette-surface)] rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Gift className="w-4 h-4 text-p-color opacity-50" />
                                                            <span className="text-xs font-mono text-p-color opacity-75">
                                                                {license.license_code.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getLicenseStatusBadge(license)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t border-[var(--palette-border)]">
                                        <button
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg theme-button theme-button-primary text-sm"
                                            onClick={() => window.location.href = `/courses/${course.course_slug}`}
                                        >
                                            <Book className="w-4 h-4" />
                                            View Course
                                        </button>
                                        {course.is_fully_paid && course.licenses.some(l => l.status === 'active') && (
                                            <>
                                                <button
                                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg theme-button theme-button-secondary text-sm"
                                                    title="Redeem license"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg theme-button theme-button-secondary text-sm"
                                                    title="Gift license"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
