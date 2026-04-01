import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, X, Printer } from 'lucide-react';

const API_URL = 'http://localhost:8000';

interface InvoiceLine {
    id: number;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
}

interface Payment {
    id: string;
    amount: string;
    status: string;
    createdAt: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    controlNumber: string;
    issueDate: string;
    issueTime: string;
    total: string;
    status: string;
    clientRif?: string;
    clientBusinessName?: string;
    lines?: InvoiceLine[];
    payments?: Payment[];
    createdAt: string;
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
    currentPage,
    totalPages,
    onPageChange,
    onViewDetails,
}: {
    invoices: Invoice[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onViewDetails: (invoice: Invoice) => void;
}) {
    return (
        <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-primary mb-6">My Invoices</h2>

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
                                            <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                                            <td className="p-4 font-mono text-sm">{invoice.controlNumber}</td>
                                            <td className="p-4">
                                                {new Date(invoice.issueDate).toLocaleDateString()}
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
    return (
        <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
            <div className="max-w-4xl mx-auto">
                {/* Header Actions - Hidden on Print */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-p-color hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                        Back to Invoices
                    </button>
                    <button
                        onClick={onPrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                </div>

                {/* Invoice Content */}
                <div className="palette-surface palette-border border rounded-xl p-8 print:shadow-none print:border-0">
                    {/* Invoice Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--palette-border)]">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
                            <p className="text-p-color opacity-75 mt-1">
                                {invoice.invoiceNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-p-color opacity-75">Issue Date</p>
                            <p className="font-medium">
                                {new Date(invoice.issueDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Invoice Details Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-sm font-semibold text-p-color opacity-75 uppercase mb-2">
                                Bill To
                            </h3>
                            <p className="font-medium">
                                {invoice.clientBusinessName || 'Customer'}
                            </p>
                            {invoice.clientRif && (
                                <p className="text-p-color text-sm">RIF: {invoice.clientRif}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <h3 className="text-sm font-semibold text-p-color opacity-75 uppercase mb-2">
                                Control Number
                            </h3>
                            <p className="font-mono text-lg">{invoice.controlNumber}</p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    {invoice.lines && invoice.lines.length > 0 && (
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b border-[var(--palette-border)] text-sm uppercase opacity-75">
                                    <th className="text-left py-3 font-semibold">Description</th>
                                    <th className="text-center py-3 font-semibold">Qty</th>
                                    <th className="text-right py-3 font-semibold">Unit Price</th>
                                    <th className="text-right py-3 font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines.map((line) => (
                                    <tr key={line.id} className="border-b border-[var(--palette-border)]">
                                        <td className="py-3">{line.description}</td>
                                        <td className="py-3 text-center">{line.quantity}</td>
                                        <td className="py-3 text-right">
                                            ${parseFloat(line.unitPrice).toFixed(2)}
                                        </td>
                                        <td className="py-3 text-right font-medium">
                                            ${parseFloat(line.lineTotal).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64">
                            <div className="flex items-center justify-between py-2 border-b border-[var(--palette-border)]">
                                <span className="text-p-color opacity-75">Total</span>
                                <span className="text-xl font-bold text-primary">
                                    ${parseFloat(invoice.total).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[var(--palette-border)]">
                            <h3 className="text-sm font-semibold text-p-color opacity-75 uppercase mb-4">
                                Payment Information
                            </h3>
                            <div className="space-y-2">
                                {invoice.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between py-2 px-4 rounded-lg bg-[var(--palette-surface)]"
                                    >
                                        <span className="text-sm">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </span>
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
                                            {payment.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-[var(--palette-border)] text-center text-sm text-p-color opacity-60 print:hidden">
                        <p>Thank you for your purchase!</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
