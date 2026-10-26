export interface InvoiceLine {
    id: number;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    tax_rate?: string;
    tax_amount?: string;
    is_exempt?: boolean;
}

export interface Payment {
    id: string;
    amount: string;
    status: string;
    created_at: string;
    method_type?: string;
    card_last4?: string;
    card_brand?: string;
    card_holder_name?: string;
}

export interface PrinterInfo {
    id: number;
    business_name: string;
    rif: string;
    authorization_providence: string;
}

export interface ControlNumberRangeInfo {
    id: number;
    start_number: string;
    end_number: string;
    assigned_date: string;
    printer_id: number;
    printer?: PrinterInfo;
}

export interface Adjustment {
    id: number;
    adjustment_type: string;
    description: string;
    amount: string;
    is_percentage: boolean;
}

export interface CompanyInfo {
    id: number;
    business_name: string;
    rif: string;
    fiscal_address?: string;
    email?: string;
    phone?: string;
}

export interface Invoice {
    id: string;
    invoice_number: string;
    control_number: string;
    issue_date: string;
    issue_time: string;
    subtotal: string;
    discount_total: string;
    tax_total: string;
    total: string;
    status: string;
    client_rif?: string;
    client_business_name?: string;
    client_document_type?: string;
    client_document_number?: string;
    client_fiscal_address?: string;
    lines?: InvoiceLine[];
    adjustments?: Adjustment[];
    payments?: Payment[];
    company?: CompanyInfo;
    control_number_range?: ControlNumberRangeInfo;
    created_at: string;
    total_paid?: string;
    remaining_balance?: string;
    payment_progress?: number;
}

export interface InvoiceSummary {
    total_invoices: number;
    total_subtotal: string;
    total_iva: string;
    total_paid: string;
}

export type SortableColumn = 'invoice_number' | 'control_number' | 'issue_date' | 'total' | 'status' | 'created_at';

export interface InvoicesResponse {
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
}

export const invoiceStatusLabels: Record<string, string> = {
    paid: 'Pagada',
    partial: 'Parcial',
    cancelled: 'Anulada',
    issued: 'Emitida',
};

export const invoiceStatusClasses: Record<string, string> = {
    paid: 'bg-green-100 text-success dark:bg-green-900/30 dark:text-success',
    partial: 'bg-blue-100 text-info dark:bg-blue-900/30 dark:text-info',
    cancelled: 'bg-red-100 text-danger dark:bg-red-900/30 dark:text-danger',
    issued: 'bg-yellow-100 text-warning dark:bg-yellow-900/30 dark:text-warning',
};
