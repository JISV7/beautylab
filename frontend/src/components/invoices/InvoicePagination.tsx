import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoicePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function InvoicePagination({ currentPage, totalPages, onPageChange }: InvoicePaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between gap-4 mt-6 print:hidden">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            <span className="text-paragraph">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
