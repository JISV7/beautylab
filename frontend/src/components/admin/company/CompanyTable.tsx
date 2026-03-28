import type { Column } from '../data-table';
import type { CompanyInfo } from '../../../data/company.types';
import { DataTable } from '../data-table';
import { Edit, Trash2 } from 'lucide-react';

interface CompanyTableProps {
  companies: CompanyInfo[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (company: CompanyInfo) => void;
  onDelete: (company: CompanyInfo) => void;
  onAdd: () => void;
}

export const CompanyTable: React.FC<CompanyTableProps> = ({
  companies,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const handleDelete = (company: CompanyInfo) => {
    if (window.confirm(`Are you sure you want to delete "${company.businessName}"?`)) {
      onDelete(company);
    }
  };

  const columns: Column<CompanyInfo>[] = [
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
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (item) => (
        <span className="text-p-color opacity-75">{item.email || '-'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (item) => (
        <span className="text-p-color opacity-75">{item.phone || '-'}</span>
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
      data={companies}
      columns={columns}
      title="Company Info"
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onAdd={onAdd}
      addButtonText="Add Company"
      searchPlaceholder="Search by name, RIF, email..."
      rowsPerPage={10}
      getItemId={(item) => item.id}
      emptyMessage="No company information records found."
      itemType="companies"
    />
  );
};
