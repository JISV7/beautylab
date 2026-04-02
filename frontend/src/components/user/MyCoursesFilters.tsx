import React from 'react';
import { Search } from 'lucide-react';

export interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
}

export interface MyCoursesFiltersProps {
    searchQuery: string;
    statusFilter: string;
    categoryFilter: string;
    includeChildren: boolean;
    categories: Category[];
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onCategoryFilterChange: (value: string) => void;
    onIncludeChildrenChange: (value: boolean) => void;
}

export const MyCoursesFilters: React.FC<MyCoursesFiltersProps> = ({
    searchQuery,
    statusFilter,
    categoryFilter,
    includeChildren,
    categories,
    onSearchChange,
    onStatusFilterChange,
    onCategoryFilterChange,
    onIncludeChildrenChange,
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
                <label className="block text-sm font-semibold mb-2 text-p-color">
                    Status
                </label>
                <select
                    className="theme-input w-full"
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                >
                    <option value="all">All</option>
                    <option value="partial">Partial Payment</option>
                    <option value="ready">Ready to Redeem</option>
                    <option value="active">Active</option>
                </select>
            </div>
            <div className="w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-p-color">
                    Category
                </label>
                <select
                    className="theme-input w-full"
                    value={categoryFilter}
                    onChange={(e) => onCategoryFilterChange(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
            {categoryFilter && (
                <div className="w-[180px]">
                    <label className="block text-sm font-semibold mb-2 text-p-color">
                        Subcategories
                    </label>
                    <button
                        onClick={() => onIncludeChildrenChange(!includeChildren)}
                        className={`w-full py-2 px-3 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            includeChildren
                                ? 'bg-[var(--palette-primary)] text-[var(--decorator-color)] border-[var(--palette-primary)]'
                                : 'bg-[var(--palette-background)] text-p-color opacity-60 border-[var(--palette-border)]'
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
        </div>
    );
};
