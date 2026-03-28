import type { Column } from '../data-table';
import type { Printer } from '../../../data/company.types';
import { DataTable } from '../data-table';
import { Edit, Trash2 } from 'lucide-react';

interface PrinterTableProps {
  printers: Printer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (printer: Printer) => void;
  onDelete: (printer: Printer) => void;
  onAdd: () => void;
}

export const PrinterTable: React.FC<PrinterTableProps> = ({
  printers,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const handleDelete = (printer: Printer) => {
    if (window.confirm(`Are you sure you want to delete "${printer.businessName}"?`)) {
      onDelete(printer);
    }
  };

  const columns: Column<Printer>[] = [
    {
      key: 'businessName',
      label: 'Business Name',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-p-color">{item.businessName}</span>
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
        <span className="text-p-color opacity-75 text-sm">{item.authorizationProvidence}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            title="Delete"
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
      title="Printer Info"
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
