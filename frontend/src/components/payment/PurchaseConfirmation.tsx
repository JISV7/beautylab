import React from 'react';
import { CheckCircle, Mail, BookOpen, ArrowRight, Receipt, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export interface PaymentBreakdown {
    method: string;
    amount: string;
    reference?: string;
}

export interface PurchaseConfirmationProps {
    invoiceNumber: string;
    courseName: string;
    totalPaid: string;
    issueDate: string;
    items?: Array<{
        description: string;
        quantity: string;
        unit_price: string;
        line_total: string;
    }>;
    paymentBreakdown?: PaymentBreakdown[];
    userEmail?: string;
    onGoToDashboard?: () => void;
    onViewCourses?: () => void;
}

export const PurchaseConfirmation: React.FC<PurchaseConfirmationProps> = ({
    invoiceNumber,
    courseName,
    totalPaid,
    issueDate,
    items = [],
    paymentBreakdown = [],
    userEmail,
    onGoToDashboard,
    onViewCourses,
}) => {
    return (
        <div className="max-w-3xl mx-auto">
            {/* Success Banner */}
            <div className="palette-surface palette-border border rounded-xl p-8 mb-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-white" />
                </div>
                <h1 className="text-h1 mb-2">
                    ¡Compra realizada con éxito!
                </h1>
                <p className="text-paragraph opacity-80">
                    Tu inscripción ha sido confirmada. Enviamos el comprobante a tu correo electrónico.
                </p>
                {userEmail && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-paragraph opacity-60">
                        <Mail size={14} />
                        <span>{userEmail}</span>
                    </div>
                )}
            </div>

            {/* Course Info Card */}
            <div className="palette-surface palette-border border rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--palette-primary)] flex items-center justify-center flex-shrink-0">
                        <BookOpen size={24} className="text-white decorator-color" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-h3 mb-1">
                            {courseName}
                        </h2>
                        <p className="text-paragraph opacity-60">
                            Ya tienes acceso a este curso y a todos sus materiales.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={onViewCourses}
                        className="theme-button theme-button-primary flex-1"
                    >
                        <BookOpen size={18} />
                        <span>Comenzar a aprender</span>
                    </button>
                    <button
                        onClick={onGoToDashboard}
                        className="theme-button theme-button-secondary flex-1"
                    >
                        <span>Ir al panel</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="palette-surface palette-border border rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Receipt size={24} className="text-[var(--palette-primary)]" />
                    <h2 className="text-h4 font-semibold">
                        Detalles de la factura
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-paragraph opacity-60 text-sm mb-1">
                            Número de factura
                        </p>
                        <p className="text-h5 font-semibold">
                            {invoiceNumber}
                        </p>
                    </div>
                    <div>
                        <p className="text-paragraph opacity-60 text-sm mb-1">
                            Fecha de compra
                        </p>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-paragraph opacity-60" />
                            <p className="text-h5 font-semibold">
                                {new Date(issueDate).toLocaleDateString('es-VE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                {items.length > 0 && (
                    <div className="border-t border-[var(--palette-border)] pt-4">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left text-paragraph font-medium pb-3">
                                        Descripción
                                    </th>
                                    <th className="text-center text-paragraph font-medium pb-3">
                                        Cant.
                                    </th>
                                    <th className="text-right text-paragraph font-medium pb-3">
                                        Precio
                                    </th>
                                    <th className="text-right text-paragraph font-medium pb-3">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-t border-[var(--palette-border)]">
                                        <td className="py-3 text-paragraph">
                                            {item.description}
                                        </td>
                                        <td className="py-3 text-center text-paragraph">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 text-right text-paragraph">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="py-3 text-right text-paragraph font-semibold">
                                            {formatCurrency(item.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total */}
                <div className="border-t border-[var(--palette-border)] pt-4 mt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-h4 font-bold">
                            Total pagado
                        </span>
                        <span className="text-h2 font-black text-[var(--palette-primary)]">
                            {formatCurrency(totalPaid)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Breakdown */}
            {paymentBreakdown.length > 0 && (
                <div className="palette-surface palette-border border rounded-xl p-6 mb-6">
                    <h2 className="text-h4 font-semibold mb-4">
                        Desglose de pago
                    </h2>
                    <div className="space-y-3">
                        {paymentBreakdown.map((payment, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-[var(--palette-background)] rounded-lg"
                            >
                                <div>
                                    <p className="text-paragraph font-medium">
                                        {payment.method}
                                    </p>
                                    {payment.reference && (
                                        <p className="text-sm text-paragraph opacity-60">
                                            Ref: {payment.reference}
                                        </p>
                                    )}
                                </div>
                                <p className="text-h5 font-semibold">
                                    {formatCurrency(payment.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Access Instructions */}
            <div className="palette-surface palette-border border rounded-xl p-6 mb-6 bg-[var(--palette-primary)]/5">
                <h2 className="text-h4 font-semibold mb-3 flex items-center gap-2">
                    📚 Accede a tu curso
                </h2>
                <ol className="space-y-3 text-paragraph">
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            1
                        </span>
                        <span>
                            Ve a <strong>Mis cursos</strong> desde tu panel
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            2
                        </span>
                        <span>
                            Encuentra <strong>{courseName}</strong> en tus cursos inscritos
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            3
                        </span>
                        <span>
                            Abre el curso para acceder a todos los materiales y comenzar
                        </span>
                    </li>
                </ol>
            </div>

            {/* Support Info */}
            <div className="text-center text-paragraph opacity-60">
                <p>¿Necesitas ayuda? Escríbenos a nuestro equipo de soporte:</p>
                <p className="font-medium text-[var(--palette-primary)]">
                    soporte@cursorg.ve
                </p>
            </div>
        </div>
    );
};

export default PurchaseConfirmation;
