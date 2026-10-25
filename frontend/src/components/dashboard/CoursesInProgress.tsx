import React from 'react';
import { Play, Clock, ChevronRight } from 'lucide-react';

interface Course {
    id: number;
    title: string;
    nextLesson: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
    lastAccessed: string;
    thumbnail?: string;
}

interface CoursesInProgressProps {
    courses?: Course[];
    onContinue?: (courseId: number) => void;
}

const defaultCourses: Course[] = [
    {
        id: 1,
        title: 'Seguridad y Salud en el Trabajo',
        nextLesson: 'Prevención de riesgos en planta',
        progress: 45,
        totalLessons: 12,
        completedLessons: 5,
        lastAccessed: 'hace 2 horas',
        thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: 2,
        title: 'Finanzas Prácticas para No Financieros',
        nextLesson: 'Lectura de estados financieros',
        progress: 72,
        totalLessons: 10,
        completedLessons: 7,
        lastAccessed: 'hace 1 día',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: 3,
        title: 'Liderazgo Operativo y Supervisión Efectiva',
        nextLesson: 'Retroalimentación que genera resultados',
        progress: 28,
        totalLessons: 8,
        completedLessons: 2,
        lastAccessed: 'hace 3 días',
        thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=400&q=80',
    },
];

export const CoursesInProgress: React.FC<CoursesInProgressProps> = ({
    courses = defaultCourses,
    onContinue,
}) => {
    if (courses.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold theme-text-base">En progreso</h2>
                <button className="text-sm theme-primary font-medium hover:opacity-80 flex items-center gap-1">
                    Ver todos
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="dashboard-course-card rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        {/* Thumbnail */}
                        <div className="relative h-40 overflow-hidden">
                            {course.thumbnail ? (
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full theme-primary/20 flex items-center justify-center">
                                    <Play className="w-12 h-12 theme-primary opacity-50" style={{ color: 'var(--decorator-color)' }} />
                                </div>
                            )}
                            <div className="absolute top-3 right-3 theme-surface px-2 py-1 rounded text-xs font-medium theme-text-base">
                                {course.progress}%
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="dashboard-course-title font-semibold mb-2 line-clamp-2">
                                {course.title}
                            </h3>

                            <div className="flex items-center gap-2 mb-3 theme-text-secondary">
                                <Clock className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
                                <span className="text-sm">Siguiente: {course.nextLesson}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="dashboard-progress-bar rounded-full h-2 mb-2">
                                <div
                                    className="dashboard-progress-fill h-2 rounded-full transition-all"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs theme-text-secondary mb-4">
                                <span>{course.completedLessons}/{course.totalLessons} lecciones</span>
                                <span>Última sesión: {course.lastAccessed}</span>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={() => onContinue?.(course.id)}
                                className="w-full theme-primary text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
                                Continuar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
