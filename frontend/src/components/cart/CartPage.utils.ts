import type { SplitPaymentEntry } from '../payment';

/**
 * Validate payment form fields for all payment methods.
 * Returns an error message string or null if valid.
 */
export function validatePaymentForm(
    splitPayments: SplitPaymentEntry[]
): string | null {
    for (const entry of splitPayments) {
        const { method, values, amount } = entry;
        if (!amount || amount <= 0) {
            return `Payment method ${method}: Amount must be greater than 0`;
        }
        switch (method) {
            case 'credit_card':
                if (!values.card_holder_name) return 'Credit Card: Cardholder name is required';
                if (!values.card_number || values.card_number.length < 13)
                    return 'Credit Card: Valid card number is required';
                if (!values.expiry_month) return 'Credit Card: Expiry month is required';
                if (!values.expiry_year) return 'Credit Card: Expiry year is required';
                if (!values.cvv || values.cvv.length < 3) return 'Credit Card: CVV is required';
                if (!values.card_brand) return 'Credit Card: Card brand is required';
                break;
            case 'debit_card':
                if (!values.card_holder_name) return 'Debit Card: Cardholder name is required';
                if (!values.card_number || values.card_number.length < 13)
                    return 'Debit Card: Valid card number is required';
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
}
