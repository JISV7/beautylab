import { AlertTriangle, Download, Filter, Loader2, Search, X } from 'lucide-react';

interface InvoiceControlsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    downloadingAll: boolean;
    downloadError: string | null;
    onDownloadAll: () => void;
    onDismissDownloadError: () => void;
}

export function InvoiceControls({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    pageSize,
    onPageSizeChange,
    downloadingAll,
    downloadError,
    onDownloadAll,
    onDismissDownloadError,
}: InvoiceControlsProps) {
    return (
        <div className="palette-surface palette-border border rounded-xl p-4 mb-6 print:hidden">
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
    );
}
