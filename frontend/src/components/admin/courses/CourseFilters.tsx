import React from 'react';
import { Search } from 'lucide-react';
import type { Category, Level } from '../types';

export interface CourseFiltersProps {
    searchQuery: string;
    categoryFilter: string;
    levelFilter: string;
    publishedFilter: string;
    categories: Category[];
    levels: Level[];
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onLevelChange: (value: string) => void;
    onPublishedFilterChange: (value: string) => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
    searchQuery,
    categoryFilter,
    levelFilter,
    publishedFilter,
    categories,
    levels,
    onSearchChange,
    onCategoryChange,
    onLevelChange,
    onPublishedFilterChange,
}) => {
    return (
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
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-p-color">Category</label>
                <select
                    className="theme-input w-full"
                    value={categoryFilter}
                    onChange={(e) => onCategoryChange(e.target.value)}
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
                    onChange={(e) => onLevelChange(e.target.value)}
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
                    onChange={(e) => onPublishedFilterChange(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                </select>
            </div>
        </div>
    );
};
