import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { ExploreFilters, ExploreGrid, type Course, type Category, type Level } from '../components/explore';

const API_URL = 'http://localhost:8000';

export const ExplorePage: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [includeChildren, setIncludeChildren] = useState(false);

    // Fetch courses from API
    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params: Record<string, string | number | boolean> = {};
            if (selectedCategory) params.category_id = selectedCategory;
            if (selectedLevel) params.level_id = selectedLevel;
            if (searchQuery) params.search = searchQuery;
            if (selectedCategory && includeChildren) params.include_children = true;

            const response = await axios.get(`${API_URL}/catalog/courses/public`, { params });

            setCourses(response.data.courses);
            setCategories(response.data.categories);
            setLevels(response.data.levels);
        } catch (err: any) {
            console.error('Failed to fetch courses:', err);
            setError(err.response?.data?.detail || 'Failed to load courses');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchCourses();
    }, []);

    // Refetch when filters change
    useEffect(() => {
        fetchCourses();
    }, [selectedCategory, selectedLevel, searchQuery, includeChildren]);

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setSelectedLevel(null);
        setSearchQuery('');
    };

    return (
        <div className="p-6">
            {/* Page Title */}
            <div className="mb-8">
                <h2 className="text-h2-size text-h2-color text-h2-font text-h2-weight mb-2">
                    Explore Courses
                </h2>
                <p className="text-p-font text-p-size text-p-color">
                    Discover amazing courses to boost your skills
                </p>
            </div>

            {/* Stats Bar */}
            <div className="palette-surface palette-border border rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-3xl font-black text-p-color">{courses.length}</p>
                        <p className="text-sm text-p-color opacity-60">Courses</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-p-color">{categories.length}</p>
                        <p className="text-sm text-p-color opacity-60">Categories</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-p-color">{levels.length}</p>
                        <p className="text-sm text-p-color opacity-60">Levels</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-p-color">∞</p>
                        <p className="text-sm text-p-color opacity-60">Knowledge</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto">
                {/* Filters */}
                <ExploreFilters
                    categories={categories}
                    levels={levels}
                    selectedCategory={selectedCategory}
                    selectedLevel={selectedLevel}
                    searchQuery={searchQuery}
                    includeChildren={includeChildren}
                    onCategoryChange={setSelectedCategory}
                    onLevelChange={setSelectedLevel}
                    onSearchChange={setSearchQuery}
                    onIncludeChildrenChange={setIncludeChildren}
                    onClearFilters={handleClearFilters}
                />

                {/* Results Count */}
                {!isLoading && !error && (
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-p-color opacity-60">
                            Showing <span className="font-bold text-p-color">{courses.length}</span> courses
                            {selectedCategory || selectedLevel || searchQuery ? (
                                <span> matching your filters</span>
                            ) : (
                                <span> available</span>
                            )}
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 font-bold mb-2">
                            Oops! Something went wrong
                        </p>
                        <p className="text-red-600/80 dark:text-red-400/80 text-sm">{error}</p>
                        <button
                            onClick={fetchCourses}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Course Grid */}
                <ExploreGrid courses={courses} isLoading={isLoading} onViewDetails={(id) => navigate(`/dashboard?tab=course-details&courseId=${id}`)} />
            </main>
        </div>
    );
};
