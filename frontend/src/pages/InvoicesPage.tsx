import { useState, useEffect, useMemo, useCallback } from 'react';
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
    const [summary, setSummary] = useState<InvoiceSummary | null>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<SortableColumn>('issue_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [summaryData, invoicesData] = await Promise.all([
                fetchSummary(),
                fetchInvoices(currentPage, pageSize)
            ]);
            setSummary(summaryData);
            if (invoicesData) {
                setInvoices(invoicesData.invoices);
                // Only set current page if it differs from the response to avoid infinite loop
                if (invoicesData.page !== currentPage) {
                    setCurrentPage(invoicesData.page);
                }
            }
        } catch (error) {
            console.error('Failed to fetch invoice data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (val: string) => {
        setStatusFilter(val);
        setCurrentPage(1);
    };

    const handlePageChange = async (page: number) => {
        setLoading(true);
        const res = await fetchInvoices(page, pageSize);
        if (res) {
            setInvoices(res.invoices);
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
        <div className="palette-background text-paragraph print:block">
            {selectedInvoice ? (
                <InvoiceDetail
                    invoice={selectedInvoice}
                    onBack={() => setSelectedInvoice(null)}
                    onPrint={() => window.print()}
                />
            ) : (
                <main className="p-8 print:p-0 print:overflow-visible">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-h1 font-bold mb-1">My Invoices</h1>
                        <p className="text-paragraph mb-6">View, search, and download all your purchase invoices.</p>

                        {summary && <InvoiceSummaryCards summary={summary} />}

                        <InvoiceControls
                            searchTerm={searchTerm}
                            setSearchTerm={handleSearchChange}
                            statusFilter={statusFilter}
                            setStatusFilter={handleStatusFilterChange}
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
                            totalPages={Math.max(1, Math.ceil(filteredAndSortedInvoices.length / pageSize))}
                            onPageChange={handlePageChange}
                            totalItems={filteredAndSortedInvoices.length}
                        />
                    </div>
                </main>
            )}
        </div>
    );
}
