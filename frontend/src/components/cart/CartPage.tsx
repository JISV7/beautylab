import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { SplitPaymentManager, PurchaseConfirmation, type SplitPaymentEntry } from '../payment';
import { CartItemList } from './CartItemList';
import { OrderSummary } from './OrderSummary';
import { CouponManager } from './CouponManager';
import { formatPaymentDetails, type AppliedCoupon, type CheckoutStep, type CartPageProps } from './CartPage.types';
import { validatePaymentForm } from './CartPage.utils';
import { formatCurrency } from '../../utils/formatCurrency';
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

export const CartPage: React.FC<CartPageProps> = ({ onBack }) => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('review');
    const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([]);
    const [isPaymentValid, setIsPaymentValid] = useState(false);
    const [totalAllocated, setTotalAllocated] = useState<number>(0);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Coupon state
    const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);

    // Derived coupon calculations
    const totalCouponDiscount = appliedCoupons.reduce((sum, c) => sum + c.discountAmount, 0);
    const discountedSubtotal = Math.max(0, parseFloat(cart?.subtotal || '0') - totalCouponDiscount);
    const recalculatedTax = Math.round(discountedSubtotal * 0.16 * 100) / 100;
    const totalAfterCoupons = Math.round((discountedSubtotal + recalculatedTax) * 100) / 100;

    const handleCheckout = () => {
        setCheckoutStep('payment');
    };

    const handlePaymentsChange = (payments: SplitPaymentEntry[]) => {
        setSplitPayments(payments);
        const total = Math.round(payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
        setTotalAllocated(total);
    };

    const handleCompletePurchase = async () => {
        if (!isPaymentValid || !cart) return;

        const validationError = validatePaymentForm(splitPayments);
        if (validationError) {
            setPurchaseError(validationError);
            return;
        }

        setCheckoutStep('processing');
        setPurchaseError(null);

        try {
            const token = localStorage.getItem('access_token');
            const payments = splitPayments.map((entry) => ({
                method_type: entry.method,
                amount: entry.amount,
                details: formatPaymentDetails(entry),
            }));

            const checkoutResponse = await api.post(
                '/cart/checkout',
                {
                    license_type: 'gift',
                    payment_method: splitPayments.length > 1 ? 'split' : 'single',
                    coupon_codes: appliedCoupons.map((c) => c.code),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            await api.post(
                '/payments/split',
                {
                    invoice_id: checkoutResponse.data.invoice_id,
                    payments,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setReceiptData({
                invoice_number: checkoutResponse.data.invoice_id,
                total: cart.total,
                issue_date: new Date().toISOString(),
                items: cart.items.map((item) => ({
                    description: item.product_name || 'Course',
                    quantity: item.quantity.toString(),
                    unit_price: item.product_price || '0',
                    line_total: (parseFloat(item.product_price || '0') * item.quantity).toString(),
                })),
                payment_breakdown: splitPayments.map((p) => ({
                    method: p.method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    amount: p.amount.toFixed(2),
                    reference: p.values.confirmation_code || p.values.reference_code || p.values.transaction_id || '',
                })),
                applied_coupons: appliedCoupons,
            });

            setCheckoutStep('confirmation');
            await clearCart();
        } catch (err: any) {
            console.error('Payment failed:', err);
            setPurchaseError(err.response?.data?.detail || 'Payment failed. Please try again.');
            setCheckoutStep('payment');
        }
    };

    const handleGoBack = () => {
        if (checkoutStep === 'payment') {
            setCheckoutStep('review');
        } else {
            onBack?.();
        }
    };

    if (checkoutStep === 'confirmation' && receiptData) {
        return (
            <div className="p-6">
                <PurchaseConfirmation
                    invoiceNumber={receiptData.invoice_number}
                    courseName="Multiple Courses"
                    totalPaid={receiptData.total}
                    issueDate={receiptData.issue_date}
                    items={receiptData.items}
                    paymentBreakdown={receiptData.payment_breakdown}
                    onGoToDashboard={() => onBack?.()}
                    onViewCourses={() => onBack?.()}
                />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleGoBack}
                        className="p-2 hover:bg-[var(--palette-border)] rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-paragraph" />
                    </button>
                    <div>
                        <h1 className="text-h1 font-bold mb-1">
                            Shopping Cart
                        </h1>
                        <p className="text-paragraph">
                            Review your items and complete your purchase
                        </p>
                    </div>
                </div>
            </div>

            {checkoutStep === 'review' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {!cart || cart.items.length === 0 ? (
                        <div className="lg:col-span-3 flex items-center justify-center min-h-[60vh]">
                            <div className="palette-surface palette-border border rounded-xl p-12 text-center w-full">
                                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-paragraph opacity-20" />
                                <p className="text-paragraph font-semibold mb-4">
                                    Your cart is empty
                                </p>
                                <button
                                    onClick={() => onBack?.()}
                                    className="theme-button theme-button-primary"
                                >
                                    Browse Courses
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-2">
                            <CartItemList
                                items={cart.items}
                                onRemove={removeFromCart}
                                onUpdateQuantity={updateQuantity}
                            />
                        </div>
                    )}

                    {cart && cart.items.length > 0 && (
                        <div className="lg:col-span-1">
                            <OrderSummary
                                subtotal={cart.subtotal}
                                taxTotal={cart.tax_total}
                                appliedCoupons={appliedCoupons}
                                totalAfterCoupons={totalAfterCoupons}
                                checkoutButton={
                                    <button
                                        onClick={handleCheckout}
                                        className="theme-button theme-button-primary w-full"
                                    >
                                        <CreditCard className="w-5 h-5 decorator-color" />
                                        Proceed to Checkout
                                    </button>
                                }
                            >
                                <CouponManager
                                    cartTotalWithTax={parseFloat(cart.subtotal) + parseFloat(cart.tax_total)}
                                    cartSubtotal={parseFloat(cart.subtotal)}
                                    appliedCoupons={appliedCoupons}
                                    onApply={(coupon) => setAppliedCoupons([...appliedCoupons, coupon])}
                                    onRemove={(code) => setAppliedCoupons(appliedCoupons.filter((c) => c.code !== code))}
                                />
                            </OrderSummary>
                        </div>
                    )}
                </div>
            )}

            {checkoutStep === 'payment' && cart && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <OrderSummary
                        subtotal={cart.subtotal}
                        taxTotal={cart.tax_total}
                        appliedCoupons={appliedCoupons}
                        totalAfterCoupons={totalAfterCoupons}
                        compact
                    />

                    <SplitPaymentManager
                        totalAmount={Math.max(0, Math.round(totalAfterCoupons * 100) / 100)}
                        onPaymentsChange={handlePaymentsChange}
                        onValid={setIsPaymentValid}
                    />

                    {purchaseError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-paragraph text-red-600 dark:text-red-400 font-medium">
                                {purchaseError}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleCompletePurchase}
                        disabled={!isPaymentValid}
                        className="theme-button theme-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Complete Purchase - {formatCurrency(totalAllocated)}
                    </button>
                </div>
            )}

            {checkoutStep === 'processing' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center max-w-md">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--palette-primary)] mx-auto mb-4"></div>
                        <h3 className="text-h3 mb-2">Processing Payment</h3>
                        <p className="text-paragraph opacity-60">
                            Please wait while we process your payment...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
