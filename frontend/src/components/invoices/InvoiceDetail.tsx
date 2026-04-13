import { Printer, X } from 'lucide-react';
import type { Invoice } from '../../data/invoice.types';

interface InvoiceDetailProps {
    invoice: Invoice;
    onBack: () => void;
    onPrint: () => void;
}

const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
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
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

export function InvoiceDetail({ invoice, onBack, onPrint }: InvoiceDetailProps) {
    return (
        <main className="p-8 print:p-0 print:overflow-visible">
            <div className="max-w-6xl mx-auto print:max-w-none print:mx-0">
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

                <div className="invoice-content palette-surface palette-border border rounded-xl p-8 print:shadow-none print:border-0 print:p-4 print:m-0 print:max-w-none">
                    {/* Art. 1-3: FACTURA + Emisor */}
                    <div className="border-b palette-border pb-6 mb-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4 print:flex-row print:flex-nowrap print:gap-8">
                            <div>
                                <h1 className="text-h1 font-bold text-primary">FACTURA</h1>
                                <p className="text-paragraph opacity-75 mt-1">N° {invoice.invoice_number}</p>
                            </div>
                            {invoice.company && (
                                <div className="text-right">
                                    <p className="font-semibold text-paragraph">{invoice.company.business_name} — RIF: {invoice.company.rif}</p>
                                    <p className="text-paragraph">{invoice.company.fiscal_address}</p>
                                    {invoice.company.phone && <p className="text-paragraph">Tel: {invoice.company.phone}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 palette-surface p-4 rounded-lg print:grid-cols-4 print:gap-2 print:p-2">
                            <div>
                                <p className="text-paragraph opacity-75 uppercase whitespace-nowrap">N° Control</p>
                                <p className="font-mono font-medium whitespace-nowrap">{invoice.control_number}</p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75 uppercase whitespace-nowrap">Fecha de Emisión</p>
                                <p className="font-medium whitespace-nowrap">{formatDate(invoice.issue_date)}</p>
                            </div>
                            <div>
                                <p className="text-paragraph opacity-75 uppercase whitespace-nowrap">Hora de Emisión</p>
                                <p className="font-medium whitespace-nowrap">{formatTime(invoice.issue_time)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-paragraph opacity-75 uppercase whitespace-nowrap">Estado</p>
                                <span className="px-2 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap print:bg-transparent print:text-black print:p-0">
                                    {invoice.status === 'issued' ? 'Emitida' : invoice.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Art. 7: Client info */}
                    <div className="palette-surface palette-border border rounded-lg p-4 mb-6 print:border-0 print:p-0">
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
                        <div className="overflow-x-auto print:overflow-visible">
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

                    {/* Art. 10-13: Adjustments + Totals */}
                    {invoice.subtotal && (
                        <div className="flex flex-col lg:flex-row gap-6 mb-6 print:flex-row">
                            {/* Adjustments */}
                            <div className="flex-1 print:w-1/2">
                                <h4 className="font-semibold text-paragraph opacity-75 uppercase mb-2">Ajustes</h4>
                                {invoice.adjustments && invoice.adjustments.length > 0 ? (
                                    invoice.adjustments.map((adj) => (
                                        <div key={adj.id} className="py-2">
                                            <p className="text-paragraph">{adj.description}</p>
                                            <p className="font-medium text-paragraph">
                                                {adj.adjustment_type === 'discount' ? '-' : ''}Bs. {parseFloat(adj.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-paragraph opacity-50 py-2">Ninguno</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="w-full sm:w-80 print:w-80 print:ml-auto">
                                <div className="flex items-center justify-between py-2 border-b palette-border">
                                    <span className="text-paragraph opacity-75">Base Imponible</span>
                                    <span className="font-medium text-paragraph">
                                        Bs. {parseFloat(invoice.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                <div className="flex items-center justify-between py-2 border-b palette-border">
                                    <span className="text-paragraph opacity-75">IVA</span>
                                    <span className="font-medium text-paragraph">
                                        Bs. {parseFloat(invoice.tax_total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 px-3 rounded-lg mt-2 bg-primary/10 print:bg-transparent">
                                    <span className="font-bold text-primary print:text-black">Total</span>
                                    <span className="text-h3 font-bold text-primary print:text-black">
                                        Bs. {parseFloat(invoice.total).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payments */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="mt-6 pt-6 border-t palette-border">
                            <h3 className="font-semibold text-paragraph opacity-75 uppercase mb-4">Desglose de Pagos</h3>
                            <div className="space-y-2">
                                {invoice.payments.map((payment) => (
                                    <div key={payment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 rounded-lg palette-surface palette-border border print:border-gray-300 print:break-inside-avoid">
                                        <span className="font-bold text-paragraph">
                                            {payment.method_type?.replace('_', ' ') || 'Pago'}
                                            {payment.card_brand && (
                                                <span className="font-semibold text-paragraph opacity-80"> — {payment.card_brand} {payment.card_last4 ? `****${payment.card_last4}` : ''}</span>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                            <span className="font-bold text-paragraph">
                                                Bs. {parseFloat(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium print:bg-transparent print:text-black ${payment.status === 'completed'
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

                    {/* Art. 14: Imprenta + Control Number Range */}
                    {(invoice.control_number_range?.printer || invoice.control_number_range) && (
                        <div className="mt-6 pt-6 border-t palette-border grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                            {/* Left: Imprenta Digital Autorizada */}
                            {invoice.control_number_range?.printer && (
                                <div>
                                    <p className="text-paragraph text-sm">
                                        {invoice.control_number_range.printer.business_name || 'Imprenta'} |
                                        RIF: {invoice.control_number_range.printer.rif || 'N/A'}
                                    </p>
                                    <p className="mt-1 text-paragraph text-sm">
                                        Providencia Administrativa: {invoice.control_number_range.printer.authorization_providence || 'N/A'}
                                    </p>
                                </div>
                            )}

                            {/* Right: Rango de Números de Control */}
                            {invoice.control_number_range && (
                                <div className="text-right text-sm">
                                    <p className="font-medium">
                                        Rango de Números de Control: desde el N° {invoice.control_number_range.start_number.padStart(12, '0')}
                                        {' '}hasta el N° {invoice.control_number_range.end_number.padStart(12, '0')}
                                    </p>
                                    <p className="mt-1">
                                        Fecha de asignación: {formatDateDisplay(invoice.control_number_range.assigned_date)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}