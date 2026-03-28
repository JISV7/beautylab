import { Search } from 'lucide-react';

interface DataTableHeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdd?: () => void;
  addButtonText?: string;
  totalItems: number;
  searchPlaceholder?: string;
}

export const DataTableHeader: React.FC<DataTableHeaderProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onAdd,
  addButtonText = 'Add New',
  totalItems,
  searchPlaceholder = 'Search...',
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-primary">{title}</h2>
        {onAdd && (
          <button onClick={onAdd} className="theme-button theme-button-primary">
            {addButtonText}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-p-color" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color placeholder-[var(--palette-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
          />
        </div>
        <div className="text-p-font text-p-size text-sm sm:text-base text-slate-500 whitespace-nowrap">
          {totalItems} record{totalItems !== 1 ? 's' : ''} found
        </div>
      </div>
    </div>
  );
};
