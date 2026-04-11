import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, Tag, X as XIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { SplitPaymentManager, PurchaseConfirmation, type SplitPaymentEntry } from '../payment';
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

type CheckoutStep = 'review' | 'payment' | 'processing' | 'confirmation';

interface AppliedCoupon {
    code: string;
    discountAmount: number;
}

interface CartPageProps {
    onBack?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onBack }) => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('review');
    const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([]);
    const [isPaymentValid, setIsPaymentValid] = useState(false);
    const [totalAllocated, setTotalAllocated] = useState<number>(0);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    const formatPrice = (price: string | number) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numericPrice)) return 'Bs. 0,00';
        return `Bs. ${numericPrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        // Check if already applied
        if (appliedCoupons.some((c) => c.code === code)) {
            setCouponError('This coupon is already applied.');
            return;
        }

        if (!cart) return;

        try {
            setCouponLoading(true);
            setCouponError(null);

            const token = getAuthToken();
            const response = await api.post(
                '/coupons/validate',
                {
                    code,
                    cart_total: parseFloat(cart.total),
                    subtotal: parseFloat(cart.subtotal),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            if (data.valid) {
                const discount = Math.round(parseFloat(data.discount_amount) * 100) / 100;
                setAppliedCoupons([...appliedCoupons, { code, discountAmount: discount }]);
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
        setAppliedCoupons(appliedCoupons.filter((c) => c.code !== code));
        setCouponError(null);
    };

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

    const formatPaymentDetails = (entry: SplitPaymentEntry) => {
        const { method, values } = entry;
        switch (method) {
            case 'credit_card':
                return {
                    card_holder_name: values.card_holder_name,
                    card_number: values.card_number,
                    expiry_month: parseInt(values.expiry_month || '1'),
                    expiry_year: parseInt(values.expiry_year || '2025'),
                    cvv: values.cvv,
                    card_brand: values.card_brand,
                };
            case 'debit_card':
                return {
                    card_holder_name: values.card_holder_name,
                    card_number: values.card_number,
                    expiry_month: parseInt(values.expiry_month || '1'),
                    expiry_year: parseInt(values.expiry_year || '2025'),
                    cvv: values.cvv,
                    bank_name: values.bank_name,
                };
            case 'zelle':
                return {
                    sender_name: values.sender_name,
                    sender_email: values.sender_email,
                    sender_phone: values.sender_phone,
                    recipient_email: values.recipient_email,
                    confirmation_code: values.confirmation_code,
                };
            case 'pago_movil':
                return {
                    bank_name: values.bank_name,
                    phone_number: values.phone_number,
                    rif_cedula: values.rif_cedula,
                    reference_code: values.reference_code,
                };
            case 'paypal':
                return {
                    paypal_email: values.paypal_email,
                    transaction_id: values.transaction_id,
                    payer_name: values.payer_name,
                };
            case 'bank_transfer':
                return {
                    transfer_reference: values.transfer_reference,
                    bank_name: values.bank_name,
                    transfer_date: values.transfer_date,
                    account_holder: values.account_holder,
                };
            default:
                return {};
        }
    };

    const validatePaymentForm = (): string | null => {
        for (const entry of splitPayments) {
            const { method, values, amount } = entry;
            if (!amount || amount <= 0) {
                return `Payment method ${method}: Amount must be greater than 0`;
            }
            switch (method) {
                case 'credit_card':
                    if (!values.card_holder_name) return 'Credit Card: Cardholder name is required';
                    if (!values.card_number || values.card_number.length < 13) return 'Credit Card: Valid card number is required';
                    if (!values.expiry_month) return 'Credit Card: Expiry month is required';
                    if (!values.expiry_year) return 'Credit Card: Expiry year is required';
                    if (!values.cvv || values.cvv.length < 3) return 'Credit Card: CVV is required';
                    if (!values.card_brand) return 'Credit Card: Card brand is required';
                    break;
                case 'debit_card':
                    if (!values.card_holder_name) return 'Debit Card: Cardholder name is required';
                    if (!values.card_number || values.card_number.length < 13) return 'Debit Card: Valid card number is required';
                    if (!values.expiry_month) return 'Debit Card: Expiry month is required';
                    if (!values.expiry_year) return 'Debit Card: Expiry year is required';
                    if (!values.cvv || values.cvv.length < 3) return 'Debit Card: CVV is required';
                    if (!values.bank_name) return 'Debit Card: Bank name is required';
                    break;
                case 'zelle':
                    if (!values.sender_name) return 'Zelle: Sender name is required';
                    if (!values.sender_email) return 'Zelle: Sender email is required';
                    if (!values.recipient_email) return 'Zelle: Recipient email is required';
                    if (!values.confirmation_code) return 'Zelle: Confirmation code is required';
                    break;
                case 'pago_movil':
                    if (!values.bank_name) return 'Pago Móvil: Bank name is required';
                    if (!values.phone_number) return 'Pago Móvil: Phone number is required';
                    if (!values.rif_cedula) return 'Pago Móvil: RIF/Cédula is required';
                    if (!values.reference_code) return 'Pago Móvil: Reference code is required';
                    break;
                case 'paypal':
                    if (!values.paypal_email) return 'PayPal: PayPal email is required';
                    if (!values.transaction_id) return 'PayPal: Transaction ID is required';
                    if (!values.payer_name) return 'PayPal: Payer name is required';
                    break;
                case 'bank_transfer':
                    if (!values.transfer_reference) return 'Bank Transfer: Reference is required';
                    if (!values.bank_name) return 'Bank Transfer: Bank name is required';
                    if (!values.transfer_date) return 'Bank Transfer: Transfer date is required';
                    if (!values.account_holder) return 'Bank Transfer: Account holder is required';
                    break;
            }
        }
        return null;
    };

    const handleCompletePurchase = async () => {
        if (!isPaymentValid || !cart) return;

        const validationError = validatePaymentForm();
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

            // First, checkout the cart to create invoice and licenses
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

            // Then process payments via payments endpoint
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
                    {/* Cart Items */}
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
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="palette-surface palette-border border rounded-xl p-4 flex gap-4"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-h3 mb-1">
                                            {item.product_name || 'Course'}
                                        </h3>
                                        <p className="text-paragraph opacity-60">
                                            SKU: {item.product_sku || 'N/A'}
                                        </p>
                                        <h4 className="text-h4 text-[var(--palette-primary)] mt-2">
                                            {formatPrice(item.product_price || '0')}
                                        </h4>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (item.quantity > 1) {
                                                        updateQuantity(item.id, item.quantity - 1);
                                                    } else {
                                                        removeFromCart(item.id);
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-[var(--palette-border)] rounded transition-colors"
                                            >
                                                <Minus className="w-4 h-4 text-paragraph" />
                                            </button>
                                            <span className="w-10 text-center text-paragraph font-semibold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1.5 hover:bg-[var(--palette-border)] rounded transition-colors"
                                            >
                                                <Plus className="w-4 h-4 text-paragraph" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-paragraph transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Order Summary */}
                    {cart && cart.items.length > 0 && (
                        <div className="palette-surface palette-border border rounded-xl p-6 h-fit space-y-4">
                            <h3 className="text-h3">Order Summary</h3>
                            <div className="space-y-3 pt-4 border-t palette-border">
                                <div className="flex justify-between text-paragraph">
                                    <span className="text-paragraph opacity-75">Subtotal</span>
                                    <span className="text-paragraph font-medium">
                                        {formatPrice(cart.subtotal)}
                                    </span>
                                </div>

                                {/* Coupon Discounts */}
                                {appliedCoupons.length > 0 && appliedCoupons.map((cp) => (
                                    <div key={cp.code} className="flex justify-between text-paragraph">
                                        <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {cp.code}
                                        </span>
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                            −{formatPrice(cp.discountAmount)}
                                        </span>
                                    </div>
                                ))}

                                {/* IVA on discounted subtotal */}
                                <div className="flex justify-between text-paragraph">
                                    <span className="text-paragraph opacity-75">
                                        IVA (16%)
                                        {appliedCoupons.length > 0}
                                    </span>
                                    <span className="text-paragraph font-medium">
                                        {appliedCoupons.length > 0
                                            ? formatPrice(recalculatedTax)
                                            : formatPrice(cart.tax_total)}
                                    </span>
                                </div>

                                {/* Total after coupons */}
                                <div className="flex justify-between text-h4 pt-3 border-t palette-border">
                                    <span className="text-h4 font-bold">Total</span>
                                    <span className="text-[var(--palette-primary)] font-bold">
                                        {appliedCoupons.length > 0
                                            ? formatPrice(Math.max(0, totalAfterCoupons))
                                            : formatPrice(cart.total)}
                                    </span>
                                </div>
                            </div>

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
                                                −{formatPrice(cp.discountAmount)}
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

                            <button
                                onClick={handleCheckout}
                                className="theme-button theme-button-primary w-full"
                            >
                                <CreditCard className="w-5 h-5 decorator-color" />
                                Proceed to Checkout
                            </button>
                        </div>
                    )}
                </div>
            )}

            {checkoutStep === 'payment' && cart && (
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Order Summary */}
                    <div className="palette-surface palette-border border rounded-xl p-4">
                        <h3 className="text-h3 mb-3">Order Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-paragraph">
                                <span className="text-paragraph opacity-75">Subtotal</span>
                                <span className="text-paragraph">{formatPrice(cart.subtotal)}</span>
                            </div>
                            {appliedCoupons.length > 0 && appliedCoupons.map((cp) => (
                                <div key={cp.code} className="flex justify-between text-paragraph">
                                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {cp.code}
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                        −{formatPrice(cp.discountAmount)}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between text-paragraph">
                                <span className="text-paragraph opacity-75">
                                    IVA (16%)
                                    {appliedCoupons.length > 0}
                                </span>
                                <span className="text-paragraph">
                                    {appliedCoupons.length > 0 ? formatPrice(recalculatedTax) : formatPrice(cart.tax_total)}
                                </span>
                            </div>
                            <div className="flex justify-between text-h4 pt-3 border-t palette-border">
                                <span className="text-h4 font-bold">Total</span>
                                <span className="text-[var(--palette-primary)] font-bold">
                                    {appliedCoupons.length > 0
                                        ? formatPrice(Math.max(0, totalAfterCoupons))
                                        : formatPrice(cart.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <SplitPaymentManager
                        totalAmount={Math.max(0, Math.round(totalAfterCoupons * 100) / 100)}
                        onPaymentsChange={handlePaymentsChange}
                        onValid={setIsPaymentValid}
                    />

                    {/* Error Display */}
                    {purchaseError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-paragraph text-red-600 dark:text-red-400 font-medium">
                                {purchaseError}
                            </p>
                        </div>
                    )}

                    {/* Complete Purchase Button */}
                    <button
                        onClick={handleCompletePurchase}
                        disabled={!isPaymentValid}
                        className="theme-button theme-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Complete Purchase - {formatPrice(totalAllocated)}
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
