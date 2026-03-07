import React from 'react';
import { Plus } from 'lucide-react';
import type { NamedTheme } from '../../data/theme.types';
import { ThemeTable } from './ThemeTable';

interface ThemeListProps {
    themes: Record<string, NamedTheme>;
    activeThemeName: string;
    publishedThemeName: string | null;
    currentPage: number;
    rowsPerPage: number;
    sortColumn: 'name' | 'isActive' | 'isPublished';
    sortDirection: 'asc' | 'desc';
    onCreateTheme: () => void;
    onEdit: (themeKey: string) => void;
    onPreview: (themeKey: string) => void;
    onDelete: (themeKey: string) => void;
    onPageChange: (page: number) => void;
    onSort: (column: 'name' | 'isActive' | 'isPublished') => void;
}

export const ThemeList: React.FC<ThemeListProps> = ({
    themes,
    activeThemeName,
    publishedThemeName,
    currentPage,
    rowsPerPage,
    sortColumn,
    sortDirection,
    onCreateTheme,
    onEdit,
    onPreview,
    onDelete,
    onPageChange,
    onSort,
}) => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <header className="h-16 theme-surface border-b theme-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold theme-text-base">Theme Manager</h2>
                <button
                    onClick={onCreateTheme}
                    className="px-4 py-2 text-sm font-medium text-white theme-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Theme
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-3xl font-black tracking-tight theme-text-base">Themes</h1>
                        <p className="theme-text-secondary">
                            Manage your site themes. Click Edit to customize colors and typography, or Publish to make a theme live on the site.
                        </p>
                    </div>

                    <ThemeTable
                        themes={themes}
                        activeThemeName={activeThemeName}
                        publishedThemeName={publishedThemeName}
                        currentPage={currentPage}
                        rowsPerPage={rowsPerPage}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onEdit={onEdit}
                        onPreview={onPreview}
                        onDelete={onDelete}
                        onPageChange={onPageChange}
                        onSort={onSort}
                    />
                </div>
            </div>
        </div>
    );
};
