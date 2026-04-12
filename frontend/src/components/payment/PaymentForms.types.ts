import type { PaymentMethodType } from './types';

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
