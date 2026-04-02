import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Course, Category, Level, CourseListProps } from './types';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';
import { CourseFilters } from './courses/CourseFilters';
import { CourseTable } from './courses/CourseTable';
import { CoursePagination } from './courses/CoursePagination';

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
    const [includeChildren, setIncludeChildren] = useState(false);

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
                api.get('/catalog/courses', {
                    params: {
                        page: currentPage,
                        page_size: pageSize,
                        published: publishedFilter === 'all' ? null : publishedFilter === 'published',
                        search: searchQuery || undefined,
                        category_id: categoryFilter || undefined,
                        level_id: levelFilter || undefined,
                        include_children: categoryFilter && includeChildren ? true : undefined,
                    },
                }),
                api.get('/catalog/categories'),
                api.get('/catalog/levels'),
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
    }, [currentPage, publishedFilter, includeChildren, categoryFilter, levelFilter, searchQuery]);

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
            await api.put(`/catalog/courses/${courseId}`, { published });
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
            await api.delete(`/catalog/courses/${courseId}`);
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
        
        // Category filter with includeChildren support
        const matchesCategory = (() => {
            if (!categoryFilter) return true;
            if (includeChildren) {
                // Get all child category IDs recursively
                const getChildIds = (parentId: number): number[] => {
                    return categories
                        .filter(c => c.parent_id === parentId)
                        .flatMap(c => [c.id, ...getChildIds(c.id)]);
                };
                const allowedIds = [parseInt(categoryFilter), ...getChildIds(parseInt(categoryFilter))];
                return allowedIds.includes(course.category_id || 0);
            }
            return course.category_id?.toString() === categoryFilter;
        })();
        
        const matchesLevel = !levelFilter || course.level_id?.toString() === levelFilter;
        return matchesSearch && matchesCategory && matchesLevel;
    });

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
                        + Create Course
                    </button>
                </div>

                {/* Filters */}
                <CourseFilters
                    searchQuery={searchQuery}
                    categoryFilter={categoryFilter}
                    levelFilter={levelFilter}
                    publishedFilter={publishedFilter}
                    includeChildren={includeChildren}
                    categories={categories}
                    levels={levels}
                    onSearchChange={handleSearchChange}
                    onCategoryChange={handleCategoryChange}
                    onLevelChange={handleLevelChange}
                    onPublishedFilterChange={setPublishedFilter}
                    onIncludeChildrenChange={setIncludeChildren}
                />

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
                        <>
                            <CourseTable
                                courses={filteredCourses}
                                categories={categories}
                                levels={levels}
                                onEdit={onNavigateToEdit}
                                onDelete={handleDeleteCourse}
                                onTogglePublish={handleTogglePublish}
                            />
                            <CoursePagination
                                currentPage={currentPage}
                                totalItems={totalCourses}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                            />
                        </>
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
                onConfirm={confirmModal.onConfirm || (() => { })}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </>
    );
};
