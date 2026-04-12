import React from 'react';
import { Building, Phone, User, FileText } from 'lucide-react';
import type { PaymentFormProps } from '../PaymentForms.types';

export const PagoMovilForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    amount,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormProps['value'], fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Building size={16} />
                    Bank Name
                </label>
                <input
                    type="text"
                    value={value.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="Banesco, Mercantil, Venezuela, etc."
                />
                {errors.bank_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Phone size={16} />
                    Phone Number
                </label>
                <input
                    type="tel"
                    value={value.phone_number || ''}
                    onChange={(e) => handleChange('phone_number', e.target.value.replace(/\D/g, ''))}
                    className="theme-input w-full"
                    placeholder="0412 123 4567"
                />
                {errors.phone_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <User size={16} />
                    RIF / Cédula
                </label>
                <input
                    type="text"
                    value={value.rif_cedula || ''}
                    onChange={(e) => handleChange('rif_cedula', e.target.value.toUpperCase())}
                    className="theme-input w-full"
                    placeholder="J-123456789 or 12345678"
                />
                {errors.rif_cedula && (
                    <p className="text-red-500 text-sm mt-1">{errors.rif_cedula}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <FileText size={16} />
                    Reference Code
                </label>
                <input
                    type="text"
                    value={value.reference_code || ''}
                    onChange={(e) => handleChange('reference_code', e.target.value)}
                    className="theme-input w-full"
                    placeholder="Last 6 digits of transaction"
                />
                {errors.reference_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.reference_code}</p>
                )}
            </div>

            {amount && (
                <div>
                    <label className="text-paragraph font-medium block mb-2">
                        Amount Paid
                    </label>
                    <input
                        type="text"
                        value={`$${amount.toFixed(2)}`}
                        disabled
                        className="theme-input w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                </div>
            )}
        </div>
    );
};
