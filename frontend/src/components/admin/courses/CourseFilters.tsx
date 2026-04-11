import React from 'react';
import { Search } from 'lucide-react';
import type { Category, Level } from '../types';

export interface CourseFiltersProps {
    searchQuery: string;
    categoryFilter: string;
    levelFilter: string;
    publishedFilter: string;
    includeChildren: boolean;
    categories: Category[];
    levels: Level[];
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onLevelChange: (value: string) => void;
    onPublishedFilterChange: (value: string) => void;
    onIncludeChildrenChange: (value: boolean) => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
    searchQuery,
    categoryFilter,
    levelFilter,
    publishedFilter,
    includeChildren,
    categories,
    levels,
    onSearchChange,
    onCategoryChange,
    onLevelChange,
    onPublishedFilterChange,
    onIncludeChildrenChange,
}) => {
    return (
        <div className="theme-card flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2 text-paragraph">
                    Search
                </label>
                <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                    <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-paragraph placeholder:opacity-60 focus:outline-none"
                    />
                </div>
            </div>
            <div className="w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-paragraph">Category</label>
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
                <label className="block text-sm font-semibold mb-2 text-paragraph">Level</label>
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
            {categoryFilter && (
                <div className="w-[180px]">
                    <label className="block text-sm font-semibold mb-2 text-paragraph">
                        Subcategories
                    </label>
                    <button
                        onClick={() => onIncludeChildrenChange(!includeChildren)}
                        className={`w-full py-2 px-3 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            includeChildren
                                ? 'bg-[var(--palette-primary)] text-[var(--decorator-color)] border-[var(--palette-primary)]'
                                : 'bg-[var(--palette-background)] text-paragraph opacity-60 border-[var(--palette-border)]'
                        }`}
                        aria-label="Toggle include subcategories"
                        aria-pressed={includeChildren}
                    >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            includeChildren ? 'border-white bg-white/20' : 'border-current'
                        }`}>
                            {includeChildren && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 5L4 8L9 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </span>
                        {includeChildren ? 'ON' : 'OFF'}
                    </button>
                </div>
            )}
            <div className="w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-paragraph">Status</label>
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
