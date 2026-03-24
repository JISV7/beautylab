import React from 'react';

export interface CoursePaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export const CoursePagination: React.FC<CoursePaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    // Generate page numbers to display (max 5 pages)
    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 3; i++) {
                    pages.push(i);
                }
                pages.push(-1); // Ellipsis
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push(-1); // Ellipsis
                for (let i = totalPages - 2; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push(-1); // Ellipsis
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push(-1); // Ellipsis
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--palette-border)] font-manrope">
            <span className="text-sm text-p-color opacity-70">
                Showing <span className="font-bold text-p-color">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-bold text-p-color">{totalItems}</span> courses
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-[var(--palette-border)] rounded-lg text-p-color hover:bg-[var(--palette-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {pageNumbers.map((pageNum, index) => (
                    pageNum === -1 ? (
                        <span key={`ellipsis-${index}`} className="text-p-color opacity-40 px-1">...</span>
                    ) : (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                currentPage === pageNum
                                    ? 'bg-[var(--palette-primary)] text-white'
                                    : 'text-p-color hover:bg-[var(--palette-surface)]'
                            }`}
                        >
                            {pageNum}
                        </button>
                    )
                ))}

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 border border-[var(--palette-border)] rounded-lg text-p-color hover:bg-[var(--palette-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
