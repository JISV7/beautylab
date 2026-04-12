import { Printer, X } from 'lucide-react';
import type { Invoice } from '../../data/invoice.types';

interface InvoiceDetailProps {
    invoice: Invoice;
    onBack: () => void;
    onPrint: () => void;
}

export function InvoiceDetail({ invoice, onBack, onPrint }: InvoiceDetailProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}${month}${year}`;
    };

    const formatTime = (timeStr: string) => {
        const date = new Date(`2000-01-01T${timeStr}`);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}.${minutes}.${seconds} ${ampm}`;
    };

    const formatDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
            <style>{`
                @media print {
                    aside, header, nav { display: none !important; }
                    [class*="sidebar"], [class*="header"], [class*="nav"],
                    [class*="search"], [class*="theme-toggle"], [class*="user-menu"] { display: none !important; }
                    button, .theme-button { display: none !important; }
                    .invoice-content, .invoice-content * { visibility: visible !important; }
                    .invoice-content { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; max-width: none !important; }
                }
            `}</style>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button onClick={onBack} className="flex items-center gap-2 theme-button theme-button-secondary">
                        <X className="w-5 h-5" />
                        Volver a Facturas
                    </button>
                    <button onClick={onPrint} className="flex items-center gap-2 px-4 py-2 rounded-lg theme-button theme-button-primary">
                        <Printer className="w-4 h-4" />
                        Imprimir Factura
                    </button>
                </div>

                <div className="invoice-content palette-surface palette-border border rounded-xl p-8 print:shadow-none print:border-0 print:p-4">
                    {/* Art. 1-3: FACTURA + Emisor */}
                    <div className="border-b-2 palette-border pb-6 mb-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                            <div>
                                <h1 className="text-h1 font-bold text-primary">FACTURA</h1>
                                <p className="text-paragraph opacity-75 mt-1">N° {invoice.invoice_number}</p>
                            </div>
                            {invoice.company && (
                                <div className="text-right">
                                    <p className="font-semibold text-paragraph">{invoice.company.business_name}</p>
                                    <p className="text-paragraph">RIF: {invoice.company.rif}</p>
                                    <p className="text-paragraph">{invoice.company.fiscal_address}</p>
                                    {invoice.company.phone && <p className="text-paragraph">Tel: {invoice.company.phone}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 palette-surface p-4 rounded-lg">
                            <div>
                                <p className="text-paragraph opacity-75 uppercase">N° Control</p>
                                <p className="font-mono font-medium">{invoice.control_number}</p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75 uppercase">Fecha de Emisión</p>
                                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
                                <p className="text-paragraph opacity-50">({formatDateDisplay(invoice.issue_date)})</p>
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

                    {/* Art. 5 + 15: Control number range */}
                    {invoice.control_number_range && (
                        <div className="palette-surface p-3 rounded-lg mb-6">
                            <p className="text-paragraph opacity-75 uppercase mb-1">Rango de Números de Control Asignados</p>
                            <p className="font-medium">
                                Desde el N° {invoice.control_number_range.start_number.padStart(12, '0')}{' '}
                                hasta el N° {invoice.control_number_range.end_number.padStart(12, '0')}
                            </p>
                            <p className="text-paragraph opacity-50 mt-1">
                                Fecha de asignación: {formatDateDisplay(invoice.control_number_range.assigned_date)}
                            </p>
                        </div>
                    )}

                    {/* Art. 7: Client info */}
                    <div className="palette-surface palette-border border rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-paragraph opacity-75 uppercase mb-3">Datos del Cliente</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-paragraph opacity-75">Nombre / Razón Social</p>
                                <p className="font-medium">
                                    {invoice.client_business_name || (invoice.client_document_type && invoice.client_document_number) || invoice.client_rif || 'Cliente'}
                                </p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75">RIF / Cédula / Pasaporte</p>
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

                    {/* Art. 8-9: Line items */}
                    {invoice.lines && invoice.lines.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full mb-6 min-w-[500px]">
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
                                                {line.is_exempt && <span className="ml-2 text-paragraph opacity-75">(E)</span>}
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
                        </div>
                    )}

                    {/* Art. 10: Adjustments */}
                    {invoice.adjustments && invoice.adjustments.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-paragraph opacity-75 uppercase mb-2">Ajustes</h4>
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

                    {/* Art. 11-13: Totals */}
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

                    {/* Payments */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="mt-6 pt-6 border-t palette-border">
                            <h3 className="font-semibold text-paragraph opacity-75 uppercase mb-4">Desglose de Pagos</h3>
                            <div className="space-y-2">
                                {invoice.payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between py-2 px-4 rounded-lg palette-surface">
                                        <div>
                                            <span className="font-medium capitalize text-paragraph">
                                                {payment.method_type?.replace('_', ' ') || 'Pago'}
                                            </span>
                                            {payment.card_brand && (
                                                <span className="text-paragraph opacity-75 block">
                                                    {payment.card_brand}{payment.card_last4 && ` •••• ${payment.card_last4}`}
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
                                            <span className={`px-2 py-1 rounded-full font-medium ${
                                                payment.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                                {payment.status === 'completed' ? 'Completado' : payment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Art. 14: Imprenta */}
                    {invoice.control_number_range && (
                        <div className="mt-6 pt-6 border-t palette-border">
                            <h4 className="font-semibold text-paragraph opacity-75 uppercase mb-2">Imprenta Digital Autorizada</h4>
                            <p className="text-paragraph">
                                {invoice.control_number_range.printer?.business_name || 'Imprenta'} |
                                RIF: {invoice.control_number_range.printer?.rif || 'N/A'}
                            </p>
                            <p className="mt-1 text-paragraph">
                                Providencia Administrativa: {invoice.control_number_range.printer?.authorization_providence || 'N/A'}
                            </p>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t palette-border text-center text-paragraph opacity-60 print:block">
                        {invoice.company && <p>{invoice.company.business_name} | RIF: {invoice.company.rif}</p>}
                    </div>
                </div>
            </div>
        </main>
    );
}
