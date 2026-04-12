import React from 'react';
import type { PaymentFormProps } from './PaymentForms.types';
import {
    CreditCardForm,
    DebitCardForm,
    ZelleForm,
    PagoMovilForm,
    PaypalForm,
    BankTransferForm,
} from './paymentForms';

export type { PaymentFormValues, PaymentFormProps } from './PaymentForms.types';

export {
    CreditCardForm,
    DebitCardForm,
    ZelleForm,
    PagoMovilForm,
    PaypalForm,
    BankTransferForm,
} from './paymentForms';

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
            return <div className="text-paragraph">Unknown payment method</div>;
    }
};

export default PaymentForm;
