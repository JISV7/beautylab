/**
 * Format a numeric value as Bolivares (Bs.) with Venezuelan locale.
 * Accepts a string or number; returns 'Bs. 0,00' for invalid input.
 */
export function formatCurrency(value: string | number | null | undefined): string {
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (numeric == null || isNaN(numeric)) return 'Bs. 0,00';
    return `Bs. ${numeric.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
