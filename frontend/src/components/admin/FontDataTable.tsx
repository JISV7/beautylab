import React, { useState, useMemo } from 'react';
import { ChevronDown, Trash2, Search } from 'lucide-react';
import type { Font } from '../../data/theme.types';

interface FontDataTableProps {
    fonts: Font[];
    onDelete: (font: Font) => void;
}

interface SortConfig {
    column: 'name' | 'filename' | 'created_at' | 'usage_count' | 'created_by';
    direction: 'asc' | 'desc';
}

interface PageConfig {
    currentPage: number;
    rowsPerPage: number;
}

export const FontDataTable: React.FC<FontDataTableProps> = ({
    fonts,
    onDelete,
}) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        column: 'created_at',
        direction: 'desc',
    });
    const [pageConfig, setPageConfig] = useState<PageConfig>({
        currentPage: 0,
        rowsPerPage: 10,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [fontToDelete, setFontToDelete] = useState<Font | null>(null);

    const handleSort = (column: SortConfig['column']) => {
        setSortConfig((prev) => ({
            column,
            direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleDeleteClick = (font: Font) => {
        setFontToDelete(font);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (fontToDelete) {
            onDelete(fontToDelete);
            setDeleteConfirmOpen(false);
            setFontToDelete(null);
        }
    };

    const getDeleteMessage = (font: Font) => {
        const usage = font.fontUsage || [];
        if (usage.length > 0) {
            const usageText = usage.map((u: any) => `${u.themeName} (${u.element})`).join(', ');
            return (
                <>
                    This font is currently being used in:
                    <br />
                    <span className="text-amber-600 dark:text-amber-400 mt-2 block font-medium">
                        {usageText}
                    </span>
                    <br />
                    <span className="text-red-600 dark:text-red-400 mt-2 block">
                        Please remove it from these themes before deleting.
                    </span>
                </>
            );
        }
        return (
            <>
                Are you sure you want to delete <strong>"{font.name}"</strong>?
                <br />
                <span className="text-red-600 dark:text-red-400 mt-2 block">
                    This action cannot be undone.
                </span>
            </>
        );
    };

    const filteredAndSortedData = useMemo(() => {
        // Filter by search query
        let data = fonts.filter(font =>
            font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            font.filename.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort
        data.sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.column) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'filename':
                    comparison = a.filename.localeCompare(b.filename);
                    break;
                case 'created_at':
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    comparison = dateA - dateB;
                    break;
                case 'created_by':
                    const nameA = (a.createdByName || a.createdBy || '').toLowerCase();
                    const nameB = (b.createdByName || b.createdBy || '').toLowerCase();
                    comparison = nameA.localeCompare(nameB);
                    break;
                case 'usage_count':
                    comparison = (a.usageCount || 0) - (b.usageCount || 0);
                    break;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return data;
    }, [fonts, searchQuery, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedData.length / pageConfig.rowsPerPage);
    const start = pageConfig.currentPage * pageConfig.rowsPerPage;
    const paginatedData = filteredAndSortedData.slice(start, start + pageConfig.rowsPerPage);

    const SortIcon: React.FC<{ column: SortConfig['column'] }> = ({ column }) => {
        if (sortConfig.column !== column) return null;
        return (
            <ChevronDown
                className={`w-4 h-4 inline ml-1 transition-transform ${
                    sortConfig.direction === 'asc' ? 'rotate-180' : ''
                }`}
            />
        );
    };

    return (
        <div className="theme-card overflow-hidden p-0">
            {/* Search Bar */}
            <div className="p-4 border-b palette-border flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-p-color" />
                    <input
                        type="text"
                        placeholder="Search fonts..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPageConfig(prev => ({ ...prev, currentPage: 0 }));
                        }}
                        className="w-full pl-10 pr-4 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color placeholder-[var(--palette-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                    />
                </div>
                <div className="text-sm text-slate-500">
                    {filteredAndSortedData.length} font{filteredAndSortedData.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-black/5 dark:bg-white/5 border-b palette-border">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap">
                                <button onClick={() => handleSort('name')} className="flex items-center">
                                    Font Name<SortIcon column="name" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap">
                                <button onClick={() => handleSort('filename')} className="flex items-center">
                                    Filename<SortIcon column="filename" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap">
                                <button onClick={() => handleSort('created_by')} className="flex items-center">
                                    Uploaded By<SortIcon column="created_by" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap">
                                <button onClick={() => handleSort('created_at')} className="flex items-center">
                                    Uploaded<SortIcon column="created_at" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-p-color cursor-pointer hover:opacity-70 whitespace-nowrap">
                                <button onClick={() => handleSort('usage_count')} className="flex items-center">
                                    Usage Count<SortIcon column="usage_count" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-p-color">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((font) => (
                            <tr
                                key={font.id}
                                className="border-b palette-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-lg font-bold"
                                            style={{ fontFamily: font.name }}
                                        >
                                            Ag
                                        </span>
                                        <span className="font-medium text-p-color">{font.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                                    {font.filename}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {font.createdByName || font.createdBy || 'Unknown'}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {font.createdAt ? new Date(font.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        (font.usageCount || 0) > 0
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {font.usageCount || 0} usage{(font.usageCount || 0) !== 1 ? 's' : ''}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDeleteClick(font)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                        title={font.usageCount ? 'Cannot delete - font in use' : 'Delete font'}
                                    >
                                        <Trash2 className={`w-4 h-4 ${font.usageCount ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                    {searchQuery ? 'No fonts match your search.' : 'No fonts uploaded yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-4 py-3 border-t palette-border flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Showing {start + 1} to {Math.min(start + pageConfig.rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} fonts
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPageConfig(prev => ({ ...prev, currentPage: Math.max(0, prev.currentPage - 1) }))}
                            disabled={pageConfig.currentPage === 0}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPageConfig(prev => ({ ...prev, currentPage: i }))}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                        pageConfig.currentPage === i
                                            ? 'bg-palette-primary text-white'
                                            : 'border palette-border hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPageConfig(prev => ({ ...prev, currentPage: Math.min(totalPages - 1, prev.currentPage + 1) }))}
                            disabled={pageConfig.currentPage >= totalPages - 1}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && fontToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md relative overflow-hidden bg-[var(--palette-surface)] border border-[var(--palette-border)] rounded-2xl shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-[var(--text-h2-color)] mb-2">
                                        Delete Font
                                    </h2>
                                    {getDeleteMessage(fontToDelete)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setDeleteConfirmOpen(false);
                                        setFontToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg border border-[var(--palette-border)] text-[var(--text-p-color)] hover:bg-[var(--palette-border)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={(fontToDelete.fontUsage || []).length > 0}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
