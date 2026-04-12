import type { SplitPaymentEntry } from '../payment';

export type CheckoutStep = 'review' | 'payment' | 'processing' | 'confirmation';

export interface AppliedCoupon {
    code: string;
    discountAmount: number;
}

export interface CartPageProps {
    onBack?: () => void;
}

export interface CartItemData {
    id: string;
    product_name?: string | null;
    product_sku?: string | null;
    product_price?: string | null;
    quantity: number;
}

/**
 * Map a SplitPaymentEntry to the backend payment details payload.
 */
export function formatPaymentDetails(entry: SplitPaymentEntry): Record<string, unknown> {
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
}
