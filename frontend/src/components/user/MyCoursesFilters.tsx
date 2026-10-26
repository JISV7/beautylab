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
                <label className="block text-sm font-semibold mb-2 text-paragraph">
                    Buscar
                </label>
                <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                    <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                    <input
                        type="text"
                        placeholder="Buscar cursos..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-paragraph placeholder:opacity-60 focus:outline-none"
                    />
                </div>
            </div>
            <div className="w-full sm:w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-paragraph">
                    Estado
                </label>
                <select
                    className="theme-input w-full"
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                >
                    <option value="all">Todos</option>
                    <option value="payment_pending">Pago pendiente</option>
                    <option value="ready_to_redeem">Listo para canjear</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                    <option value="unavailable">Sin acceso</option>
                </select>
            </div>
            <div className="w-full sm:w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-paragraph">
                    Categoría
                </label>
                <select
                    className="theme-input w-full"
                    value={categoryFilter}
                    onChange={(e) => onCategoryFilterChange(e.target.value)}
                >
                    <option value="">Todas</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
            {categoryFilter && (
                <div className="w-full sm:w-[180px]">
                    <label className="block text-sm font-semibold mb-2 text-paragraph">
                        Subcategorías
                    </label>
                    <button
                        onClick={() => onIncludeChildrenChange(!includeChildren)}
                        className={`w-full py-2 px-3 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            includeChildren
                                ? 'bg-[var(--palette-primary)] text-[var(--decorator-color)] border-[var(--palette-primary)]'
                                : 'bg-[var(--palette-background)] text-paragraph opacity-60 border-[var(--palette-border)]'
                        }`}
                        aria-label="Incluir subcategorías"
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
                        {includeChildren ? 'SÍ' : 'NO'}
                    </button>
                </div>
            )}
        </div>
    );
};
