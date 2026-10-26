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
                    <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
                    <p className="text-sm text-danger dark:text-danger flex-1">{downloadError}</p>
                    <button onClick={onDismissDownloadError} className="text-danger hover:text-danger">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                    <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                    <input
                        type="text"
                        placeholder="Buscar por N° de factura, N° de control, RIF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 min-w-0 py-2.5 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-muted focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={onDownloadAll}
                        disabled={downloadingAll}
                        className="theme-button theme-button-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloadingAll ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generando ZIP...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Descargar todo (PDF)
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="theme-input !py-2 !px-3"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="issued">Emitida</option>
                            <option value="paid">Pagada</option>
                            <option value="partial">Parcial</option>
                            <option value="cancelled">Anulada</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-muted">Filas:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="theme-input !py-2 !px-3 !min-w-[60px]"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
