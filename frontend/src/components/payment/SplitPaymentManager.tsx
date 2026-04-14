import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import type { PaymentMethodType } from './types';
import { type PaymentFormValues, PaymentForm } from './PaymentForms';
import type { CompanyInfo } from '../../data/company.types';

export interface SplitPaymentEntry {
    id: string;
    method: PaymentMethodType;
    amount: number;
    values: PaymentFormValues;
    errors?: Record<string, string>;
}

export interface SplitPaymentManagerProps {
    totalAmount: number;
    onPaymentsChange: (payments: SplitPaymentEntry[]) => void;
    onValid?: (isValid: boolean) => void;
    companyInfo?: CompanyInfo | null;
}

export const SplitPaymentManager: React.FC<SplitPaymentManagerProps> = ({
    totalAmount,
    onPaymentsChange,
    onValid,
    companyInfo,
}) => {
    const [payments, setPayments] = useState<SplitPaymentEntry[]>([
        {
            id: crypto.randomUUID(),
            method: 'credit_card',
            amount: totalAmount,
            values: {},
            errors: {},
        },
    ]);

    const totalAllocated = Math.round(payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const remaining = Math.round((totalAmount - totalAllocated) * 100) / 100;
    const isOverAllocated = remaining < -0.001;
    const isFullyAllocated = Math.abs(remaining) < 0.001;

    // Only valid when payment matches the total exactly — no partial payments
    React.useEffect(() => {
        onValid?.(isFullyAllocated);
    }, [isFullyAllocated, onValid]);

    // Notify parent of payment changes
    React.useEffect(() => {
        onPaymentsChange(payments);
    }, [payments, onPaymentsChange]);

    const addPaymentMethod = () => {
        if (payments.length >= 5) {
            alert('Maximum 5 payment methods allowed');
            return;
        }

        setPayments([
            ...payments,
            {
                id: crypto.randomUUID(),
                method: 'credit_card',
                amount: 0,
                values: {},
                errors: {},
            },
        ]);
    };

    const removePaymentMethod = (id: string) => {
        if (payments.length === 1) {
            alert('At least one payment method is required');
            return;
        }

        const paymentToRemove = payments.find((p) => p.id === id);
        const newPayments = payments.filter((p) => p.id !== id);

        // Redistribute the amount if removing a payment with allocated funds
        if (paymentToRemove && paymentToRemove.amount > 0 && newPayments.length > 0) {
            const newAmount = Math.round((newPayments[0].amount + paymentToRemove.amount) * 100) / 100;
            newPayments[0] = {
                ...newPayments[0],
                amount: Math.min(totalAmount, newAmount),
            };
        }

        setPayments(newPayments);
    };

    const updatePaymentMethod = (id: string, method: PaymentMethodType) => {
        setPayments(
            payments.map((p) =>
                p.id === id
                    ? { ...p, method, values: {}, errors: {} }
                    : p
            )
        );
    };

    const updatePaymentAmount = (id: string, amount: number) => {
        const otherPaymentsTotal = payments
            .filter((p) => p.id !== id)
            .reduce((sum, p) => sum + p.amount, 0);
        const maxForThisPayment = Math.round((totalAmount - otherPaymentsTotal) * 100) / 100;

        setPayments(
            payments.map((p) =>
                p.id === id
                    ? { ...p, amount: Math.round(Math.max(0, Math.min(maxForThisPayment, amount)) * 100) / 100 }
                    : p
            )
        );
    };

    const updatePaymentValues = (id: string, values: PaymentFormValues) => {
        setPayments(
            payments.map((p) =>
                p.id === id ? { ...p, values } : p
            )
        );
    };

    const formatAmount = (amount: number) => {
        return `Bs. ${amount.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    return (
        <div className="space-y-6">
            {/* Allocation Summary */}
            <div className="palette-surface palette-border border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-paragraph font-medium">
                        Total Amount
                    </span>
                    <span className="text-h4 font-bold">
                        {formatAmount(totalAmount)}
                    </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-paragraph">
                        Allocated
                    </span>
                    <span className={`font-semibold ${isOverAllocated ? 'text-red-500' : 'text-paragraph'}`}>
                        {formatAmount(totalAllocated)}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--palette-border)]">
                    <span className="text-paragraph font-medium">
                        Remaining
                    </span>
                    <span className={`font-bold ${
                        isOverAllocated
                            ? 'text-red-500'
                            : isFullyAllocated
                            ? 'text-green-500'
                            : 'text-paragraph'
                    }`}>
                        {formatAmount(remaining)}
                    </span>
                </div>

                {isOverAllocated && (
                    <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        <span>Total allocated exceeds the course price</span>
                    </div>
                )}

                {isFullyAllocated && !isOverAllocated && (
                    <div className="mt-3 flex items-center gap-2 text-green-500 text-sm">
                        <AlertCircle size={16} />
                        <span>✓ Full amount allocated - Ready to proceed</span>
                    </div>
                )}

                {!isFullyAllocated && !isOverAllocated && totalAllocated > 0 && remaining > 0.001 && (
                    <div className="mt-3 flex items-center gap-2 text-amber-500 text-sm">
                        <AlertCircle size={16} />
                        <span>
                            {formatAmount(remaining)} remaining — full payment required
                        </span>
                    </div>
                )}

                {totalAllocated <= 0 && !isOverAllocated && (
                    <div className="mt-3 flex items-center gap-2 text-amber-500 text-sm">
                        <AlertCircle size={16} />
                        <span>Enter an amount to allocate</span>
                    </div>
                )}
            </div>

            {/* Payment Entries */}
            <div className="space-y-4">
                {payments.map((payment, index) => (
                    <div
                        key={payment.id}
                        className="palette-surface palette-border border rounded-xl p-4 space-y-4"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--palette-primary)] text-white flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <h3 className="text-h4 font-semibold">
                                    Payment Method {index + 1}
                                </h3>
                            </div>

                            <button
                                onClick={() => removePaymentMethod(payment.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remove payment method"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Method Selector */}
                        <div>
                            <label className="text-paragraph font-medium block mb-2">
                                Payment Type
                            </label>
                            <select
                                value={payment.method}
                                onChange={(e) =>
                                    updatePaymentMethod(payment.id, e.target.value as PaymentMethodType)
                                }
                                className="theme-input w-full"
                            >
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                {/* <option value="zelle">Zelle</option> */}
                                <option value="pago_movil">Pago Móvil</option>
                                {/* <option value="paypal">PayPal</option> */}
                                {/* <option value="bank_transfer">Bank Transfer</option> */}
                            </select>
                        </div>

                        {/* Pago Movil Simulation Section */}
                        {payment.method === 'pago_movil' && (
                            <div className="palette-surface palette-border border rounded-xl p-4 space-y-4">
                                <h4 className="text-paragraph font-semibold mb-3">
                                    Pago Móvil Details (Simulation)
                                </h4>
                                <div>
                                    <label className="text-paragraph font-medium block mb-2">
                                        Company Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={companyInfo?.phone || '+584144141234'}
                                        readOnly
                                        className="theme-input w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="text-paragraph font-medium block mb-2">
                                        Company RIF
                                    </label>
                                    <input
                                        type="text"
                                        value={companyInfo?.rif || 'J-30400858-9'}
                                        readOnly
                                        className="theme-input w-full bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="text-paragraph font-medium block mb-2">
                                        Select Your Bank
                                    </label>
                                    <select
                                        value={payment.values.bank_selector || 'venezuela'}
                                        onChange={(e) =>
                                            updatePaymentValues(payment.id, { ...payment.values, bank_selector: e.target.value })
                                        }
                                        className="theme-input w-full"
                                    >
                                        <option value="venezuela">Venezuela</option>
                                        <option value="mercantil">Mercantil</option>
                                        <option value="bancamiga">Bancamiga</option>
                                        <option value="bancamiga">Banesco</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div>
                            <label className="text-paragraph font-medium block mb-2">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} />
                                    Amount
                                </div>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={payment.amount}
                                    onChange={(e) =>
                                        updatePaymentAmount(payment.id, parseFloat(e.target.value) || 0)
                                    }
                                    className="theme-input w-full pl-8"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    max={totalAmount - (totalAllocated - payment.amount)}
                                />
                            </div>
                            <p className="text-sm text-paragraph opacity-60 mt-1">
                                Available: {formatAmount(totalAmount - (totalAllocated - payment.amount))}
                            </p>
                        </div>

                        {/* Payment Form */}
                        <PaymentForm
                            method={payment.method}
                            amount={payment.amount}
                            value={payment.values}
                            onChange={(values) => updatePaymentValues(payment.id, values)}
                            errors={payment.errors}
                        />
                    </div>
                ))}
            </div>

            {/* Add Payment Button */}
            <button
                onClick={addPaymentMethod}
                className="w-full py-3 px-4 border-2 border-dashed border-[var(--palette-border)] rounded-xl text-paragraph hover:border-[var(--palette-primary)] hover:text-[var(--palette-primary)] transition-colors flex items-center justify-center gap-2"
            >
                <Plus size={20} />
                <span className="font-medium">Add Another Payment Method</span>
            </button>

            {/* Info */}
            <div className="palette-surface palette-border border rounded-xl p-4 bg-[var(--palette-primary)]/5">
                <p className="text-paragraph text-sm">
                    💡 <strong>Tip:</strong> You can split your payment across multiple methods.
                    Just add another payment method and allocate the desired amount to each.
                    The total must equal the course price exactly.
                </p>
            </div>
        </div>
    );
};

export default SplitPaymentManager;
