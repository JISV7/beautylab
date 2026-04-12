import { DollarSign, FileText, Percent, Receipt } from 'lucide-react';
import type { InvoiceSummary } from '../../data/invoice.types';

interface Props {
    summary: InvoiceSummary;
}

export function InvoiceSummaryCards({ summary }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                    <p className="text-sm text-paragraph opacity-75">Total Invoices</p>
                    <p className="text-2xl font-bold">{summary.total_invoices}</p>
                </div>
            </div>
            <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                    <p className="text-sm text-paragraph opacity-75">Base Total</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {parseFloat(summary.total_subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                    <p className="text-sm text-paragraph opacity-75">Total IVA (16%)</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {parseFloat(summary.total_iva).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                    <p className="text-sm text-paragraph opacity-75">Total Paid</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {parseFloat(summary.total_paid).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
        </div>
    );
}
