import React from 'react';
import { CreditCard, Building, Mail, Calendar, Lock, User, Phone, FileText } from 'lucide-react';
import type { PaymentMethodType } from './PaymentMethodSelector';

export interface PaymentFormValues {
    // Credit/Debit Card
    card_holder_name?: string;
    card_number?: string;
    expiry_month?: string;
    expiry_year?: string;
    cvv?: string;
    card_brand?: string;
    bank_name?: string;

    // Zelle
    sender_name?: string;
    sender_email?: string;
    sender_phone?: string;
    recipient_email?: string;
    confirmation_code?: string;

    // Pago Móvil
    phone_number?: string;
    rif_cedula?: string;
    reference_code?: string;

    // PayPal
    paypal_email?: string;
    transaction_id?: string;
    payer_name?: string;

    // Bank Transfer
    transfer_reference?: string;
    account_holder?: string;
    transfer_date?: string;
}

export interface PaymentFormProps {
    method?: PaymentMethodType;
    amount?: number;
    value: PaymentFormValues;
    onChange: (values: PaymentFormValues) => void;
    onSubmit?: () => void;
    errors?: Record<string, string>;
}

const MONTHS = [
    { value: '01', label: '01 - January' },
    { value: '02', label: '02 - February' },
    { value: '03', label: '03 - March' },
    { value: '04', label: '04 - April' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - June' },
    { value: '07', label: '07 - July' },
    { value: '08', label: '08 - August' },
    { value: '09', label: '09 - September' },
    { value: '10', label: '10 - October' },
    { value: '11', label: '11 - November' },
    { value: '12', label: '12 - December' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year.toString(), label: year.toString() };
});

const CARD_BRANDS = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' },
];

export const CreditCardForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormValues, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <div className="flex items-center gap-2">
                        <User size={16} />
                        Cardholder Name
                    </div>
                </label>
                <input
                    type="text"
                    value={value.card_holder_name || ''}
                    onChange={(e) => handleChange('card_holder_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="John Doe"
                />
                {errors.card_holder_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.card_holder_name}</p>
                )}
            </div>

            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} />
                        Card Number
                    </div>
                </label>
                <input
                    type="text"
                    value={value.card_number || ''}
                    onChange={(e) => handleChange('card_number', e.target.value.replace(/\D/g, '').slice(0, 19))}
                    className="theme-input w-full"
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                />
                {errors.card_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.card_number}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            Expiry Month
                        </div>
                    </label>
                    <select
                        value={value.expiry_month || ''}
                        onChange={(e) => handleChange('expiry_month', e.target.value)}
                        className="theme-input w-full"
                    >
                        <option value="">Select</option>
                        {MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                    {errors.expiry_month && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiry_month}</p>
                    )}
                </div>

                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            Expiry Year
                        </div>
                    </label>
                    <select
                        value={value.expiry_year || ''}
                        onChange={(e) => handleChange('expiry_year', e.target.value)}
                        className="theme-input w-full"
                    >
                        <option value="">Select</option>
                        {YEARS.map((year) => (
                            <option key={year.value} value={year.value}>
                                {year.label}
                            </option>
                        ))}
                    </select>
                    {errors.expiry_year && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiry_year}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <div className="flex items-center gap-2">
                            <Lock size={16} />
                            CVV
                        </div>
                    </label>
                    <input
                        type="text"
                        value={value.cvv || ''}
                        onChange={(e) => handleChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="theme-input w-full"
                        placeholder="123"
                        maxLength={4}
                    />
                    {errors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                    )}
                </div>

                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <div className="flex items-center gap-2">
                            <CreditCard size={16} />
                            Card Brand
                        </div>
                    </label>
                    <select
                        value={value.card_brand || ''}
                        onChange={(e) => handleChange('card_brand', e.target.value)}
                        className="theme-input w-full"
                    >
                        <option value="">Select</option>
                        {CARD_BRANDS.map((brand) => (
                            <option key={brand.value} value={brand.value}>
                                {brand.label}
                            </option>
                        ))}
                    </select>
                    {errors.card_brand && (
                        <p className="text-red-500 text-sm mt-1">{errors.card_brand}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const DebitCardForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormValues, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <div className="flex items-center gap-2">
                        <User size={16} />
                        Cardholder Name
                    </div>
                </label>
                <input
                    type="text"
                    value={value.card_holder_name || ''}
                    onChange={(e) => handleChange('card_holder_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="John Doe"
                />
                {errors.card_holder_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.card_holder_name}</p>
                )}
            </div>

            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} />
                        Card Number
                    </div>
                </label>
                <input
                    type="text"
                    value={value.card_number || ''}
                    onChange={(e) => handleChange('card_number', e.target.value.replace(/\D/g, '').slice(0, 19))}
                    className="theme-input w-full"
                    placeholder="5555 5555 5555 4444"
                    maxLength={19}
                />
                {errors.card_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.card_number}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <Calendar size={16} />
                        Expiry Month
                    </label>
                    <select
                        value={value.expiry_month || ''}
                        onChange={(e) => handleChange('expiry_month', e.target.value)}
                        className="theme-input w-full"
                    >
                        <option value="">Select</option>
                        {MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                    {errors.expiry_month && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiry_month}</p>
                    )}
                </div>

                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <Calendar size={16} />
                        Expiry Year
                    </label>
                    <select
                        value={value.expiry_year || ''}
                        onChange={(e) => handleChange('expiry_year', e.target.value)}
                        className="theme-input w-full"
                    >
                        <option value="">Select</option>
                        {YEARS.map((year) => (
                            <option key={year.value} value={year.value}>{year.label}</option>
                        ))}
                    </select>
                    {errors.expiry_year && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiry_year}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <Lock size={16} />
                        CVV
                    </label>
                    <input
                        type="text"
                        value={value.cvv || ''}
                        onChange={(e) => handleChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="theme-input w-full"
                        placeholder="456"
                        maxLength={4}
                    />
                    {errors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                    )}
                </div>

                <div>
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                        <Building size={16} />
                        Bank Name
                    </label>
                    <input
                        type="text"
                        value={value.bank_name || ''}
                        onChange={(e) => handleChange('bank_name', e.target.value)}
                        className="theme-input w-full"
                        placeholder="Banco de Venezuela"
                    />
                    {errors.bank_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ZelleForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormValues, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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

export const PagoMovilForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    amount,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormValues, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                    <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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

export const PaypalForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormValues, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <User size={16} />
                    Payer Name
                </label>
                <input
                    type="text"
                    value={value.payer_name || ''}
                    onChange={(e) => handleChange('payer_name', e.target.value)}
                    className="theme-input w-full"
                    placeholder="John Doe"
                />
                {errors.payer_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.payer_name}</p>
                )}
            </div>

            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <Mail size={16} />
                    PayPal Email
                </label>
                <input
                    type="email"
                    value={value.paypal_email || ''}
                    onChange={(e) => handleChange('paypal_email', e.target.value)}
                    className="theme-input w-full"
                    placeholder="john@example.com"
                />
                {errors.paypal_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.paypal_email}</p>
                )}
            </div>

            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
                    <FileText size={16} />
                    Transaction ID
                </label>
                <input
                    type="text"
                    value={value.transaction_id || ''}
                    onChange={(e) => handleChange('transaction_id', e.target.value)}
                    className="theme-input w-full"
                    placeholder="PayPal transaction ID"
                />
                {errors.transaction_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.transaction_id}</p>
                )}
            </div>
        </div>
    );
};

export const BankTransferForm: React.FC<PaymentFormProps> = ({
    value,
    onChange,
    errors = {},
}) => {
    const handleChange = (field: keyof PaymentFormValues, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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
                <label className="text-p-font text-p-size text-p-color font-medium block mb-2">
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

export const PaymentForm: React.FC<PaymentFormProps> = ({
    method,
    ...props
}) => {
    switch (method) {
        case 'credit_card':
            return <CreditCardForm {...props} />;
        case 'debit_card':
            return <DebitCardForm {...props} />;
        case 'zelle':
            return <ZelleForm {...props} />;
        case 'pago_movil':
            return <PagoMovilForm {...props} />;
        case 'paypal':
            return <PaypalForm {...props} />;
        case 'bank_transfer':
            return <BankTransferForm {...props} />;
        default:
            return <div className="text-p-color">Unknown payment method</div>;
    }
};

export default PaymentForm;
