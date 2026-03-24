import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import type { Course, Category, Level, CourseListProps } from './types';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

// Axios instance with auth
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const CourseList: React.FC<CourseListProps> = ({ onNavigateToCreate, onNavigateToEdit }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [levelFilter, setLevelFilter] = useState<string>('');
    const [publishedFilter, setPublishedFilter] = useState<string>('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCourses, setTotalCourses] = useState(0);

    const [messageModal, setMessageModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'danger' | 'primary' | 'success';
        title: string;
        message: string | React.ReactNode;
        confirmText: string;
        onConfirm: (() => void) | null;
    }>({
        isOpen: false,
        type: 'primary',
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: null,
    });

    // Fetch courses, categories, and levels
    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, categoriesRes, levelsRes] = await Promise.all([
                api.get('/api/catalog/courses', {
                    params: {
                        page: currentPage,
                        page_size: pageSize,
                        published: publishedFilter === 'all' ? null : publishedFilter === 'published',
                        search: searchQuery || undefined,
                        category_id: categoryFilter || undefined,
                        level_id: levelFilter || undefined,
                    },
                }),
                api.get('/api/catalog/categories'),
                api.get('/api/catalog/levels'),
            ]);

            setCourses(coursesRes.data.courses || []);
            setTotalCourses(coursesRes.data.total || 0);
            setCategories(categoriesRes.data.categories || []);
            setLevels(levelsRes.data.levels || []);
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to load courses.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage, publishedFilter]);

    // Toggle course publish status
    const handleTogglePublish = async (courseId: string, currentStatus: boolean, courseTitle: string) => {
        const newStatus = !currentStatus;
        setConfirmModal({
            isOpen: true,
            type: newStatus ? 'success' : 'primary',
            title: newStatus ? 'Publish Course' : 'Unpublish Course',
            message: `Are you sure you want to ${newStatus ? 'publish' : 'unpublish'} "${courseTitle}"?`,
            confirmText: newStatus ? 'Publish' : 'Unpublish',
            onConfirm: () => {
                updateCourseStatus(courseId, newStatus);
            },
        });
    };

    const updateCourseStatus = async (courseId: string, published: boolean) => {
        try {
            await api.put(`/api/catalog/courses/${courseId}`, { published });
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: `Course ${published ? 'published' : 'unpublished'} successfully!`,
            });
            fetchData();
        } catch (error: any) {
            console.error('Failed to update course:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to update course.',
            });
        }
    };

    // Delete course
    const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Delete Course',
            message: (
                <>
                    Are you sure you want to delete <strong>"{courseTitle}"</strong>?
                    <br />
                    <span className="text-red-600 dark:text-red-400 mt-2 block">
                        This action cannot be undone. The linked product will remain.
                    </span>
                </>
            ),
            confirmText: 'Delete',
            onConfirm: () => {
                deleteCourseAction(courseId, courseTitle);
            },
        });
    };

    const deleteCourseAction = async (courseId: string, courseTitle: string) => {
        try {
            await api.delete(`/api/catalog/courses/${courseId}`);
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: `Course "${courseTitle}" deleted successfully!`,
            });
            fetchData();
        } catch (error: any) {
            console.error('Failed to delete course:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to delete course.',
            });
        }
    };

    // Filter courses based on search and filters
    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryFilter || course.category_id?.toString() === categoryFilter;
        const matchesLevel = !levelFilter || course.level_id?.toString() === levelFilter;
        return matchesSearch && matchesCategory && matchesLevel;
    });

    // Handle filter changes (reset to page 1)
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (value: string) => {
        setCategoryFilter(value);
        setCurrentPage(1);
    };

    const handleLevelChange = (value: string) => {
        setLevelFilter(value);
        setCurrentPage(1);
    };

    // Get category name by ID
    const getCategoryName = (categoryId?: number) => {
        if (!categoryId) return '-';
        const category = categories.find(c => c.id === categoryId);
        return category?.name || '-';
    };

    // Get level name by ID
    const getLevelName = (levelId?: number) => {
        if (!levelId) return '-';
        const level = levels.find(l => l.id === levelId);
        return level?.name || '-';
    };

    // Format price
    const formatPrice = (price?: string) => {
        if (!price) return '-';
        return `Bs. ${parseFloat(price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-h2-size text-h2-color text-h2-font text-h2-weight mb-2">Course Management</h2>
                        <p className="text-p-font text-p-size text-p-color">
                            Create, edit, and manage your educational courses.
                        </p>
                    </div>
                    <button
                        onClick={onNavigateToCreate}
                        className="theme-button theme-button-primary"
                    >
                        <Plus size={20} />
                        Create Course
                    </button>
                </div>

                {/* Filters */}
                <div className="theme-card flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-semibold mb-2 text-p-color">
                            <Search size={16} className="inline mr-2" />
                            Search
                        </label>
                        <input
                            type="text"
                            className="theme-input w-full"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <div className="w-[180px]">
                        <label className="block text-sm font-semibold mb-2 text-p-color">Category</label>
                        <select
                            className="theme-input w-full"
                            value={categoryFilter}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-[180px]">
                        <label className="block text-sm font-semibold mb-2 text-p-color">Level</label>
                        <select
                            className="theme-input w-full"
                            value={levelFilter}
                            onChange={(e) => handleLevelChange(e.target.value)}
                        >
                            <option value="">All Levels</option>
                            {levels.map(lvl => (
                                <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-[180px]">
                        <label className="block text-sm font-semibold mb-2 text-p-color">Status</label>
                        <select
                            className="theme-input w-full"
                            value={publishedFilter}
                            onChange={(e) => setPublishedFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="published">Published</option>
                            <option value="false">Unpublished</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="theme-card overflow-hidden p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--palette-primary)]"></div>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-12 text-p-color">
                            <p>No courses found.</p>
                            <p className="text-sm mt-2">Create your first course to get started!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--palette-surface)] border-b border-[var(--palette-border)]">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Course</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Category</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Level</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-p-color">Duration</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-p-color">Price</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-p-color">Status</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-p-color">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses.map((course) => (
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
                                                            <div className="w-full h-full flex items-center justify-center text-p-color opacity-40">
                                                                <FileText size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-p-color group-hover:text-[var(--palette-primary)] transition-colors">
                                                            {course.title}
                                                        </p>
                                                        <p className="text-xs text-p-color opacity-60">
                                                            ID: {course.id.slice(0, 8).toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-3 py-1 bg-[var(--palette-surface)] text-p-color rounded-full text-xs font-medium">
                                                    {getCategoryName(course.category_id)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm font-medium text-p-color">
                                                    {getLevelName(course.level_id)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm text-p-color">
                                                    {course.duration_hours ? `${course.duration_hours} hrs` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-bold text-p-color">
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
                                                        onClick={() => handleTogglePublish(course.id, course.published, course.title)}
                                                        className="p-2 hover:bg-[var(--palette-border)] rounded transition-colors"
                                                        title={course.published ? 'Unpublish' : 'Publish'}
                                                    >
                                                        {course.published ? (
                                                            <Eye size={18} className="text-p-color" />
                                                        ) : (
                                                            <EyeOff size={18} className="text-p-color" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => onNavigateToEdit(course.id)}
                                                        className="p-2 hover:bg-[var(--palette-border)] rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} className="text-p-color" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourse(course.id, course.title)}
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
                    )}
                    
                    {/* Pagination Footer */}
                    {!loading && filteredCourses.length > 0 && (
                        <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--palette-border)] font-manrope">
                            <span className="text-sm text-p-color opacity-70">
                                Showing <span className="font-bold text-p-color">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCourses)}</span> of <span className="font-bold text-p-color">{totalCourses}</span> courses
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-[var(--palette-border)] rounded-lg text-p-color hover:bg-[var(--palette-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                {Array.from({ length: Math.min(5, Math.ceil(totalCourses / pageSize)) }, (_, i) => {
                                    const pageNum = currentPage <= 3 
                                        ? i + 1 
                                        : currentPage + i - 2;
                                    if (pageNum > Math.ceil(totalCourses / pageSize)) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-[var(--palette-primary)] text-white'
                                                    : 'text-p-color hover:bg-[var(--palette-surface)]'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCourses / pageSize), p + 1))}
                                    disabled={currentPage >= Math.ceil(totalCourses / pageSize)}
                                    className="p-2 border border-[var(--palette-border)] rounded-lg text-p-color hover:bg-[var(--palette-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <MessageModal
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                message={messageModal.message}
                onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm || (() => {})}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </>
    );
};
