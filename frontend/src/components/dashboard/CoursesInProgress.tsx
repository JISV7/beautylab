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
        title: 'Complete Web Development Bootcamp',
        nextLesson: 'React Hooks Deep Dive',
        progress: 45,
        totalLessons: 48,
        completedLessons: 22,
        lastAccessed: '2 hours ago',
        thumbnail: 'https://images.unsplash.com/photo-1540397106260-e24a507a08ea?w=400',
    },
    {
        id: 2,
        title: 'Python Programming Masterclass',
        nextLesson: 'Data Structures & Algorithms',
        progress: 72,
        totalLessons: 36,
        completedLessons: 26,
        lastAccessed: '1 day ago',
        thumbnail: 'https://images.unsplash.com/photo-1660616246653-e2c57d1077b9?w=400',
    },
    {
        id: 3,
        title: 'Agentic AI & LLM Applications',
        nextLesson: 'Building AI Agents with LangChain',
        progress: 28,
        totalLessons: 24,
        completedLessons: 7,
        lastAccessed: '3 days ago',
        thumbnail: 'https://images.unsplash.com/photo-1760629863094-5b1e8d1aae74?w=400',
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
                <h2 className="text-2xl font-bold theme-text-base">In Progress</h2>
                <button className="text-sm theme-primary font-medium hover:opacity-80 flex items-center gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
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
                                    <Play className="w-12 h-12 theme-primary opacity-50" />
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
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Next: {course.nextLesson}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="dashboard-progress-bar rounded-full h-2 mb-2">
                                <div
                                    className="dashboard-progress-fill h-2 rounded-full transition-all"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs theme-text-secondary mb-4">
                                <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                                <span>Last: {course.lastAccessed}</span>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={() => onContinue?.(course.id)}
                                className="w-full theme-primary text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Continue
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
