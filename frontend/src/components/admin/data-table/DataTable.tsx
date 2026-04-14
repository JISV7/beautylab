import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { DataTableHeader } from './DataTableHeader';
import { DataTablePagination } from './DataTablePagination';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  hideTitle?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdd?: () => void;
  addButtonText?: string;
  searchPlaceholder?: string;
  rowsPerPage?: number;
  getItemId?: (item: T) => string | number;
  emptyMessage?: string;
  itemType?: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  title,
  hideTitle = false,
  searchQuery,
  onSearchChange,
  onAdd,
  addButtonText = 'Add New',
  searchPlaceholder = 'Search...',
  rowsPerPage = 10,
  getItemId,
  emptyMessage = 'No records found.',
  itemType = 'records',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: '',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(0);

  const handleSort = (columnKey: string) => {
    setSortConfig((prev) => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedData = useMemo(() => {
    // Filter by search query
    let filtered = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        columns.some((column) => {
          const value = item[column.key as keyof T];
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof T];
        const bValue = b[sortConfig.column as keyof T];

        let comparison = 0;
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchQuery, sortConfig, columns]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const start = currentPage * rowsPerPage;
  const paginatedData = filteredAndSortedData.slice(start, start + rowsPerPage);
  const endItem = Math.min(start + rowsPerPage, filteredAndSortedData.length);

  const SortIcon: React.FC<{ columnKey: string }> = ({ columnKey }) => {
    if (sortConfig.column !== columnKey) return null;
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
      <DataTableHeader
        title={title}
        hideTitle={hideTitle}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          onSearchChange(query);
          setCurrentPage(0);
        }}
        onAdd={onAdd}
        addButtonText={addButtonText}
        totalItems={filteredAndSortedData.length}
        searchPlaceholder={searchPlaceholder}
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-palette-border border-b palette-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-sm font-bold text-paragraph ${
                    column.sortable ? 'cursor-pointer hover:opacity-70' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && <SortIcon columnKey={String(column.key)} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr
                key={getItemId ? getItemId(item) : idx}
                className="border-b palette-border hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className={`px-4 py-3 ${column.className || ''}`}>
                    {column.render ? column.render(item) : String(item[column.key as keyof T])}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-paragraph">
                  {searchQuery ? `No ${itemType} match your search.` : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        startItem={start + 1}
        endItem={endItem}
        totalItems={filteredAndSortedData.length}
        onPageChange={setCurrentPage}
        itemType={itemType}
      />
    </div>
  );
}
