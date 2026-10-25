import React from 'react';
import { Mail, User, FileText } from 'lucide-react';
import type { PaymentFormProps } from '../PaymentForms.types';

export const PaypalForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormProps['value'], fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <User size={16} />
                    Nombre del pagador
                </label>
                <input
                    type="text"
                    value={value.payer_name || ''}
                    onChange={(e) => handleChange('payer_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="María Pérez"
                />
                {errors.payer_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.payer_name}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Mail size={16} />
                    Correo de PayPal
                </label>
                <input
                    type="email"
                    value={value.paypal_email || ''}
                    onChange={(e) => handleChange('paypal_email', e.target.value)}
                    className="theme-input w-full"
                    placeholder="maria@empresa.com"
                />
                {errors.paypal_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.paypal_email}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <FileText size={16} />
                    ID de transacción
                </label>
                <input
                    type="text"
                    value={value.transaction_id || ''}
                    onChange={(e) => handleChange('transaction_id', e.target.value)}
                    className="theme-input w-full"
                    placeholder="ID de transacción de PayPal"
                />
                {errors.transaction_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.transaction_id}</p>
                )}
            </div>
        </div>
    );
};
