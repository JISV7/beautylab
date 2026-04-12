import axios from 'axios';
import type { InvoiceSummary, Invoice, InvoicesResponse } from '../data/invoice.types';

const API_URL = 'http://localhost:8000';

export const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function fetchSummary(): Promise<InvoiceSummary | null> {
    try {
        const response = await api.get<InvoiceSummary>('/invoices/summary');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch invoice summary:', error);
        return null;
    }
}

export async function fetchInvoices(page: number, pageSize: number): Promise<InvoicesResponse | null> {
    try {
        const response = await api.get<InvoicesResponse>(`/invoices/?page=${page}&page_size=${pageSize}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
        return null;
    }
}

export async function fetchInvoiceDetails(invoiceId: string): Promise<Invoice | null> {
    try {
        const response = await api.get<Invoice>(`/invoices/${invoiceId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch invoice details:', error);
        return null;
    }
}

export async function downloadAllInvoices(
    onError: (msg: string) => void,
): Promise<void> {
    try {
        const response = await api.get('/invoices/download-all', { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const disposition = response.headers['content-disposition'];
        const match = disposition?.match(/filename="?(.+?)"?$/i);
        link.download = match ? match[1] : 'facturas_beautylab.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err: any) {
        onError(err.response?.data?.detail || 'Failed to download invoices. Please try again.');
    }
}
