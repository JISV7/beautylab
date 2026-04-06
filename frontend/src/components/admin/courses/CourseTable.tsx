import React from 'react';
import { Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import type { Course, Category, Level } from '../types';

export interface CourseTableProps {
    courses: Course[];
    categories: Category[];
    levels: Level[];
    onEdit: (courseId: string) => void;
    onDelete: (courseId: string, courseTitle: string) => void;
    onTogglePublish: (courseId: string, published: boolean, courseTitle: string) => void;
}

export const CourseTable: React.FC<CourseTableProps> = ({
    courses,
    categories,
    levels,
    onEdit,
    onDelete,
    onTogglePublish,
}) => {
    const getCategoryName = (categoryId?: number) => {
        if (!categoryId) return '-';
        const category = categories.find(c => c.id === categoryId);
        return category?.name || '-';
    };

    const getLevelName = (levelId?: number) => {
        if (!levelId) return '-';
        const level = levels.find(l => l.id === levelId);
        return level?.name || '-';
    };

    const formatPrice = (price?: string) => {
        if (!price) return '-';
        return `Bs. ${parseFloat(price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-[var(--palette-surface)] border-b border-[var(--palette-border)]">
                    <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Course</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Level</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-paragraph">Duration</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-paragraph">Price</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-paragraph">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-paragraph">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map((course) => (
                        <tr
                            key={course.id}
                            className="border-b border-[var(--palette-border)] hover:bg-[var(--palette-surface)] transition-colors group"
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-[var(--palette-surface)] overflow-hidden flex-shrink-0">
                                        {course.image_url ? (
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-paragraph opacity-40">
                                                <FileText size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-paragraph group-hover:text-[var(--palette-primary)] transition-colors">
                                            {course.title}
                                        </p>
                                        <p className="text-xs text-paragraph opacity-60">
                                            ID: {course.id.slice(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className="px-3 py-1 bg-[var(--palette-surface)] text-paragraph rounded-full text-xs font-medium">
                                    {getCategoryName(course.category_id)}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm font-medium text-paragraph">
                                    {getLevelName(course.level_id)}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                                <span className="text-sm text-paragraph">
                                    {course.duration_hours ? `${course.duration_hours} hrs` : '-'}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                                <span className="text-sm font-bold text-paragraph">
                                    {formatPrice(course.product_price)}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${
                                        course.published ? 'bg-green-500' : 'bg-amber-500'
                                    }`}></span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        course.published ? 'text-green-600 dark:text-green-400' : 'text-amber-500'
                                    }`}>
                                        {course.published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onTogglePublish(course.id, course.published, course.title)}
                                        className="p-2 hover:bg-[var(--palette-border)] rounded transition-colors"
                                        title={course.published ? 'Unpublish' : 'Publish'}
                                    >
                                        {course.published ? (
                                            <Eye size={18} className="text-paragraph" />
                                        ) : (
                                            <EyeOff size={18} className="text-paragraph" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onEdit(course.id)}
                                        className="p-2 hover:bg-[var(--palette-border)] rounded transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={18} className="text-paragraph" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(course.id, course.title)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
