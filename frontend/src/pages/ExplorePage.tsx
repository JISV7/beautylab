import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExploreFilters, ExploreGrid, type Course, type Category, type Level } from '../components/explore';
import { Compass, GraduationCap } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface ExplorePageProps {
}

export const ExplorePage: React.FC<ExplorePageProps> = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch courses from API
    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params: Record<string, string | number> = {};
            if (selectedCategory) params.category_id = selectedCategory;
            if (selectedLevel) params.level_id = selectedLevel;
            if (searchQuery) params.search = searchQuery;

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
    }, [selectedCategory, selectedLevel, searchQuery]);

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setSelectedLevel(null);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-[var(--palette-background)]">
            {/* Hero Section */}
            <header className="bg-gradient-to-br from-[var(--palette-primary)] to-[var(--palette-accent)] text-white py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Compass size={40} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black mb-2">
                                Explore Our Academy
                            </h1>
                            <p className="text-white/80 text-lg flex items-center gap-2">
                                <GraduationCap size={20} />
                                Discover amazing courses to boost your skills
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
                        <div className="text-center">
                            <p className="text-3xl font-black">{courses.length}</p>
                            <p className="text-sm opacity-80">Courses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black">{categories.length}</p>
                            <p className="text-sm opacity-80">Categories</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black">{levels.length}</p>
                            <p className="text-sm opacity-80">Levels</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black">∞</p>
                            <p className="text-sm opacity-80">Knowledge</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Filters */}
                <ExploreFilters
                    categories={categories}
                    levels={levels}
                    selectedCategory={selectedCategory}
                    selectedLevel={selectedLevel}
                    searchQuery={searchQuery}
                    onCategoryChange={setSelectedCategory}
                    onLevelChange={setSelectedLevel}
                    onSearchChange={setSearchQuery}
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
                <ExploreGrid courses={courses} isLoading={isLoading} />
            </main>
        </div>
    );
};
