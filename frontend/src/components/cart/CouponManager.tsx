import React, { useState } from 'react';
import { Tag, X as XIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { AppliedCoupon } from './CartPage.types';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface CouponManagerProps {
    cartTotalWithTax: number;
    cartSubtotal: number;
    appliedCoupons: AppliedCoupon[];
    onApply: (coupon: AppliedCoupon) => void;
    onRemove: (code: string) => void;
}

export const CouponManager: React.FC<CouponManagerProps> = ({
    cartTotalWithTax,
    cartSubtotal,
    appliedCoupons,
    onApply,
    onRemove,
}) => {
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        if (appliedCoupons.some((c) => c.code === code)) {
            setCouponError('This coupon is already applied.');
            return;
        }

        try {
            setCouponLoading(true);
            setCouponError(null);

            const token = getAuthToken();
            const response = await api.post(
                '/coupons/validate',
                {
                    code,
                    cart_total: cartTotalWithTax,
                    subtotal: cartSubtotal,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            if (data.valid) {
                const discount = Math.round(parseFloat(data.discount_amount) * 100) / 100;
                onApply({ code, discountAmount: discount });
                setCouponInput('');
            } else {
                setCouponError(data.message || 'Invalid coupon.');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.detail || 'Failed to validate coupon.');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = (code: string) => {
        onRemove(code);
        setCouponError(null);
    };

    return (
        <>
            {/* Coupon Input */}
            <div className="pt-3 border-t palette-border">
                <p className="text-paragraph font-medium mb-2">
                    Have a coupon?
                </p>
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApplyCoupon();
                        }}
                        placeholder="Enter code"
                        className="theme-input flex-1 min-w-0 !py-2 !px-3 text-sm"
                        disabled={couponLoading}
                    />
                    <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="theme-button theme-button-secondary !py-2 !px-3 text-sm disabled:opacity-50 flex-shrink-0"
                    >
                        {couponLoading ? '...' : 'Apply'}
                    </button>
                </div>
                {couponError && (
                    <p className="text-red-500 text-sm mt-1">{couponError}</p>
                )}
            </div>

            {/* Applied Coupon Chips */}
            {appliedCoupons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {appliedCoupons.map((cp) => (
                        <div
                            key={cp.code}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full"
                        >
                            <Tag className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                {cp.code}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-500">
                                −{formatCurrency(cp.discountAmount)}
                            </span>
                            <button
                                onClick={() => handleRemoveCoupon(cp.code)}
                                className="ml-0.5 p-0.5 hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full transition-colors"
                            >
                                <XIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};
