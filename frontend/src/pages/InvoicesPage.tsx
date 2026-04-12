import { useState, useEffect, useMemo } from 'react';
import type { Invoice, InvoiceSummary, SortableColumn } from '../data/invoice.types';
import { fetchSummary, fetchInvoices, fetchInvoiceDetails, downloadAllInvoices } from '../lib/invoiceApi';
import {
    InvoiceSummaryCards,
    InvoiceControls,
    InvoiceTable,
    InvoicePagination,
    InvoiceDetail,
} from '../components/invoices';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<InvoiceSummary | null>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<SortableColumn>('issue_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchSummary().then(setSummary);
        fetchInvoices(currentPage, pageSize).then((res) => {
            if (res) {
                setInvoices(res.invoices);
                setTotalPages(res.totalPages);
                setCurrentPage(res.page);
            }
            setLoading(false);
        });
    }, []);

    const handlePageChange = async (page: number) => {
        setLoading(true);
        const res = await fetchInvoices(page, pageSize);
        if (res) {
            setInvoices(res.invoices);
            setTotalPages(res.totalPages);
            setCurrentPage(res.page);
        }
        setLoading(false);
    };

    const handlePageSizeChange = async (size: number) => {
        setPageSize(size);
        await handlePageChange(1);
    };

    const handleViewDetails = async (invoice: Invoice) => {
        const details = await fetchInvoiceDetails(invoice.id);
        if (details) setSelectedInvoice(details);
    };

    const handleDownloadAll = async () => {
        setDownloadingAll(true);
        setDownloadError(null);
        await downloadAllInvoices((msg) => {
            setDownloadError(msg);
            setTimeout(() => setDownloadError(null), 5000);
        });
        setDownloadingAll(false);
    };

    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...invoices];
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(
                (inv) =>
                    inv.invoice_number.toLowerCase().includes(search) ||
                    inv.control_number.toLowerCase().includes(search) ||
                    inv.client_rif?.toLowerCase().includes(search) ||
                    inv.client_business_name?.toLowerCase().includes(search)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter((inv) => inv.status === statusFilter);
        }
        result.sort((a, b) => {
            if (sortColumn === 'issue_date' || sortColumn === 'created_at') {
                const aDate = new Date(a[sortColumn] as string).getTime();
                const bDate = new Date(b[sortColumn] as string).getTime();
                return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
            } else if (sortColumn === 'total') {
                return sortDirection === 'asc'
                    ? parseFloat(a.total) - parseFloat(b.total)
                    : parseFloat(b.total) - parseFloat(a.total);
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
                    onPrint={() => window.print()}
                />
            ) : (
                <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-h1 font-bold mb-1">My Invoices</h1>
                        <p className="text-paragraph mb-6">View, search, and download all your purchase invoices.</p>

                        {summary && <InvoiceSummaryCards summary={summary} />}

                        <InvoiceControls
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            pageSize={pageSize}
                            onPageSizeChange={handlePageSizeChange}
                            downloadingAll={downloadingAll}
                            downloadError={downloadError}
                            onDownloadAll={handleDownloadAll}
                            onDismissDownloadError={() => setDownloadError(null)}
                        />

                        <InvoiceTable
                            invoices={filteredAndSortedInvoices}
                            onViewDetails={handleViewDetails}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={(col) => {
                                if (sortColumn === col) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                                else { setSortColumn(col); setSortDirection('asc'); }
                            }}
                        />

                        <InvoicePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalItems={filteredAndSortedInvoices.length}
                        />
                    </div>
                </main>
            )}
        </div>
    );
}
