import React from 'react';
import { CheckCircle, Mail, BookOpen, ArrowRight, Receipt, Calendar } from 'lucide-react';

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
    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return 'Bs. 0.00';
        return `Bs. ${num.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Success Banner */}
            <div className="palette-surface palette-border border rounded-xl p-8 mb-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-white" />
                </div>
                <h1 className="text-h1-font text-h1-size text-h1-color mb-2">
                    Purchase Successful!
                </h1>
                <p className="text-p-font text-p-size text-p-color opacity-80">
                    Your enrollment has been confirmed. A receipt has been sent to your email.
                </p>
                {userEmail && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-p-color opacity-60">
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
                        <h2 className="text-h3-font text-h3-size text-h3-color mb-1">
                            {courseName}
                        </h2>
                        <p className="text-p-font text-p-size text-p-color opacity-60">
                            You now have unlimited access to this course and all its materials.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={onViewCourses}
                        className="theme-button theme-button-primary flex-1"
                    >
                        <BookOpen size={18} />
                        <span>Start Learning</span>
                    </button>
                    <button
                        onClick={onGoToDashboard}
                        className="theme-button theme-button-secondary flex-1"
                    >
                        <span>Go to Dashboard</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="palette-surface palette-border border rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Receipt size={24} className="text-[var(--palette-primary)]" />
                    <h2 className="text-h4-font text-h4-size text-h4-color font-semibold">
                        Invoice Details
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-p-font text-p-size text-p-color opacity-60 text-sm mb-1">
                            Invoice Number
                        </p>
                        <p className="text-h5-font text-h5-size text-h5-color font-semibold">
                            {invoiceNumber}
                        </p>
                    </div>
                    <div>
                        <p className="text-p-font text-p-size text-p-color opacity-60 text-sm mb-1">
                            Purchase Date
                        </p>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-p-color opacity-60" />
                            <p className="text-h5-font text-h5-size text-h5-color font-semibold">
                                {new Date(issueDate).toLocaleDateString('en-US', {
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
                                    <th className="text-left text-p-font text-p-size text-p-color font-medium pb-3">
                                        Description
                                    </th>
                                    <th className="text-center text-p-font text-p-size text-p-color font-medium pb-3">
                                        Qty
                                    </th>
                                    <th className="text-right text-p-font text-p-size text-p-color font-medium pb-3">
                                        Price
                                    </th>
                                    <th className="text-right text-p-font text-p-size text-p-color font-medium pb-3">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-t border-[var(--palette-border)]">
                                        <td className="py-3 text-p-font text-p-size text-p-color">
                                            {item.description}
                                        </td>
                                        <td className="py-3 text-center text-p-font text-p-size text-p-color">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 text-right text-p-font text-p-size text-p-color">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="py-3 text-right text-p-font text-p-size text-p-color font-semibold">
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
                        <span className="text-h4-font text-h4-size text-h4-color font-bold">
                            Total Paid
                        </span>
                        <span className="text-h2-font text-h2-size text-h2-color font-black text-[var(--palette-primary)]">
                            {formatCurrency(totalPaid)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Breakdown */}
            {paymentBreakdown.length > 0 && (
                <div className="palette-surface palette-border border rounded-xl p-6 mb-6">
                    <h2 className="text-h4-font text-h4-size text-h4-color font-semibold mb-4">
                        Payment Breakdown
                    </h2>
                    <div className="space-y-3">
                        {paymentBreakdown.map((payment, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-[var(--palette-background)] rounded-lg"
                            >
                                <div>
                                    <p className="text-p-font text-p-size text-p-color font-medium">
                                        {payment.method}
                                    </p>
                                    {payment.reference && (
                                        <p className="text-sm text-p-color opacity-60">
                                            Ref: {payment.reference}
                                        </p>
                                    )}
                                </div>
                                <p className="text-h5-font text-h5-size text-h5-color font-semibold">
                                    {formatCurrency(payment.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Access Instructions */}
            <div className="palette-surface palette-border border rounded-xl p-6 mb-6 bg-[var(--palette-primary)]/5">
                <h2 className="text-h4-font text-h4-size text-h4-color font-semibold mb-3 flex items-center gap-2">
                    📚 Access Your Course
                </h2>
                <ol className="space-y-3 text-p-font text-p-size text-p-color">
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            1
                        </span>
                        <span>
                            Navigate to <strong>My Courses</strong> from your dashboard
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            2
                        </span>
                        <span>
                            Find <strong>{courseName}</strong> in your enrolled courses
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            3
                        </span>
                        <span>
                            Click on the course to access all materials and start learning
                        </span>
                    </li>
                </ol>
            </div>

            {/* Support Info */}
            <div className="text-center text-p-font text-p-size text-p-color opacity-60">
                <p>Need help? Contact our support team at</p>
                <p className="font-medium text-[var(--palette-primary)]">
                    support@beautylab.com
                </p>
            </div>
        </div>
    );
};

export default PurchaseConfirmation;
