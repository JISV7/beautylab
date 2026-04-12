import React from 'react';
import { Mail, User, Phone, FileText } from 'lucide-react';
import type { PaymentFormProps } from '../PaymentForms.types';

export const ZelleForm: React.FC<PaymentFormProps> = ({
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
                    Sender Name
                </label>
                <input
                    type="text"
                    value={value.sender_name || ''}
                    onChange={(e) => handleChange('sender_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="John Doe"
                />
                {errors.sender_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.sender_name}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Mail size={16} />
                    Sender Email
                </label>
                <input
                    type="email"
                    value={value.sender_email || ''}
                    onChange={(e) => handleChange('sender_email', e.target.value)}
                    className="theme-input w-full"
                    placeholder="john@example.com"
                />
                {errors.sender_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.sender_email}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Phone size={16} />
                    Sender Phone (Optional)
                </label>
                <input
                    type="tel"
                    value={value.sender_phone || ''}
                    onChange={(e) => handleChange('sender_phone', e.target.value)}
                    className="theme-input w-full"
                    placeholder="+1 234 567 8900"
                />
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <Mail size={16} />
                    Recipient Email
                </label>
                <input
                    type="email"
                    value={value.recipient_email || ''}
                    onChange={(e) => handleChange('recipient_email', e.target.value)}
                    className="theme-input w-full"
                    placeholder="payments@beautylab.com"
                />
                {errors.recipient_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipient_email}</p>
                )}
            </div>

            <div>
                <label className="text-paragraph font-medium block mb-2">
                    <FileText size={16} />
                    Confirmation Code
                </label>
                <input
                    type="text"
                    value={value.confirmation_code || ''}
                    onChange={(e) => handleChange('confirmation_code', e.target.value)}
                    className="theme-input w-full"
                    placeholder="ZELLE123456"
                />
                {errors.confirmation_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmation_code}</p>
                )}
            </div>
        </div>
    );
};
