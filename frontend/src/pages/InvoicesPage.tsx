import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, X, Printer, DollarSign, Receipt, Percent } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface InvoiceLine {
    id: number;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    tax_rate?: string;
    tax_amount?: string;
    is_exempt?: boolean;
}

interface Payment {
    id: string;
    amount: string;
    status: string;
    created_at: string;
    method_type?: string;
}

interface PrinterInfo {
    id: number;
    business_name: string;
    rif: string;
    authorization_providence: string;
}

interface ControlNumberRangeInfo {
    id: number;
    start_number: string;
    end_number: string;
    assigned_date: string;
    printer_id: number;
    printer?: PrinterInfo;
}

interface Adjustment {
    id: number;
    adjustment_type: string;
    description: string;
    amount: string;
    is_percentage: boolean;
}

interface CompanyInfo {
    id: number;
    business_name: string;
    rif: string;
    fiscal_address?: string;
    email?: string;
    phone?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    control_number: string;
    issue_date: string;
    issue_time: string;
    subtotal: string;
    discount_total: string;
    tax_total: string;
    total: string;
    status: string;
    client_rif?: string;
    client_business_name?: string;
    client_document_type?: string;
    client_document_number?: string;
    client_fiscal_address?: string;
    lines?: InvoiceLine[];
    adjustments?: Adjustment[];
    payments?: Payment[];
    company?: CompanyInfo;
    control_number_range?: ControlNumberRangeInfo;
    created_at: string;
}

interface InvoiceSummary {
    total_invoices: number;
    total_subtotal: string;
    total_iva: string;
    total_paid: string;
}

interface InvoicesResponse {
    invoices: Invoice[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<InvoiceSummary | null>(null);

    const fetchSummary = async () => {
        try {
            const response = await api.get<InvoiceSummary>('/invoices/summary');
            setSummary(response.data);
        } catch (error) {
            console.error('Failed to fetch invoice summary:', error);
        }
    };

    const fetchInvoices = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await api.get<InvoicesResponse>(`/invoices/?page=${page}&page_size=10`);
            setInvoices(response.data.invoices);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.page);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoiceDetails = async (invoiceId: string) => {
        try {
            const response = await api.get<Invoice>(`/invoices/${invoiceId}`);
            setSelectedInvoice(response.data);
        } catch (error) {
            console.error('Failed to fetch invoice details:', error);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchInvoices();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading && invoices.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-p-color">Loading invoices...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen palette-background text-p-font">
            {selectedInvoice ? (
                <InvoiceDetail
                    invoice={selectedInvoice}
                    onBack={() => setSelectedInvoice(null)}
                    onPrint={handlePrint}
                />
            ) : (
                <InvoiceList
                    invoices={invoices}
                    summary={summary}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={fetchInvoices}
                    onViewDetails={(invoice) => fetchInvoiceDetails(invoice.id)}
                />
            )}
        </div>
    );
}

function InvoiceList({
    invoices,
    summary,
    currentPage,
    totalPages,
    onPageChange,
    onViewDetails,
}: {
    invoices: Invoice[];
    summary: InvoiceSummary | null;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onViewDetails: (invoice: Invoice) => void;
}) {
    return (
        <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-primary mb-6">My Invoices</h2>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Receipt className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-p-color opacity-75">Total Invoices</p>
                                <p className="text-2xl font-bold">{summary.total_invoices}</p>
                            </div>
                        </div>
                        <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-p-color opacity-75">Base Total</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ${parseFloat(summary.total_subtotal).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-p-color opacity-75">Total IVA (16%)</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    ${parseFloat(summary.total_iva).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-p-color opacity-75">Total Paid</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    ${parseFloat(summary.total_paid).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {invoices.length === 0 ? (
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-p-color">No invoices found.</p>
                        <p className="text-p-color opacity-75 text-sm mt-2">
                            When you purchase a course, your invoices will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="palette-surface rounded-lg shadow-sm palette-border overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="palette-surface border-b palette-border text-p-color text-sm uppercase tracking-wider opacity-75">
                                        <th className="p-4 font-semibold">Invoice #</th>
                                        <th className="p-4 font-semibold">Control #</th>
                                        <th className="p-4 font-semibold">Date</th>
                                        <th className="p-4 font-semibold">Total</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="border-b border-[var(--palette-border)] hover:bg-[var(--palette-surface)] cursor-pointer transition-colors"
                                            onClick={() => onViewDetails(invoice)}
                                        >
                                            <td className="p-4 font-medium">{invoice.invoice_number}</td>
                                            <td className="p-4 font-mono text-sm">{invoice.control_number}</td>
                                            <td className="p-4">
                                                {new Date(invoice.issue_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-semibold text-primary">
                                                ${parseFloat(invoice.total).toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        invoice.status === 'paid'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}
                                                >
                                                    {invoice.status}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-[var(--palette-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--palette-surface)]"
                                >
                                    Previous
                                </button>
                                <span className="text-p-color">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg border border-[var(--palette-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--palette-surface)]"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

function InvoiceDetail({
    invoice,
    onBack,
    onPrint,
}: {
    invoice: Invoice;
    onBack: () => void;
    onPrint: () => void;
}) {
    // Format date as DDMMYYYY (Venezuelan standard Art. 7.6)
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}${month}${year}`;
    };

    // Format time as HH.MM.SS AM/PM (Venezuelan standard Art. 7.6)
    const formatTime = (timeStr: string) => {
        const date = new Date(`2000-01-01T${timeStr}`);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}.${minutes}.${seconds} ${ampm}`;
    };

    // Format date for display (readable)
    const formatDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
            <div className="max-w-6xl mx-auto">
                {/* Header Actions - Hidden on Print */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-p-color hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                        Volver a Facturas
                    </button>
                    <button
                        onClick={onPrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Factura
                    </button>
                </div>

                {/* Invoice Content - Venezuelan Compliance (Art. 7) */}
                <div className="palette-surface palette-border border rounded-xl p-8 print:shadow-none print:border-0">
                    {/* Art. 1: Denominación del documento "FACTURA" */}
                    {/* Art. 2: Numeración consecutiva y única */}
                    {/* Art. 3: Emisor info */}
                    <div className="border-b-2 border-[var(--palette-border)] pb-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-primary">FACTURA</h1>
                                <p className="text-p-color opacity-75 mt-1">
                                    N° {invoice.invoice_number}
                                </p>
                            </div>
                            {invoice.company && (
                                <div className="text-right">
                                    <p className="font-semibold">{invoice.company.business_name}</p>
                                    <p className="text-sm text-p-color">RIF: {invoice.company.rif}</p>
                                    <p className="text-sm text-p-color">{invoice.company.fiscal_address}</p>
                                    {invoice.company.phone && (
                                        <p className="text-sm text-p-color">Tel: {invoice.company.phone}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Art. 4: Número de control */}
                        {/* Art. 6: Fecha y hora de emisión (DDMMYYYY - HH.MM.SS AM/PM) */}
                        <div className="grid grid-cols-4 gap-4 text-sm bg-[var(--palette-surface)] p-4 rounded-lg">
                            <div>
                                <p className="text-p-color opacity-75 text-xs uppercase">N° Control</p>
                                <p className="font-mono font-medium">{invoice.control_number}</p>
                            </div>
                            <div>
                                <p className="text-p-color opacity-75 text-xs uppercase">Fecha de Emisión</p>
                                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
                                <p className="text-xs text-p-color opacity-50">
                                    ({formatDateDisplay(invoice.issue_date)})
                                </p>
                            </div>
                            <div>
                                <p className="text-p-color opacity-75 text-xs uppercase">Hora de Emisión</p>
                                <p className="font-medium">{formatTime(invoice.issue_time)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-p-color opacity-75 text-xs uppercase">Estado</p>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {invoice.status === 'issued' ? 'Emitida' : invoice.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Art. 5: Rango de números de control */}
                    {invoice.control_number_range && (
                        <div className="bg-[var(--palette-surface)] p-3 rounded-lg mb-6 text-sm">
                            <p className="text-p-color opacity-75 text-xs uppercase mb-1">
                                Rango de Números de Control Asignados
                            </p>
                            <p className="font-medium">
                                Desde el N° {invoice.control_number_range.start_number.padStart(12, '0')}{' '}
                                hasta el N° {invoice.control_number_range.end_number.padStart(12, '0')}
                            </p>
                            {/* Art. 15: Fecha de asignación del número de control */}
                            <p className="text-xs text-p-color opacity-50 mt-1">
                                Fecha de asignación: {formatDateDisplay(invoice.control_number_range.assigned_date)}
                            </p>
                        </div>
                    )}

                    {/* Art. 7: Información del cliente */}
                    <div className="palette-surface palette-border border rounded-lg p-4 mb-6">
                        <h3 className="text-sm font-semibold text-p-color opacity-75 uppercase mb-3">
                            Datos del Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-p-color opacity-75 text-xs">Nombre / Razón Social</p>
                                <p className="font-medium">
                                    {invoice.client_business_name || 
                                     (invoice.client_document_type && invoice.client_document_number) ||
                                     invoice.client_rif || 
                                     'Cliente'}
                                </p>
                            </div>
                            <div>
                                <p className="text-p-color opacity-75 text-xs">
                                    RIF / Cédula / Pasaporte
                                </p>
                                <p className="font-medium">
                                    {invoice.client_document_type && invoice.client_document_number
                                        ? `${invoice.client_document_type}-${invoice.client_document_number}`
                                        : invoice.client_rif || 'N/A'}
                                </p>
                            </div>
                            {invoice.client_fiscal_address && (
                                <div className="col-span-2">
                                    <p className="text-p-color opacity-75 text-xs">Domicilio Fiscal</p>
                                    <p className="font-medium">{invoice.client_fiscal_address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Art. 8: Descripción de operaciones y precio */}
                    {/* Art. 9: Entrega de bienes (si aplica) */}
                    {invoice.lines && invoice.lines.length > 0 && (
                        <table className="w-full mb-6">
                            <thead>
                                <tr className="border-b-2 border-[var(--palette-border)] text-sm uppercase opacity-75">
                                    <th className="text-left py-3 font-semibold">Descripción</th>
                                    <th className="text-center py-3 font-semibold">Cant.</th>
                                    <th className="text-right py-3 font-semibold">Precio Unit.</th>
                                    <th className="text-right py-3 font-semibold">Alícuota</th>
                                    <th className="text-right py-3 font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines.map((line) => (
                                    <tr key={line.id} className="border-b border-[var(--palette-border)]">
                                        <td className="py-3">
                                            {line.description}
                                            {/* Art. 8: Operación exenta */}
                                            {line.is_exempt && (
                                                <span className="ml-2 text-xs text-p-color opacity-75">(E)</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-center">{line.quantity}</td>
                                        <td className="py-3 text-right">
                                            ${parseFloat(line.unit_price).toFixed(2)}
                                        </td>
                                        <td className="py-3 text-right text-p-color opacity-75">
                                            {line.tax_rate ? `${parseFloat(line.tax_rate).toFixed(2)}%` : '16%'}
                                        </td>
                                        <td className="py-3 text-right font-medium">
                                            ${parseFloat(line.line_total).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Art. 10: Ajustes (descuentos, bonificaciones) */}
                    {invoice.adjustments && invoice.adjustments.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-p-color opacity-75 uppercase mb-2">
                                Ajustes
                            </h4>
                            {invoice.adjustments.map((adj) => (
                                <div key={adj.id} className="flex justify-between py-1 text-sm">
                                    <span>{adj.description}</span>
                                    <span className="font-medium">
                                        {adj.adjustment_type === 'discount' ? '-' : ''}${parseFloat(adj.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Art. 11: Base imponible */}
                    {/* Art. 12: IVA discriminado */}
                    {/* Art. 13: Total de operaciones */}
                    <div className="flex justify-end mb-6">
                        <div className="w-80">
                            <div className="flex items-center justify-between py-2 border-b border-[var(--palette-border)]">
                                <span className="text-p-color opacity-75">Base Imponible</span>
                                <span className="font-medium">
                                    ${parseFloat(invoice.subtotal).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-[var(--palette-border)]">
                                <span className="text-p-color opacity-75">IVA (16%)</span>
                                <span className="font-medium">
                                    ${parseFloat(invoice.tax_total).toFixed(2)}
                                </span>
                            </div>
                            {invoice.discount_total && parseFloat(invoice.discount_total) > 0 && (
                                <div className="flex items-center justify-between py-2 border-b border-[var(--palette-border)]">
                                    <span className="text-p-color opacity-75">Descuentos</span>
                                    <span className="font-medium text-green-600">
                                        -${parseFloat(invoice.discount_total).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between py-3 bg-primary/10 px-3 rounded-lg mt-2">
                                <span className="font-bold text-primary">Total</span>
                                <span className="text-xl font-bold text-primary">
                                    ${parseFloat(invoice.total).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Información de pagos */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-[var(--palette-border)]">
                            <h3 className="text-sm font-semibold text-p-color opacity-75 uppercase mb-4">
                                Desglose de Pagos
                            </h3>
                            <div className="space-y-2">
                                {invoice.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between py-2 px-4 rounded-lg bg-[var(--palette-surface)]"
                                    >
                                        <div>
                                            <span className="font-medium capitalize">
                                                {payment.method_type?.replace('_', ' ') || 'Pago'}
                                            </span>
                                            <span className="text-sm text-p-color opacity-75 ml-2">
                                                ({formatDateDisplay(payment.created_at)})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">
                                                ${parseFloat(payment.amount).toFixed(2)}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    payment.status === 'completed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}
                                            >
                                                {payment.status === 'completed' ? 'Completado' : payment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Art. 14: Información de la imprenta digital autorizada */}
                    {invoice.control_number_range && (
                        <div className="mt-6 pt-6 border-t-2 border-[var(--palette-border)] text-xs text-p-color opacity-75">
                            <h4 className="font-semibold uppercase mb-2">
                                Imprenta Digital Autorizada
                            </h4>
                            <p>
                                {invoice.control_number_range.printer?.business_name || 'Imprenta'} | 
                                RIF: {invoice.control_number_range.printer?.rif || 'N/A'}
                            </p>
                            <p className="mt-1">
                                Providencia Administrativa: {invoice.control_number_range.printer?.authorization_providence || 'N/A'}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-[var(--palette-border)] text-center text-xs text-p-color opacity-60 print:block">
                        {invoice.company && (
                            <p>
                                {invoice.company.business_name} | RIF: {invoice.company.rif}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
