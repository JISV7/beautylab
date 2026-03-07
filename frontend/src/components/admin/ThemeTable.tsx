import React from 'react';
import { ChevronDown, Check, Eye, Edit, Trash2 } from 'lucide-react';
import type { ThemeTableProps, ThemeTableRow } from './types';

export const ThemeTable: React.FC<ThemeTableProps> = ({
    themes,
    activeThemeName,
    publishedThemeName,
    currentPage,
    rowsPerPage,
    sortColumn,
    sortDirection,
    onEdit,
    onPreview,
    onDelete,
    onPageChange,
    onSort,
}) => {
    // Get table data
    const getTableData = (): ThemeTableRow[] => {
        return Object.entries(themes).map(([key, theme]) => ({
            key,
            name: theme.name,
            isActive: key === activeThemeName,
            isPublished: key === publishedThemeName
        }));
    };

    // Sort and paginate
    const getSortedAndPaginatedData = () => {
        let data = getTableData();

        // Sort
        data.sort((a, b) => {
            let comparison = 0;
            if (sortColumn === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortColumn === 'isActive' || sortColumn === 'isPublished') {
                comparison = (a[sortColumn] === b[sortColumn]) ? 0 : (a[sortColumn] ? -1 : 1);
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        // Paginate
        const totalPages = Math.ceil(data.length / rowsPerPage);
        const start = currentPage * rowsPerPage;
        const paginatedData = data.slice(start, start + rowsPerPage);

        return { data: paginatedData, totalPages };
    };

    const { data: tableData, totalPages } = getSortedAndPaginatedData();

    const renderSortIcon = (column: 'name' | 'isActive' | 'isPublished') => {
        if (sortColumn !== column) return null;
        return (
            <ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
        );
    };

    return (
        <div className="theme-surface rounded-xl border theme-border overflow-hidden shadow-sm">
            <table className="w-full">
                <thead className="bg-black/5 dark:bg-white/5 border-b theme-border">
                    <tr>
                        <th
                            className="px-6 py-4 text-left text-sm font-bold theme-text-secondary cursor-pointer hover:opacity-70"
                            onClick={() => onSort('name')}
                        >
                            <div className="flex items-center gap-2">
                                NAME
                                {renderSortIcon('name')}
                            </div>
                        </th>
                        <th
                            className="px-6 py-4 text-left text-sm font-bold theme-text-secondary cursor-pointer hover:opacity-70"
                            onClick={() => onSort('isActive')}
                        >
                            <div className="flex items-center gap-2">
                                ACTIVE
                                {renderSortIcon('isActive')}
                            </div>
                        </th>
                        <th
                            className="px-6 py-4 text-left text-sm font-bold theme-text-secondary cursor-pointer hover:opacity-70"
                            onClick={() => onSort('isPublished')}
                        >
                            <div className="flex items-center gap-2">
                                PUBLISHED
                                {renderSortIcon('isPublished')}
                            </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold theme-text-secondary">
                            ACTIONS
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, index) => (
                        <tr
                            key={row.key}
                            className={`border-b theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`}
                        >
                            <td className="px-6 py-4">
                                <span className="font-semibold theme-text-base">{row.name}</span>
                            </td>
                            <td className="px-6 py-4">
                                {row.isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Check className="w-3 h-3" /> Being Edited
                                    </span>
                                ) : (
                                    <span className="theme-text-secondary">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {row.isPublished ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Eye className="w-3 h-3" /> Live on Site
                                    </span>
                                ) : (
                                    <span className="theme-text-secondary">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(row.key)}
                                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onPreview(row.key)}
                                        className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(row.key)}
                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={row.isPublished ? "Cannot delete published theme" : "Delete"}
                                        disabled={row.isPublished}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {tableData.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center theme-text-secondary">
                                No themes found. Create your first theme!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t theme-border flex items-center justify-between">
                    <span className="text-sm theme-text-secondary">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="px-3 py-1 rounded-lg border theme-border theme-text-secondary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="px-3 py-1 rounded-lg border theme-border theme-text-secondary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
