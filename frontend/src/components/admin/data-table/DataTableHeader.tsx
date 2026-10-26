import { Search } from 'lucide-react';

interface DataTableHeaderProps {
  title?: string;
  hideTitle?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdd?: () => void;
  addButtonText?: string;
  totalItems: number;
  searchPlaceholder?: string;
}

export const DataTableHeader: React.FC<DataTableHeaderProps> = ({
  title,
  hideTitle = false,
  searchQuery,
  onSearchChange,
  onAdd,
  addButtonText = 'Add New',
  totalItems,
  searchPlaceholder = 'Search...',
}) => {
  return (
    <div className="mb-6">
      {!hideTitle && title && (
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-3xl font-bold text-link">{title}</h2>
          {onAdd && (
            <button onClick={onAdd} className="theme-button theme-button-primary">
              {addButtonText}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:flex-1 sm:max-w-md">
          <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
            <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" aria-hidden="true" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={searchPlaceholder}
              className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>
        <div className="text-paragraph text-sm sm:text-base text-muted whitespace-nowrap mr-auto">
          {totalItems} record{totalItems !== 1 ? 's' : ''} found
        </div>
        {hideTitle && onAdd && (
          <button onClick={onAdd} className="theme-button theme-button-primary w-full sm:w-auto">
            {addButtonText}
          </button>
        )}
      </div>
    </div>
  );
};
