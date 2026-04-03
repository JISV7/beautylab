import React, { useState, useMemo } from 'react';
import { LicenseStatusBadge, type LicenseStatus } from './LicenseStatusBadge';
import { Gift, Copy, Check, Search, Filter, X, KeyRound } from 'lucide-react';

export interface License {
    id: string;
    license_code: string;
    status: LicenseStatus;
    amount_paid: string;
    amount_remaining: string;
    purchase_date: string;
    redemption_date: string | null;
    assigned_to_email: string | null;
    assigned_to_name: string | null;
    can_gift: boolean;
}

export interface LicenseTableProps {
    licenses: License[];
    onGift?: (licenseId: string) => void;
    onRedeem?: (licenseId: string) => void;
}

type SortField = 'license_code' | 'status' | 'amount_paid' | 'amount_remaining' | 'purchase_date' | 'redemption_date';
type SortDirection = 'asc' | 'desc';
type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'partial';

export const LicenseTable: React.FC<LicenseTableProps> = ({ licenses, onGift, onRedeem }) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'all'>('all');
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
    const [sortField, setSortField] = useState<SortField>('purchase_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatAmount = (amount: string) => {
        const numeric = parseFloat(amount);
        if (isNaN(numeric)) return 'Bs. 0,00';
        return `Bs. ${numeric.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPaymentFilter('all');
        setSortField('purchase_date');
        setSortDirection('desc');
    };

    // Filter and sort licenses
    const filteredLicenses = useMemo(() => {
        return licenses
            .filter((license) => {
                // Search filter
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesCode = license.license_code.toLowerCase().includes(query);
                    const matchesEmail = license.assigned_to_email?.toLowerCase().includes(query) || false;
                    const matchesName = license.assigned_to_name?.toLowerCase().includes(query) || false;
                    if (!matchesCode && !matchesEmail && !matchesName) return false;
                }

                // Status filter
                if (statusFilter !== 'all' && license.status !== statusFilter) return false;

                // Payment filter
                const remaining = parseFloat(license.amount_remaining);
                if (paymentFilter === 'paid' && remaining > 0) return false;
                if (paymentFilter === 'unpaid' && remaining === 0) return false;
                if (paymentFilter === 'partial' && (remaining === 0 || remaining >= parseFloat(license.amount_paid))) return false;

                return true;
            })
            .sort((a, b) => {
                let comparison = 0;

                switch (sortField) {
                    case 'license_code':
                        comparison = a.license_code.localeCompare(b.license_code);
                        break;
                    case 'status':
                        comparison = a.status.localeCompare(b.status);
                        break;
                    case 'amount_paid':
                        comparison = parseFloat(a.amount_paid) - parseFloat(b.amount_paid);
                        break;
                    case 'amount_remaining':
                        comparison = parseFloat(a.amount_remaining) - parseFloat(b.amount_remaining);
                        break;
                    case 'purchase_date':
                        comparison = new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime();
                        break;
                    case 'redemption_date': {
                        const dateA = a.redemption_date ? new Date(a.redemption_date).getTime() : 0;
                        const dateB = b.redemption_date ? new Date(b.redemption_date).getTime() : 0;
                        comparison = dateA - dateB;
                        break;
                    }
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });
    }, [licenses, searchQuery, statusFilter, paymentFilter, sortField, sortDirection]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = licenses.length;
        const byStatus = licenses.reduce((acc, lic) => {
            acc[lic.status] = (acc[lic.status] || 0) + 1;
            return acc;
        }, {} as Record<LicenseStatus, number>);
        
        const totalPaid = licenses.reduce((sum, lic) => sum + parseFloat(lic.amount_paid), 0);
        const totalRemaining = licenses.reduce((sum, lic) => sum + parseFloat(lic.amount_remaining), 0);
        const paidCount = licenses.filter(lic => parseFloat(lic.amount_remaining) === 0).length;
        const unpaidCount = licenses.filter(lic => parseFloat(lic.amount_remaining) > 0).length;

        return { total, byStatus, totalPaid, totalRemaining, paidCount, unpaidCount };
    }, [licenses]);

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || paymentFilter !== 'all';

    if (licenses.length === 0) {
        return (
            <div className="palette-surface palette-border border rounded-xl p-8 text-center">
                <p className="text-p-font text-p-size text-p-color opacity-60 mb-2">
                    No licenses owned for this course yet
                </p>
                <p className="text-sm text-p-color opacity-40">
                    Purchase a license to start learning
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="palette-surface palette-border border rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-p-color">{stats.total}</p>
                    <p className="text-xs text-p-color opacity-60 uppercase tracking-wider">Total</p>
                </div>
                <div className="palette-surface palette-border border rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.byStatus.active || 0}</p>
                    <p className="text-xs text-p-color opacity-60 uppercase tracking-wider">Active</p>
                </div>
                <div className="palette-surface palette-border border rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.byStatus.redeemed || 0}</p>
                    <p className="text-xs text-p-color opacity-60 uppercase tracking-wider">Redeemed</p>
                </div>
                <div className="palette-surface palette-border border rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.byStatus.pending || 0}</p>
                    <p className="text-xs text-p-color opacity-60 uppercase tracking-wider">Pending</p>
                </div>
                <div className="palette-surface palette-border border rounded-lg p-3 text-center">
                    <p className="text-lg font-black text-p-color">{formatAmount(stats.totalPaid.toString())}</p>
                    <p className="text-xs text-p-color opacity-60 uppercase tracking-wider">Total Paid</p>
                </div>
                <div className="palette-surface palette-border border rounded-lg p-3 text-center">
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{formatAmount(stats.totalRemaining.toString())}</p>
                    <p className="text-xs text-p-color opacity-60 uppercase tracking-wider">Remaining</p>
                </div>
            </div>

            {/* Filters */}
            <div className="palette-surface palette-border border rounded-xl p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-p-color opacity-40" />
                        <input
                            type="text"
                            placeholder="Search by license code or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-p-color focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-p-color opacity-40" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as LicenseStatus | 'all')}
                            className="pl-10 pr-8 py-2.5 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-p-color focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="redeemed">Redeemed</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Payment Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-p-color opacity-40" />
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                            className="pl-10 pr-8 py-2.5 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-p-color focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Payment</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                        >
                            <X size={16} />
                            Clear
                        </button>
                    )}
                </div>

                {/* Results count */}
                <div className="mt-3 flex items-center justify-between text-sm text-p-color opacity-60">
                    <span>Showing {filteredLicenses.length} of {licenses.length} licenses</span>
                    {hasActiveFilters && <span>Filters active</span>}
                </div>
            </div>

            {/* Table */}
            <div className="palette-surface palette-border border rounded-xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[var(--palette-background)] border-b border-[var(--palette-border)]">
                        <tr>
                            <th 
                                className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-[var(--palette-border)] transition-colors"
                                onClick={() => handleSort('license_code')}
                            >
                                <div className="flex items-center gap-2">
                                    License Code
                                    {sortField === 'license_code' && (
                                        <span className="text-[var(--palette-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-[var(--palette-border)] transition-colors"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-2">
                                    Status
                                    {sortField === 'status' && (
                                        <span className="text-[var(--palette-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-[var(--palette-border)] transition-colors"
                                onClick={() => handleSort('amount_paid')}
                            >
                                <div className="flex items-center gap-2">
                                    Amount Paid
                                    {sortField === 'amount_paid' && (
                                        <span className="text-[var(--palette-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-[var(--palette-border)] transition-colors"
                                onClick={() => handleSort('amount_remaining')}
                            >
                                <div className="flex items-center gap-2">
                                    Remaining
                                    {sortField === 'amount_remaining' && (
                                        <span className="text-[var(--palette-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-[var(--palette-border)] transition-colors"
                                onClick={() => handleSort('purchase_date')}
                            >
                                <div className="flex items-center gap-2">
                                    Purchase Date
                                    {sortField === 'purchase_date' && (
                                        <span className="text-[var(--palette-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3 cursor-pointer hover:bg-[var(--palette-border)] transition-colors"
                                onClick={() => handleSort('redemption_date')}
                            >
                                <div className="flex items-center gap-2">
                                    Redemption Date
                                    {sortField === 'redemption_date' && (
                                        <span className="text-[var(--palette-primary)]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Assigned To
                            </th>
                            <th className="text-right text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--palette-border)]">
                        {filteredLicenses.map((license) => (
                            <tr key={license.id} className="hover:bg-[var(--palette-background)] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono text-p-color">
                                            {license.license_code.slice(0, 8)}...
                                        </code>
                                        <button
                                            onClick={() => handleCopyCode(license.license_code)}
                                            className="p-1 hover:bg-[var(--palette-border)] rounded transition-colors"
                                            title="Copy full code"
                                        >
                                            {copiedCode === license.license_code ? (
                                                <Check size={14} className="text-green-500" />
                                            ) : (
                                                <Copy size={14} className="text-p-color opacity-60" />
                                            )}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <LicenseStatusBadge status={license.status} />
                                </td>
                                <td className="px-4 py-3 text-p-font text-p-size text-p-color">
                                    {formatAmount(license.amount_paid)}
                                </td>
                                <td className="px-4 py-3">
                                    {parseFloat(license.amount_remaining) > 0 ? (
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                            {formatAmount(license.amount_remaining)}
                                        </span>
                                    ) : (
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                            Paid
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-p-font text-p-size text-p-color opacity-80">
                                    {formatDate(license.purchase_date)}
                                </td>
                                <td className="px-4 py-3 text-p-font text-p-size text-p-color opacity-80">
                                    {formatDate(license.redemption_date)}
                                </td>
                                <td className="px-4 py-3 text-p-font text-p-size text-p-color">
                                    {license.assigned_to_name || license.assigned_to_email || '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {license.status === 'pending' && (
                                            <button
                                                onClick={() => onRedeem?.(license.license_code)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            >
                                                <KeyRound size={14} />
                                                Redeem
                                            </button>
                                        )}
                                        {license.can_gift && (
                                            <button
                                                onClick={() => onGift?.(license.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--palette-primary)] hover:bg-[var(--palette-primary)]/10 rounded-lg transition-colors"
                                            >
                                                <Gift size={14} />
                                                Gift
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[var(--palette-border)]">
                {filteredLicenses.map((license) => (
                    <div key={license.id} className="p-4 space-y-3">
                        {/* License Code */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-p-color">
                                    {license.license_code.slice(0, 8)}...
                                </code>
                                <button
                                    onClick={() => handleCopyCode(license.license_code)}
                                    className="p-1 hover:bg-[var(--palette-border)] rounded transition-colors"
                                >
                                    {copiedCode === license.license_code ? (
                                        <Check size={14} className="text-green-500" />
                                    ) : (
                                        <Copy size={14} className="text-p-color opacity-60" />
                                    )}
                                </button>
                            </div>
                            <LicenseStatusBadge status={license.status} />
                        </div>

                        {/* Payment Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                    Paid
                                </p>
                                <p className="text-sm font-medium text-p-color">
                                    {formatAmount(license.amount_paid)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                    Remaining
                                </p>
                                <p className={`text-sm font-medium ${
                                    parseFloat(license.amount_remaining) > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-green-600 dark:text-green-400'
                                }`}>
                                    {parseFloat(license.amount_remaining) > 0
                                        ? formatAmount(license.amount_remaining)
                                        : 'Paid'}
                                </p>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                    Purchased
                                </p>
                                <p className="text-xs text-p-color opacity-80">
                                    {formatDate(license.purchase_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                    Redeemed
                                </p>
                                <p className="text-xs text-p-color opacity-80">
                                    {formatDate(license.redemption_date) || 'Not redeemed'}
                                </p>
                            </div>
                        </div>

                        {/* Assigned To */}
                        {(license.assigned_to_name || license.assigned_to_email) && (
                            <div>
                                <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                    Assigned To
                                </p>
                                <p className="text-xs text-p-color">
                                    {license.assigned_to_name || license.assigned_to_email}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {(license.status === 'pending' || license.can_gift) && (
                            <div className="flex gap-2">
                                {license.status === 'pending' && (
                                    <button
                                        onClick={() => onRedeem?.(license.license_code)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                    >
                                        <KeyRound size={16} />
                                        Redeem
                                    </button>
                                )}
                                {license.can_gift && (
                                    <button
                                        onClick={() => onGift?.(license.id)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--palette-primary)] bg-[var(--palette-primary)]/10 hover:bg-[var(--palette-primary)]/20 rounded-lg transition-colors"
                                    >
                                        <Gift size={16} />
                                        Gift License
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
};
