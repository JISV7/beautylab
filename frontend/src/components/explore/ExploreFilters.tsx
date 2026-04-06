import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface Level {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    order: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface ExploreFiltersProps {
    categories: Category[];
    levels: Level[];
    selectedCategory: number | null;
    selectedLevel: number | null;
    searchQuery: string;
    includeChildren: boolean;
    onCategoryChange: (categoryId: number | null) => void;
    onLevelChange: (levelId: number | null) => void;
    onSearchChange: (query: string) => void;
    onIncludeChildrenChange: (include: boolean) => void;
    onClearFilters: () => void;
}

export const ExploreFilters: React.FC<ExploreFiltersProps> = ({
    categories,
    levels,
    selectedCategory,
    selectedLevel,
    searchQuery,
    includeChildren,
    onCategoryChange,
    onLevelChange,
    onSearchChange,
    onIncludeChildrenChange,
    onClearFilters,
}) => {
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [isExpanded, setIsExpanded] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(localSearch);
        }, 300);

        return () => clearTimeout(timer);
    }, [localSearch, onSearchChange]);

    const hasActiveFilters = selectedCategory !== null || selectedLevel !== null || searchQuery !== '';

    return (
        <div className="bg-[var(--palette-surface)] rounded-xl shadow-md border border-[var(--palette-border)] p-4 md:p-6 mb-6">
            {/* Search Bar */}
            <div className="relative mb-4 md:mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-paragraph opacity-40" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full py-3 pl-12 pr-4 rounded-lg bg-[var(--palette-background)] border border-[var(--palette-border)] text-paragraph focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all"
                    aria-label="Search courses"
                />
                {localSearch && (
                    <button
                        onClick={() => setLocalSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--palette-border)] rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X size={16} className="text-paragraph opacity-60" />
                    </button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Mobile: Expandable Filters */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-[var(--palette-primary)] text-[var(--decorator-color)] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    <Filter size={16} />
                    {isExpanded ? 'Hide Filters' : 'Show Filters'}
                    {hasActiveFilters && (
                        <span className="w-2 h-2 bg-white rounded-full" />
                    )}
                </button>

                {/* Desktop: Always Visible Filters */}
                <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 flex-1`}>
                    {/* Category Filter */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-paragraph opacity-60 uppercase tracking-wider mb-2">
                            Category
                        </label>
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
                            className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-background)] border border-[var(--palette-border)] text-paragraph focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all appearance-none cursor-pointer"
                            aria-label="Filter by category"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Level Filter */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-paragraph opacity-60 uppercase tracking-wider mb-2">
                            Level
                        </label>
                        <select
                            value={selectedLevel || ''}
                            onChange={(e) => onLevelChange(e.target.value ? Number(e.target.value) : null)}
                            className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-background)] border border-[var(--palette-border)] text-paragraph focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all appearance-none cursor-pointer"
                            aria-label="Filter by level"
                        >
                            <option value="">All Levels</option>
                            {levels.map((lvl) => (
                                <option key={lvl.id} value={lvl.id}>
                                    {lvl.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Include Children Toggle */}
                    {selectedCategory !== null && (
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-paragraph opacity-60 uppercase tracking-wider mb-2">
                                Include Subcategories
                            </label>
                            <button
                                onClick={() => onIncludeChildrenChange(!includeChildren)}
                                className={`w-full py-2.5 px-4 rounded-lg border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
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
                                    {includeChildren && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 5L4 8L9 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>}
                                </span>
                                {includeChildren ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    )}

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <button
                                onClick={onClearFilters}
                                className="w-full md:w-auto px-4 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg font-bold text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                aria-label="Clear all filters"
                            >
                                <X size={16} />
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-[var(--palette-border)] flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-paragraph opacity-60 uppercase tracking-wider">
                        Active filters:
                    </span>
                    {selectedCategory !== null && (
                        <span className="inline-flex items-center gap-1 bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] px-3 py-1 rounded-full text-xs font-bold">
                            {categories.find(c => c.id === selectedCategory)?.name}
                            <button
                                onClick={() => onCategoryChange(null)}
                                className="hover:opacity-70 transition-opacity"
                                aria-label="Remove category filter"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {selectedLevel !== null && (
                        <span className="inline-flex items-center gap-1 bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] px-3 py-1 rounded-full text-xs font-bold">
                            {levels.find(l => l.id === selectedLevel)?.name}
                            <button
                                onClick={() => onLevelChange(null)}
                                className="hover:opacity-70 transition-opacity"
                                aria-label="Remove level filter"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {searchQuery && (
                        <span className="inline-flex items-center gap-1 bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] px-3 py-1 rounded-full text-xs font-bold">
                            Search: "{searchQuery}"
                            <button
                                onClick={() => {
                                    setLocalSearch('');
                                    onSearchChange('');
                                }}
                                className="hover:opacity-70 transition-opacity"
                                aria-label="Remove search filter"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
