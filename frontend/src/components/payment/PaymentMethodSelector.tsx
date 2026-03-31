import React from 'react';
import { CreditCard, Smartphone, Mail, DollarSign, Landmark } from 'lucide-react';

export type PaymentMethodType =
    | 'credit_card'
    | 'debit_card'
    | 'zelle'
    | 'pago_movil'
    | 'paypal'
    | 'cash_deposit'
    | 'bank_transfer';

export interface PaymentMethodOption {
    id: PaymentMethodType;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export interface PaymentMethodSelectorProps {
    selectedMethods: PaymentMethodType[];
    onToggleMethod: (method: PaymentMethodType) => void;
    allowMultiple?: boolean;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
    {
        id: 'credit_card',
        name: 'Credit Card',
        description: 'Visa, Mastercard, American Express',
        icon: <CreditCard size={24} />,
        color: 'bg-blue-500',
    },
    {
        id: 'debit_card',
        name: 'Debit Card',
        description: 'Direct from your bank account',
        icon: <CreditCard size={24} />,
        color: 'bg-green-500',
    },
    {
        id: 'zelle',
        name: 'Zelle',
        description: 'Fast payments with Zelle',
        icon: <Smartphone size={24} />,
        color: 'bg-purple-500',
    },
    {
        id: 'pago_movil',
        name: 'Pago Móvil',
        description: 'Venezuelan mobile payment',
        icon: <Smartphone size={24} />,
        color: 'bg-orange-500',
    },
    {
        id: 'paypal',
        name: 'PayPal',
        description: 'Secure online payments',
        icon: <Mail size={24} />,
        color: 'bg-indigo-500',
    },
    {
        id: 'cash_deposit',
        name: 'Cash Deposit',
        description: 'Deposit at bank branch',
        icon: <DollarSign size={24} />,
        color: 'bg-emerald-500',
    },
    {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: <Landmark size={24} />,
        color: 'bg-cyan-500',
    },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    selectedMethods,
    onToggleMethod,
    allowMultiple = true,
}) => {
    const handleSelect = (methodId: PaymentMethodType) => {
        if (selectedMethods.includes(methodId)) {
            // Only allow deselecting if more than one method is selected or if not required
            if (allowMultiple && selectedMethods.length > 1) {
                onToggleMethod(methodId);
            }
        } else {
            if (allowMultiple) {
                onToggleMethod(methodId);
            } else {
                // If single selection, replace all
                onToggleMethod(methodId);
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethods.includes(method.id);

                return (
                    <button
                        key={method.id}
                        onClick={() => handleSelect(method.id)}
                        className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200
                            text-left w-full
                            ${isSelected
                                ? 'border-[var(--palette-primary)] bg-[var(--palette-primary)]/5'
                                : 'border-[var(--palette-border)] palette-surface hover:border-[var(--palette-primary)]/50'
                            }
                        `}
                    >
                        {/* Selection indicator */}
                        {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h5 rounded-full bg-[var(--palette-primary)] flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center mb-3 text-white`}>
                            {method.icon}
                        </div>

                        {/* Name */}
                        <h3 className="text-h4-font text-h4-size text-h4-color font-semibold mb-1">
                            {method.name}
                        </h3>

                        {/* Description */}
                        <p className="text-p-font text-p-size text-p-color opacity-60 text-sm">
                            {method.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );
};

export default PaymentMethodSelector;
