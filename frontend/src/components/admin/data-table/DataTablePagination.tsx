interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemType?: string;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalItems,
  onPageChange,
  itemType = 'records',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t palette-border flex items-center justify-between flex-wrap gap-4">
      <span className="text-sm text-paragraph">
        Showing {startItem} to {endItem} of {totalItems} {itemType}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1 rounded-lg border palette-border text-paragraph hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1 rounded-lg border palette-border text-paragraph hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
