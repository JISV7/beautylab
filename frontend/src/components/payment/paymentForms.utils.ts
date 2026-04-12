export const MONTHS = [
    { value: '01', label: '01 - January' },
    { value: '02', label: '02 - February' },
    { value: '03', label: '03 - March' },
    { value: '04', label: '04 - April' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - June' },
    { value: '07', label: '07 - July' },
    { value: '08', label: '08 - August' },
    { value: '09', label: '09 - September' },
    { value: '10', label: '10 - October' },
    { value: '11', label: '11 - November' },
    { value: '12', label: '12 - December' },
];

export function getAvailableMonths(selectedYear?: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!selectedYear || parseInt(selectedYear) > currentYear) {
        return MONTHS;
    }

    return MONTHS.filter((m) => parseInt(m.value) >= currentMonth);
}

export function isCardExpired(month?: string, year?: string): boolean {
    if (!month || !year) return false;
    const now = new Date();
    const expDate = new Date(parseInt(year), parseInt(month) - 1);
    return expDate < new Date(now.getFullYear(), now.getMonth());
}

export const YEARS = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year.toString(), label: year.toString() };
});

export const CARD_BRANDS = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' },
];
