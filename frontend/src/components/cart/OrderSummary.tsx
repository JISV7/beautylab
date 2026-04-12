import React from 'react';
import { Tag } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { AppliedCoupon } from './CartPage.types';

interface OrderSummaryProps {
    subtotal: string;
    taxTotal: string;
    appliedCoupons: AppliedCoupon[];
    totalAfterCoupons: number;
    children?: React.ReactNode;
    checkoutButton?: React.ReactNode;
    compact?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    subtotal,
    taxTotal,
    appliedCoupons,
    totalAfterCoupons,
    children,
    checkoutButton,
    compact = false,
}) => {
    const hasCoupons = appliedCoupons.length > 0;

    return (
        <div className={`palette-surface palette-border border rounded-xl ${compact ? 'p-4' : 'p-6'} ${compact ? '' : 'h-fit'} space-y-4`}>
            <h3 className="text-h3">Order Summary</h3>
            <div className={`space-y-2 ${compact ? '' : 'pt-4 border-t palette-border'}`}>
                <div className="flex justify-between text-paragraph">
                    <span className="text-paragraph opacity-75">Subtotal</span>
                    <span className="text-paragraph font-medium">
                        {formatCurrency(subtotal)}
                    </span>
                </div>

                {hasCoupons && appliedCoupons.map((cp) => (
                    <div key={cp.code} className="flex justify-between text-paragraph">
                        <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {cp.code}
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            −{formatCurrency(cp.discountAmount)}
                        </span>
                    </div>
                ))}

                <div className="flex justify-between text-paragraph">
                    <span className="text-paragraph opacity-75">IVA (16%)</span>
                    <span className="text-paragraph font-medium">
                        {hasCoupons ? formatCurrency(
                            Math.round(Math.max(0, parseFloat(subtotal) - appliedCoupons.reduce((s, c) => s + c.discountAmount, 0)) * 0.16 * 100) / 100
                        ) : formatCurrency(taxTotal)}
                    </span>
                </div>

                <div className="flex justify-between text-h4 pt-3 border-t palette-border">
                    <span className="text-h4 font-bold">Total</span>
                    <span className="text-[var(--palette-primary)] font-bold">
                        {hasCoupons
                            ? formatCurrency(Math.max(0, totalAfterCoupons))
                            : formatCurrency(parseFloat(subtotal) + parseFloat(taxTotal))}
                    </span>
                </div>
            </div>

            {children}

            {checkoutButton}
        </div>
    );
};
