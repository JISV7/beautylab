import type { Column } from '../data-table';
import type { Printer } from '../../../data/company.types';
import { DataTable } from '../data-table';
import { Edit, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';

interface PrinterTableProps {
  printers: Printer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (printer: Printer) => void;
  onDelete: (printer: Printer) => void;
  onAdd: () => void;
  onSetActive?: (printer: Printer) => void;
}

export const PrinterTable: React.FC<PrinterTableProps> = ({
  printers,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onAdd,
  onSetActive,
}) => {
  const columns: Column<Printer>[] = [
    {
      key: 'businessName',
      label: 'Business Name',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-paragraph">{item.businessName}</span>
      ),
    },
    {
      key: 'rif',
      label: 'RIF',
      sortable: true,
    },
    {
      key: 'authorizationProvidence',
      label: 'Authorization Providence',
      sortable: false,
      render: (item) => (
        <span className="text-paragraph opacity-75 text-sm">{item.authorizationProvidence}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
              <XCircle className="w-3.5 h-3.5" />
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {!item.isActive && onSetActive && (
            <button
              onClick={() => onSetActive(item)}
              className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors"
              title="Set as Active"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            disabled={item.isActive}
            className={`p-1.5 rounded-lg transition-colors ${
              item.isActive
                ? 'opacity-30 cursor-not-allowed text-gray-400'
                : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}
            title={item.isActive ? 'Cannot delete active printer' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={printers}
      columns={columns}
      hideTitle
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onAdd={onAdd}
      addButtonText="+ Add Printer"
      searchPlaceholder="Search by name, RIF..."
      rowsPerPage={10}
      getItemId={(item) => item.id}
      emptyMessage="No printer records found."
      itemType="printers"
    />
  );
};
