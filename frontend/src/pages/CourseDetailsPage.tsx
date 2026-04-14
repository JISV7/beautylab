import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CourseHero, LicenseTable, GiftLicenseModal, type License } from '../components/course';
import {
    SplitPaymentManager,
    PurchaseConfirmation,
    type SplitPaymentEntry,
    type PaymentBreakdown,
} from '../components/payment';
import { ArrowLeft, X, ShoppingCart, Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import type { CompanyInfo } from '../data/company.types';

const API_URL = 'http://localhost:8000';

interface CourseDetailsPageProps {
    courseId: string;
    onBack?: () => void;
    isAuthenticated?: boolean;
}

interface CourseDetails {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    duration_hours: number | null;
    level_name: string | null;
    category_name: string | null;
    product_id: string | null;
    product_name: string | null;
    product_sku: string | null;
    product_price: string | null;
    product_tax_rate: string | null;
    video_url: string | null;
    user_licenses: License[];
}

interface PurchaseResponse {
    success: boolean;
    invoice_number: string;
    total_paid: string;
    payments: Array<{
        id: string;
        invoice_id: string;
        amount: string;
        status: string;
    }>;
    message: string;
}

interface ReceiptData {
    invoice_number: string;
    total: string;
    issue_date: string;
    items: Array<{
        description: string;
        quantity: string;
        unit_price: string;
        line_total: string;
    }>;
    user_email?: string;
    payment_breakdown?: PaymentBreakdown[];
}

type PaymentStep = 'idle' | 'payment_details' | 'processing' | 'confirmation';

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({ courseId, onBack, isAuthenticated = false }) => {
    const { addToCart, isInCart, getQuantityInCart } = useCart();
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);
    const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);

    // Redeem state
    const [redeemModalOpen, setRedeemModalOpen] = useState(false);
    const [redeemLicenseId, setRedeemLicenseId] = useState<string | null>(null);
    const [redeemError, setRedeemError] = useState<string | null>(null);

    // Payment state - starts as 'idle' until user clicks Buy
    const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');
    const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([]);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [isPaymentValid, setIsPaymentValid] = useState(false);
    const [totalAllocated, setTotalAllocated] = useState<number>(0);

    // Company info for Pago Movil
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

    const fetchCourseDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${API_URL}/catalog/courses/${courseId}/details`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCourse(response.data);
        } catch (err: any) {
            console.error('Failed to fetch course details:', err);
            setError(err.response?.data?.detail || 'Failed to load course details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const response = await axios.get(`${API_URL}/company-info/active/public`);
            setCompanyInfo(response.data);
        } catch (error) {
            // Company info is optional for Pago Movil simulation
            console.warn('Failed to fetch company info:', error);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
        fetchCompanyInfo();
    }, [courseId]);

    const handleBuy = () => {
        setPaymentStep('payment_details');
        setPurchaseError(null);
    };

    const handleAddToCart = async (quantity: number) => {
        if (!course || !course.product_id) return;

        setAddToCartMessage(null);

        try {
            await addToCart(course.product_id, quantity);
            setAddToCartMessage(`Added ${quantity} x "${course.title}" to cart!`);
            setTimeout(() => setAddToCartMessage(null), 3000);
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((e: any) => e.msg).join(', ')
                    : 'Failed to add to cart';
            setAddToCartMessage(message);
        }
    };

    const handlePaymentsChange = (payments: SplitPaymentEntry[]) => {
        setSplitPayments(payments);
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
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

            // Check amount
            if (!amount || amount <= 0) {
                return `Payment method ${method}: Amount must be greater than 0`;
            }

            // Check required fields based on method
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

    const handleSubmitPayment = async () => {
        if (!isPaymentValid || !course) return;

        // Validate form before submission
        const validationError = validatePaymentForm();
        if (validationError) {
            setPurchaseError(validationError);
            return;
        }

        setPaymentStep('processing');
        setPurchaseError(null);

        try {
            const token = localStorage.getItem('access_token');

            // Format payments for API - send amount as number, not string
            const payments = splitPayments.map((entry) => ({
                method_type: entry.method,
                amount: entry.amount, // Send as number, not string
                details: formatPaymentDetails(entry),
            }));

            const response = await axios.post<PurchaseResponse>(
                `${API_URL}/payments/purchase-course`,
                {
                    course_id: courseId,
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
                invoice_number: response.data.invoice_number,
                total: response.data.total_paid,
                issue_date: new Date().toISOString(),
                items: [
                    {
                        description: `Course Enrollment - ${course.title}`,
                        quantity: '1',
                        unit_price: response.data.total_paid,
                        line_total: response.data.total_paid,
                    },
                ],
                payment_breakdown: splitPayments.map((p) => ({
                    method: p.method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    amount: p.amount.toFixed(2),
                    reference: p.values.confirmation_code || p.values.reference_code || p.values.transaction_id || '',
                })),
                user_email: undefined,
            });

            setPaymentStep('confirmation');
        } catch (err: any) {
            console.error('Payment failed:', err);
            const errorDetail = err.response?.data?.detail;
            if (Array.isArray(errorDetail)) {
                // Format validation errors into readable string
                setPurchaseError(errorDetail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', '));
            } else if (typeof errorDetail === 'object' && errorDetail !== null) {
                setPurchaseError(JSON.stringify(errorDetail));
            } else {
                setPurchaseError(errorDetail || 'Payment failed. Please try again.');
            }
            setPaymentStep('payment_details');
        }
    };

    const handleGoToDashboard = () => {
        // Navigate to dashboard - this would be handled by the parent app
        if (onBack) {
            onBack();
        }
    };

    const handleViewCourses = () => {
        // Navigate to user's courses
        console.log('Navigate to courses');
    };

    const handleGift = (licenseId: string) => {
        setSelectedLicenseId(licenseId);
        setGiftModalOpen(true);
    };

    const handleGiftConfirm = async (email: string, message?: string) => {
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(
                `${API_URL}/licenses/${selectedLicenseId}/gift`,
                { email, message },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setGiftModalOpen(false);
            setSelectedLicenseId(null);
            fetchCourseDetails();
        } catch (err: any) {
            console.error('Failed to gift license:', err);
            alert(err.response?.data?.detail || 'Failed to gift license');
        }
    };

    const handleRedeem = (licenseId: string) => {
        setRedeemLicenseId(licenseId);
        setRedeemError(null);
        setRedeemModalOpen(true);
    };

    const handleRedeemConfirm = async () => {
        if (!redeemLicenseId) return;
        try {
            setRedeemError(null);
            const token = localStorage.getItem('access_token');
            await axios.post(
                `${API_URL}/licenses/redeem`,
                { license_code: redeemLicenseId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setRedeemModalOpen(false);
            setRedeemLicenseId(null);
            fetchCourseDetails();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setRedeemError(typeof detail === 'string' ? detail : 'Failed to redeem license');
        }
    };

    const parsePrice = (priceStr: string | null): number => {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
    };

    const courseBasePrice = parsePrice(course?.product_price ?? null);
    const courseTaxRate = parsePrice(course?.product_tax_rate ?? null);
    const courseTax = courseBasePrice * (courseTaxRate / 100);
    const coursePrice = Math.round((courseBasePrice + courseTax) * 100) / 100; // Total with IVA, rounded to 2 decimals

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                    <p className="text-paragraph">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="p-6">
                <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Course not found'}</p>
                    <button
                        onClick={onBack}
                        className="theme-button theme-button-secondary"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Render confirmation step
    if (paymentStep === 'confirmation' && receiptData) {
        return (
            <div className="p-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-paragraph text-paragraph hover:opacity-60 transition-opacity mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back to Explore
                    </button>
                )}
                <PurchaseConfirmation
                    invoiceNumber={receiptData.invoice_number}
                    courseName={course.title}
                    totalPaid={receiptData.total}
                    issueDate={receiptData.issue_date}
                    items={receiptData.items}
                    paymentBreakdown={receiptData.payment_breakdown}
                    userEmail={receiptData.user_email}
                    onGoToDashboard={handleGoToDashboard}
                    onViewCourses={handleViewCourses}
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Back Button */}
            {onBack && paymentStep !== 'payment_details' && (
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-paragraph text-paragraph hover:opacity-60 transition-opacity mb-6"
                >
                    <ArrowLeft size={18} />
                    Back to Explore
                </button>
            )}

            {/* Payment Modal Overlay */}
            {paymentStep === 'payment_details' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="palette-surface palette-border border rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 palette-surface border-b border-[var(--palette-border)] p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-h3">
                                    Complete Your Purchase
                                </h2>
                                <p className="text-paragraph opacity-60">
                                    {course.title}
                                </p>
                            </div>
                            <button
                                onClick={() => setPaymentStep('idle')}
                                className="p-2 hover:bg-[var(--palette-background)] rounded-lg transition-colors"
                            >
                                <X size={24} className="text-paragraph" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Price Display with IVA breakdown */}
                            <div className="palette-surface palette-border border rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between text-paragraph opacity-75">
                                    <span className="text-sm font-medium">Base Price</span>
                                    <span className="text-sm font-medium">Bs. {courseBasePrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center justify-between text-paragraph opacity-75">
                                    <span className="text-sm font-medium">IVA ({courseTaxRate}%)</span>
                                    <span className="text-sm font-medium">Bs. {courseTax.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="border-t palette-border pt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart size={20} className="text-[var(--palette-primary)]" />
                                        <span className="text-paragraph font-bold">
                                            Total (with IVA)
                                        </span>
                                    </div>
                                    <span className="text-h3 font-black text-[var(--palette-primary)]">
                                        Bs. {coursePrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Error Display */}
                            {purchaseError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                    <p className="text-red-600 dark:text-red-400 font-medium">
                                        {purchaseError}
                                    </p>
                                </div>
                            )}

                            {/* Payment Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-paragraph opacity-80">
                                    <span>💡</span>
                                    <span>You can split your payment across multiple methods. Just add another payment method and allocate the desired amount to each.</span>
                                </div>

                                <SplitPaymentManager
                                    totalAmount={coursePrice}
                                    onPaymentsChange={handlePaymentsChange}
                                    onValid={setIsPaymentValid}
                                    companyInfo={companyInfo}
                                />

                                <button
                                    onClick={handleSubmitPayment}
                                    disabled={!isPaymentValid}
                                    className="theme-button theme-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Complete Purchase - Bs. {totalAllocated.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {totalAllocated < coursePrice && (
                                        <span className="block text-xs opacity-75 mt-1">
                                            (Remaining: Bs. {(coursePrice - totalAllocated).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Overlay */}
            {paymentStep === 'processing' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="palette-surface palette-border border rounded-xl p-8 text-center max-w-md">
                        <Loader2 size={48} className="animate-spin mx-auto mb-4 text-[var(--palette-primary)]" />
                        <h3 className="text-h4 mb-2">
                            Processing Payment
                        </h3>
                        <p className="text-paragraph opacity-60">
                            Please wait while we process your payment...
                        </p>
                    </div>
                </div>
            )}

            {/* Course Hero Section */}
            <CourseHero
                title={course.title}
                description={course.description}
                image_url={course.image_url}
                duration_hours={course.duration_hours}
                level_name={course.level_name}
                category_name={course.category_name}
                product_name={course.product_name}
                product_sku={course.product_sku}
                price={course.product_price}
                video_url={course.video_url}
                onBuy={isAuthenticated ? handleBuy : undefined}
                onAddToCart={isAuthenticated ? handleAddToCart : undefined}
                isInCart={course.product_id ? isInCart(course.product_id) : false}
                cartQuantity={course.product_id ? getQuantityInCart(course.product_id) : 0}
            />

            {/* Auth prompt for unauthenticated users */}
            {!isAuthenticated && (
                <div className="mb-8 p-6 palette-surface palette-border border rounded-xl text-center">
                    <h3 className="text-h4 mb-2">
                        Interested in this course?
                    </h3>
                    <p className="text-paragraph opacity-75 mb-4">
                        Sign in to purchase and start learning.
                    </p>
                    <a
                        href="/"
                        className="theme-button theme-button-primary inline-flex"
                    >
                        Sign In
                    </a>
                </div>
            )}

            {/* Add to Cart Message */}
            {addToCartMessage && (
                <div className={`mb-6 p-4 rounded-xl border ${addToCartMessage.includes('Failed')
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}>
                    <p className={addToCartMessage.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {addToCartMessage}
                    </p>
                </div>
            )}

            {/* Licenses Section — only for authenticated users */}
            {isAuthenticated && (
                <div className="mb-8">
                    <h2 className="text-h3 mb-4">
                        Your Licenses
                    </h2>
                    <LicenseTable
                        licenses={course.user_licenses}
                        onGift={handleGift}
                        onRedeem={handleRedeem}
                    />
                </div>
            )}

            {/* Gift License Modal */}
            <GiftLicenseModal
                isOpen={giftModalOpen}
                onClose={() => {
                    setGiftModalOpen(false);
                    setSelectedLicenseId(null);
                }}
                onConfirm={handleGiftConfirm}
                licenseCode={selectedLicenseId || undefined}
            />

            {/* Redeem Confirmation Modal */}
            {redeemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRedeemModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-md palette-surface palette-border border rounded-xl shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center gap-3 p-6 border-b border-[var(--palette-border)]">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <KeyRound size={20} className="text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-h4">
                                Redeem License
                            </h2>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-paragraph text-sm">
                                    This will bind the license to your account. Once redeemed, the license cannot be transferred or gifted to another user.
                                </p>
                            </div>

                            {redeemError && (
                                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                                    {redeemError}
                                </p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 p-6 border-t border-[var(--palette-border)]">
                            <button
                                onClick={() => { setRedeemModalOpen(false); setRedeemLicenseId(null); setRedeemError(null); }}
                                className="flex-1 theme-button theme-button-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRedeemConfirm}
                                className="flex-1 theme-button theme-button-primary"
                            >
                                Redeem License
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
