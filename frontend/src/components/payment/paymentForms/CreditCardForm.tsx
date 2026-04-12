import React from 'react';
import { CreditCard, Calendar, Lock, User } from 'lucide-react';
import type { PaymentFormProps } from '../PaymentForms.types';
import { YEARS, CARD_BRANDS, getAvailableMonths, isCardExpired } from '../paymentForms.utils';

export const CreditCardForm: React.FC<PaymentFormProps> = ({
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
                <label className="text-paragraph font-medium block mb-2">
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
                    <label className="text-paragraph font-medium block mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            Expiry Year
                        </div>
                    </label>
                    <select
                        value={value.expiry_year || ''}
                        onChange={(e) => {
                            handleChange('expiry_year', e.target.value);
                            if (isCardExpired(value.expiry_month, e.target.value)) {
                                handleChange('expiry_month', '');
                            }
                        }}
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

                <div>
                    <label className="text-paragraph font-medium block mb-2">
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
                        {getAvailableMonths(value.expiry_year).map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                    {errors.expiry_month && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiry_month}</p>
                    )}
                </div>
            </div>

            {isCardExpired(value.expiry_month, value.expiry_year) && (
                <p className="text-red-500 text-sm font-medium">
                    This card has expired. Please use a valid card.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-paragraph font-medium block mb-2">
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
                    <label className="text-paragraph font-medium block mb-2">
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
