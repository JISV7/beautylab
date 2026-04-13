import { ChevronDown, FileText } from 'lucide-react';
import type { Invoice, SortableColumn } from '../../data/invoice.types';

interface InvoiceTableProps {
    invoices: Invoice[];
    onViewDetails: (invoice: Invoice) => void;
    sortColumn: SortableColumn;
    sortDirection: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
}

function SortIcon({ column, sortColumn, sortDirection }: { column: SortableColumn; sortColumn: SortableColumn; sortDirection: 'asc' | 'desc' }) {
    if (sortColumn !== column) return <span className="w-4 h-4 ml-1 opacity-0" />;
    return (
        <ChevronDown
            className={`w-4 h-4 ml-1 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
        />
    );
}

const statusLabels: Record<string, string> = {
    paid: 'Paid',
    partial: 'Partial',
    cancelled: 'Cancelled',
    issued: 'Issued',
};

const statusClasses: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    issued: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const columns: { key: SortableColumn; label: string }[] = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'control_number', label: 'Control #' },
    { key: 'issue_date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
];

export function InvoiceTable({ invoices, onViewDetails, sortColumn, sortDirection, onSort }: InvoiceTableProps) {
    if (invoices.length === 0) {
        return (
            <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-paragraph">No invoices found.</p>
                <p className="text-paragraph opacity-75 text-sm mt-2">
                    When you purchase a course, your invoices will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="palette-surface rounded-lg shadow-sm palette-border overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="palette-surface border-b palette-border text-paragraph text-sm uppercase tracking-wider opacity-75">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="p-4 font-semibold cursor-pointer btn-hover-surface transition-colors"
                                onClick={() => onSort(col.key)}
                            >
                                <div className="flex items-center">
                                    {col.label}
                                    <SortIcon column={col.key} sortColumn={sortColumn} sortDirection={sortDirection} />
                                </div>
                            </th>
                        ))}
                        <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice) => (
                        <tr
                            key={invoice.id}
                            className="border-b palette-border table-row-hover cursor-pointer transition-colors"
                            onClick={() => onViewDetails(invoice)}
                        >
                            <td className="p-4 font-medium">{invoice.invoice_number}</td>
                            <td className="p-4 font-mono text-sm">{invoice.control_number}</td>
                            <td className="p-4">{(() => { const [y, m, d] = invoice.issue_date.split('-').map(Number); return `${y}/${m}/${d}`; })()}</td>
                            <td className="p-4">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-primary">
                                        Bs. {parseFloat(invoice.total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {invoice.payment_progress !== undefined && (
                                        <div className="w-32">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 palette-background rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            invoice.payment_progress >= 100
                                                                ? 'bg-green-500'
                                                                : invoice.payment_progress > 0
                                                                ? 'bg-blue-500'
                                                                : 'bg-yellow-500'
                                                        }`}
                                                        style={{ width: `${Math.min(invoice.payment_progress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-paragraph opacity-75 w-10">
                                                    {invoice.payment_progress.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[invoice.status] || statusClasses.issued}`}>
                                    {statusLabels[invoice.status] || invoice.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewDetails(invoice);
                                    }}
                                    className="text-primary hover:underline text-sm"
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
