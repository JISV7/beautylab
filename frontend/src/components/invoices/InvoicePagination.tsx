import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoicePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
}

export function InvoicePagination({ currentPage, totalPages, onPageChange, totalItems }: InvoicePaginationProps) {
    if (totalPages <= 1) return null;

    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('…');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('…');
        pages.push(totalPages);
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t palette-border print:hidden">
            <p className="text-paragraph opacity-60">
                Showing <strong>{totalItems}</strong> result{totalItems !== 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg btn-hover-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                >
                    <ChevronLeft className="w-4 h-4 text-paragraph" />
                </button>

                {pages.map((page, idx) =>
                    page === '…' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-paragraph opacity-40">…</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-palette-primary text-white'
                                    : 'btn-hover-surface text-paragraph'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg btn-hover-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                >
                    <ChevronRight className="w-4 h-4 text-paragraph" />
                </button>
            </div>
        </div>
    );
}
