import React from 'react';
import { ChevronDown, Check, Eye, Edit, Trash2, Copy } from 'lucide-react';
import type { ThemeTableProps, ThemeTableRow } from './types';

interface SortIconProps {
    column: 'name' | 'isActive' | 'isDefault';
    sortColumn: 'name' | 'isActive' | 'isDefault';
    sortDirection: 'asc' | 'desc';
}

const SortIcon: React.FC<SortIconProps> = ({ column, sortColumn, sortDirection }) => {
    if (sortColumn !== column) return null;
    return (
        <ChevronDown
            className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
            aria-hidden="true"
        />
    );
};

export const ThemeTable: React.FC<ThemeTableProps> = ({
    themes,
    currentPage,
    rowsPerPage,
    sortColumn,
    sortDirection,
    onEdit,
    onPreview,
    onDelete,
    onDuplicate,
    onPageChange,
    onSort,
}) => {
    // Get table data
    const getTableData = (): ThemeTableRow[] => {
        return themes.map((theme) => ({
            id: theme.id,
            name: theme.name,
            type: theme.type,
            isActive: theme.isActive,
            isDefault: theme.isDefault,
            createdAt: theme.createdAt
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
            } else if (sortColumn === 'isActive' || sortColumn === 'isDefault') {
                comparison = (a[sortColumn] === b[sortColumn]) ? 0 : (a[sortColumn] ? -1 : 1);
            } else if (sortColumn === 'createdAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

    return (
        <div className="theme-card overflow-hidden p-0">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[800px]">
                <thead className="bg-black/5 dark:bg-white/5 border-b palette-border">
                    <tr>
                        <th
                            className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap"
                            onClick={() => onSort('name')}
                            role="columnheader"
                            aria-sort={sortColumn === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center gap-1 sm:gap-2">
                                NAME
                                <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th
                            className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap"
                            onClick={() => onSort('isActive')}
                            role="columnheader"
                            aria-sort={sortColumn === 'isActive' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center gap-1 sm:gap-2">
                                ACTIVE
                                <SortIcon column="isActive" sortColumn={sortColumn} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th
                            className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap"
                            onClick={() => onSort('isDefault')}
                            role="columnheader"
                            aria-sort={sortColumn === 'isDefault' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center gap-1 sm:gap-2">
                                DEFAULT
                                <SortIcon column="isDefault" sortColumn={sortColumn} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-p-color whitespace-nowrap" role="columnheader">
                            TYPE
                        </th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold text-p-color whitespace-nowrap" role="columnheader">
                            ACTIONS
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, idx) => (
                        <tr
                            key={row.id}
                            className={`border-b palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`}
                        >
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className="font-semibold">{row.name}</span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                {row.isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Check className="w-3 h-3" /> Active
                                    </span>
                                ) : (
                                    <span className="text-p-color opacity-60">-</span>
                                )}
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                {row.isDefault ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Eye className="w-3 h-3" /> Default
                                    </span>
                                ) : (
                                    <span className="text-p-color opacity-60">-</span>
                                )}
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className="text-sm text-p-color capitalize">{row.type}</span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                    <button
                                        onClick={() => onEdit(row.id)}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={() => onPreview(row.id)}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
                                        title="Preview"
                                    >
                                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDuplicate(row.id)}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors"
                                        title="Duplicate"
                                    >
                                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(row.id)}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={row.isDefault ? "Cannot delete default theme" : "Delete"}
                                        disabled={row.isDefault}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {tableData.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-p-color">
                                No themes found. Create your first theme!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t palette-border flex items-center justify-between flex-wrap gap-4">
                    <span className="text-sm text-p-color">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="px-3 py-1 rounded-lg border palette-border text-p-color hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="px-3 py-1 rounded-lg border palette-border text-p-color hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
