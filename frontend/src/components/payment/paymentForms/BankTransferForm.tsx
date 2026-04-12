import React from 'react';
import { Building, User, FileText, Calendar } from 'lucide-react';
import type { PaymentFormProps } from '../PaymentForms.types';

export const BankTransferForm: React.FC<PaymentFormProps> = ({
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
                    <Building size={16} />
                    Bank Name
                </label>
                <input
                    type="text"
                    value={value.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="Bank name"
                />
                {errors.bank_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <User size={16} />
                    Account Holder Name
                </label>
                <input
                    type="text"
                    value={value.account_holder || ''}
                    onChange={(e) => handleChange('account_holder', e.target.value)}
                    className="theme-input w-full"
                    placeholder="Account holder name"
                />
                {errors.account_holder && (
                    <p className="text-red-500 text-sm mt-1">{errors.account_holder}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <FileText size={16} />
                    Transfer Reference
                </label>
                <input
                    type="text"
                    value={value.transfer_reference || ''}
                    onChange={(e) => handleChange('transfer_reference', e.target.value)}
                    className="theme-input w-full"
                    placeholder="Transfer reference number"
                />
                {errors.transfer_reference && (
                    <p className="text-red-500 text-sm mt-1">{errors.transfer_reference}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Calendar size={16} />
                    Transfer Date
                </label>
                <input
                    type="date"
                    value={value.transfer_date || ''}
                    onChange={(e) => handleChange('transfer_date', e.target.value)}
                    className="theme-input w-full"
                />
                {errors.transfer_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.transfer_date}</p>
                )}
            </div>
        </div>
    );
};
