import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FileText, X, Printer, DollarSign, Receipt, Percent, Search, Filter, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Download, Loader2, AlertTriangle } from 'lucide-react';

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
    card_last4?: string;
    card_brand?: string;
    card_holder_name?: string;
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
    // Payment progress (calculated by backend)
    total_paid?: string;
    remaining_balance?: string;
    payment_progress?: number;
}

interface InvoiceSummary {
    total_invoices: number;
    total_subtotal: string;
    total_iva: string;
    total_paid: string;
}

type SortableColumn = 'invoice_number' | 'control_number' | 'issue_date' | 'total' | 'status' | 'created_at';

interface InvoicesResponse {
    invoices: Invoice[];
    total: number;
    page: number;
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
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<InvoiceSummary | null>(null);

    // Download all state
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    // Search, filter, and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<SortableColumn>('issue_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
            const response = await api.get<InvoicesResponse>(`/invoices/?page=${page}&page_size=${pageSize}`);
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

    const handleDownloadAll = async () => {
        try {
            setDownloadingAll(true);
            setDownloadError(null);
            const response = await api.get('/invoices/download-all', {
                responseType: 'blob',
            });
            // Create a blob and trigger download
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            // Extract filename from Content-Disposition header
            const disposition = response.headers['content-disposition'];
            const match = disposition?.match(/filename="?(.+?)"?$/i);
            const filename = match ? match[1] : 'facturas_beautylab.zip';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Failed to download all invoices:', err);
            setDownloadError(err.response?.data?.detail || 'Failed to download invoices. Please try again.');
            setTimeout(() => setDownloadError(null), 5000);
        } finally {
            setDownloadingAll(false);
        }
    };

    // Filter and sort invoices
    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...invoices];
        
        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(invoice => 
                invoice.invoice_number.toLowerCase().includes(search) ||
                invoice.control_number.toLowerCase().includes(search) ||
                invoice.client_rif?.toLowerCase().includes(search) ||
                invoice.client_business_name?.toLowerCase().includes(search)
            );
        }
        
        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(invoice => invoice.status === statusFilter);
        }
        
        // Sort
        result.sort((a, b) => {
            if (sortColumn === 'issue_date' || sortColumn === 'created_at') {
                const aDate = new Date(a[sortColumn] as string).getTime();
                const bDate = new Date(b[sortColumn] as string).getTime();
                return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
            } else if (sortColumn === 'total') {
                const aTotal = parseFloat(a.total as string);
                const bTotal = parseFloat(b.total as string);
                return sortDirection === 'asc' ? aTotal - bTotal : bTotal - aTotal;
            } else {
                const aStr = String(a[sortColumn]).toLowerCase();
                const bStr = String(b[sortColumn]).toLowerCase();
                if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
                if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            }
        });
        
        return result;
    }, [invoices, searchTerm, statusFilter, sortColumn, sortDirection]);

    if (loading && invoices.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-paragraph">Loading invoices...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen palette-background text-paragraph print:block print:h-auto">
            {selectedInvoice ? (
                <InvoiceDetail
                    invoice={selectedInvoice}
                    onBack={() => setSelectedInvoice(null)}
                    onPrint={handlePrint}
                />
            ) : (
                <InvoiceList
                    invoices={filteredAndSortedInvoices}
                    summary={summary}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={fetchInvoices}
                    onPageSizeChange={(size) => { setPageSize(size); fetchInvoices(1); }}
                    onViewDetails={(invoice) => fetchInvoiceDetails(invoice.id)}
                    onDownloadAll={handleDownloadAll}
                    onDismissDownloadError={() => setDownloadError(null)}
                    downloadingAll={downloadingAll}
                    downloadError={downloadError}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortColumn={sortColumn}
                    setSortColumn={setSortColumn}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
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
    pageSize,
    onPageChange,
    onPageSizeChange,
    onViewDetails,
    onDownloadAll,
    onDismissDownloadError,
    downloadingAll,
    downloadError,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
}: {
    invoices: Invoice[];
    summary: InvoiceSummary | null;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onViewDetails: (invoice: Invoice) => void;
    onDownloadAll: () => void;
    onDismissDownloadError: () => void;
    downloadingAll: boolean;
    downloadError: string | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    sortColumn: SortableColumn;
    setSortColumn: (column: SortableColumn) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
}) {
    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }: { column: SortableColumn }) => {
        if (sortColumn !== column) return <span className="w-4 h-4 ml-1 opacity-0"></span>;
        return (
            <ChevronDown
                className={`w-4 h-4 ml-1 transition-transform ${
                    sortDirection === 'asc' ? 'rotate-180' : ''
                }`}
            />
        );
    };

    return (
        <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-h1 font-bold mb-1">My Invoices</h1>
                <p className="text-paragraph mb-6">
                    View, search, and download all your purchase invoices.
                </p>

                {/* Summary Cards */}
                {summary && (
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
                                    Bs. {parseFloat(summary.total_subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                        <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                            <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <div>
                                <p className="text-sm text-paragraph opacity-75">Total IVA (16%)</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    Bs. {parseFloat(summary.total_iva).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                        <div className="palette-surface palette-border border rounded-xl p-4 flex items-center gap-4">
                            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            <div>
                                <p className="text-sm text-paragraph opacity-75">Total Paid</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    Bs. {parseFloat(summary.total_paid).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls - Search, Filter, Sort */}
                <div className="palette-surface palette-border border rounded-xl p-4 mb-6 print:hidden">
                    {/* Download error banner */}
                    {downloadError && (
                        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400 flex-1">{downloadError}</p>
                            <button onClick={onDismissDownloadError} className="text-red-400 hover:text-red-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Download All Button */}
                        <button
                            onClick={onDownloadAll}
                            disabled={downloadingAll}
                            className="theme-button theme-button-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloadingAll ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating ZIP...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download All (PDF)
                                </>
                            )}
                        </button>

                        {/* Search */}
                        <div className="flex-1 min-w-64">
                            <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                                <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                                <input
                                    type="text"
                                    placeholder="Search by invoice #, control #, RIF..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-paragraph placeholder:opacity-60 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-paragraph opacity-50" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="theme-input min-w-32"
                            >
                                <option value="all">All Status</option>
                                <option value="issued">Issued</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-paragraph opacity-75 whitespace-nowrap">Rows:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="theme-input min-w-20"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-paragraph">No invoices found.</p>
                        <p className="text-paragraph opacity-75 text-sm mt-2">
                            When you purchase a course, your invoices will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="palette-surface rounded-lg shadow-sm palette-border overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="palette-surface border-b palette-border text-paragraph text-sm uppercase tracking-wider opacity-75">
                                        <th 
                                            className="p-4 font-semibold cursor-pointer btn-hover-surface transition-colors"
                                            onClick={() => handleSort('invoice_number')}
                                        >
                                            <div className="flex items-center">
                                                Invoice #
                                                <SortIcon column="invoice_number" />
                                            </div>
                                        </th>
                                        <th 
                                            className="p-4 font-semibold cursor-pointer btn-hover-surface transition-colors"
                                            onClick={() => handleSort('control_number')}
                                        >
                                            <div className="flex items-center">
                                                Control #
                                                <SortIcon column="control_number" />
                                            </div>
                                        </th>
                                        <th 
                                            className="p-4 font-semibold cursor-pointer btn-hover-surface transition-colors"
                                            onClick={() => handleSort('issue_date')}
                                        >
                                            <div className="flex items-center">
                                                Date
                                                <SortIcon column="issue_date" />
                                            </div>
                                        </th>
                                        <th 
                                            className="p-4 font-semibold cursor-pointer btn-hover-surface transition-colors"
                                            onClick={() => handleSort('total')}
                                        >
                                            <div className="flex items-center">
                                                Total
                                                <SortIcon column="total" />
                                            </div>
                                        </th>
                                        <th 
                                            className="p-4 font-semibold cursor-pointer btn-hover-surface transition-colors"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Status
                                                <SortIcon column="status" />
                                            </div>
                                        </th>
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
                                            <td className="p-4">
                                                {new Date(invoice.issue_date).toLocaleDateString()}
                                            </td>
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
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        invoice.status === 'paid'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : invoice.status === 'partial'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                            : invoice.status === 'cancelled'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}
                                                >
                                                    {invoice.status === 'paid' ? 'Paid' : 
                                                     invoice.status === 'partial' ? 'Partial' :
                                                     invoice.status === 'cancelled' ? 'Cancelled' : 'Issued'}
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
                            <div className="flex items-center justify-between gap-4 mt-6 print:hidden">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onPageChange(1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="First page"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onPageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Previous page"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <span className="text-paragraph">
                                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                                </span>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onPageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Next page"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onPageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border palette-border btn-hover-surface disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
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
            {/* Print Styles */}
            <style>{`
                @media print {
                    /* Hide sidebar, header, and navigation */
                    aside, header, nav {
                        display: none !important;
                    }
                    /* Hide elements with specific classes */
                    [class*="sidebar"], [class*="header"], [class*="nav"], 
                    [class*="search"], [class*="theme-toggle"], [class*="user-menu"] {
                        display: none !important;
                    }
                    /* Hide all buttons */
                    button, .theme-button {
                        display: none !important;
                    }
                    /* Show only invoice content */
                    .invoice-content, .invoice-content * {
                        visibility: visible !important;
                    }
                    /* Remove borders and shadows for clean print */
                    .invoice-content {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: none !important;
                    }
                }
            `}</style>
            <div className="max-w-6xl mx-auto">
                {/* Header Actions - Hidden on Print */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 theme-button theme-button-secondary"
                    >
                        <X className="w-5 h-5" />
                        Volver a Facturas
                    </button>
                    <button
                        onClick={onPrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg theme-button theme-button-primary"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Factura
                    </button>
                </div>

                {/* Invoice Content - Venezuelan Compliance (Art. 7) */}
                <div className="invoice-content palette-surface palette-border border rounded-xl p-8 print:shadow-none print:border-0 print:p-4">
                    {/* Art. 1: Denominación del documento "FACTURA" */}
                    {/* Art. 2: Numeración consecutiva y única */}
                    {/* Art. 3: Emisor info */}
                    <div className="border-b-2 palette-border pb-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-h1 font-bold text-primary">FACTURA</h1>
                                <p className="text-paragraph opacity-75 mt-1">
                                    N° {invoice.invoice_number}
                                </p>
                            </div>
                            {invoice.company && (
                                <div className="text-right">
                                    <p className="font-semibold text-paragraph">{invoice.company.business_name}</p>
                                    <p className="text-paragraph">RIF: {invoice.company.rif}</p>
                                    <p className="text-paragraph">{invoice.company.fiscal_address}</p>
                                    {invoice.company.phone && (
                                        <p className="text-paragraph">Tel: {invoice.company.phone}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Art. 4: Número de control */}
                        {/* Art. 6: Fecha y hora de emisión (DDMMYYYY - HH.MM.SS AM/PM) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 palette-surface p-4 rounded-lg">
                            <div>
                                <p className="text-paragraph opacity-75 uppercase">N° Control</p>
                                <p className="font-mono font-medium">{invoice.control_number}</p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75 uppercase">Fecha de Emisión</p>
                                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
                                <p className="text-paragraph opacity-50">
                                    ({formatDateDisplay(invoice.issue_date)})
                                </p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75 uppercase">Hora de Emisión</p>
                                <p className="font-medium">{formatTime(invoice.issue_time)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-paragraph opacity-75 uppercase">Estado</p>
                                <span className="px-2 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {invoice.status === 'issued' ? 'Emitida' : invoice.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Art. 5: Rango de números de control */}
                    {invoice.control_number_range && (
                        <div className="palette-surface p-3 rounded-lg mb-6">
                            <p className="text-paragraph opacity-75 uppercase mb-1">
                                Rango de Números de Control Asignados
                            </p>
                            <p className="font-medium">
                                Desde el N° {invoice.control_number_range.start_number.padStart(12, '0')}{' '}
                                hasta el N° {invoice.control_number_range.end_number.padStart(12, '0')}
                            </p>
                            <p className="text-paragraph opacity-50 mt-1">
                                Fecha de asignación: {formatDateDisplay(invoice.control_number_range.assigned_date)}
                            </p>
                        </div>
                    )}

                    {/* Art. 7: Información del cliente */}
                    <div className="palette-surface palette-border border rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-paragraph opacity-75 uppercase mb-3">
                            Datos del Cliente
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-paragraph opacity-75">Nombre / Razón Social</p>
                                <p className="font-medium">
                                    {invoice.client_business_name ||
                                     (invoice.client_document_type && invoice.client_document_number) ||
                                     invoice.client_rif ||
                                     'Cliente'}
                                </p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75">
                                    RIF / Cédula / Pasaporte
                                </p>
                                <p className="font-medium">
                                    {invoice.client_document_type && invoice.client_document_number
                                        ? `${invoice.client_document_type}-${invoice.client_document_number}`
                                        : invoice.client_rif || 'N/A'}
                                </p>
                            </div>
                            {invoice.client_fiscal_address && (
                                <div className="sm:col-span-2">
                                    <p className="text-paragraph opacity-75">Domicilio Fiscal</p>
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
                                <tr className="border-b-2 palette-border text-paragraph uppercase opacity-75">
                                    <th className="text-left py-3 font-semibold">Descripción</th>
                                    <th className="text-center py-3 font-semibold">Cant.</th>
                                    <th className="text-right py-3 font-semibold">Precio Unit.</th>
                                    <th className="text-right py-3 font-semibold">Alícuota</th>
                                    <th className="text-right py-3 font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines.map((line) => (
                                    <tr key={line.id} className="border-b palette-border">
                                        <td className="py-3">
                                            {line.description}
                                            {line.is_exempt && (
                                                <span className="ml-2 text-paragraph opacity-75">(E)</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-center">{line.quantity}</td>
                                        <td className="py-3 text-right">
                                            Bs. {parseFloat(line.unit_price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 text-right text-paragraph opacity-75">
                                            {line.tax_rate ? `${parseFloat(line.tax_rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '16%'}
                                        </td>
                                        <td className="py-3 text-right font-medium">
                                            Bs. {parseFloat(line.line_total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Art. 10: Ajustes (descuentos, bonificaciones) */}
                    {invoice.adjustments && invoice.adjustments.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-paragraph opacity-75 uppercase mb-2">
                                Ajustes
                            </h4>
                            {invoice.adjustments.map((adj) => (
                                <div key={adj.id} className="flex justify-between py-1">
                                    <span className="text-paragraph">{adj.description}</span>
                                    <span className="font-medium text-paragraph">
                                        {adj.adjustment_type === 'discount' ? '-' : ''}Bs. {parseFloat(adj.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Art. 11: Base imponible */}
                    {/* Art. 12: IVA discriminado */}
                    {/* Art. 13: Total de operaciones */}
                    <div className="flex justify-end mb-6">
                        <div className="w-full sm:w-80">
                            <div className="flex items-center justify-between py-2 border-b palette-border">
                                <span className="text-paragraph opacity-75">Base Imponible</span>
                                <span className="font-medium text-paragraph">
                                    Bs. {parseFloat(invoice.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b palette-border">
                                <span className="text-paragraph opacity-75">IVA (16%)</span>
                                <span className="font-medium text-paragraph">
                                    Bs. {parseFloat(invoice.tax_total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            {invoice.discount_total && parseFloat(invoice.discount_total) > 0 && (
                                <div className="flex items-center justify-between py-2 border-b palette-border">
                                    <span className="text-paragraph opacity-75">Descuentos</span>
                                    <span className="font-medium text-green-600">
                                        -Bs. {parseFloat(invoice.discount_total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between py-3 px-3 rounded-lg mt-2 bg-primary/10">
                                <span className="font-bold text-primary">Total</span>
                                <span className="text-h3 font-bold text-primary">
                                    Bs. {parseFloat(invoice.total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Información de pagos */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="mt-6 pt-6 border-t palette-border">
                            <h3 className="font-semibold text-paragraph opacity-75 uppercase mb-4">
                                Desglose de Pagos
                            </h3>
                            <div className="space-y-2">
                                {invoice.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between py-2 px-4 rounded-lg palette-surface"
                                    >
                                        <div>
                                            <span className="font-medium capitalize text-paragraph">
                                                {payment.method_type?.replace('_', ' ') || 'Pago'}
                                            </span>
                                            {payment.card_brand && (
                                                <span className="text-paragraph opacity-75 block">
                                                    {payment.card_brand}
                                                    {payment.card_last4 && ` •••• ${payment.card_last4}`}
                                                </span>
                                            )}
                                            <span className="text-paragraph opacity-50">
                                                ({formatDateDisplay(payment.created_at)})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-paragraph">
                                                Bs. {parseFloat(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-full font-medium ${
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
                        <div className="mt-6 pt-6 border-t palette-border">
                            <h4 className="font-semibold text-paragraph opacity-75 uppercase mb-2">
                                Imprenta Digital Autorizada
                            </h4>
                            <p className="text-paragraph">
                                {invoice.control_number_range.printer?.business_name || 'Imprenta'} |
                                RIF: {invoice.control_number_range.printer?.rif || 'N/A'}
                            </p>
                            <p className="mt-1 text-paragraph">
                                Providencia Administrativa: {invoice.control_number_range.printer?.authorization_providence || 'N/A'}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t palette-border text-center text-paragraph opacity-60 print:block">
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
