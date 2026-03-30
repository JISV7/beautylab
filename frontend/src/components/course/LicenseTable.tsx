import React, { useState } from 'react';
import { LicenseStatusBadge, type LicenseStatus } from './LicenseStatusBadge';
import { Gift, Copy, Check } from 'lucide-react';

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
}

export const LicenseTable: React.FC<LicenseTableProps> = ({ licenses, onGift }) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
        <div className="palette-surface palette-border border rounded-xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[var(--palette-background)] border-b border-[var(--palette-border)]">
                        <tr>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                License Code
                            </th>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Status
                            </th>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Amount Paid
                            </th>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Remaining
                            </th>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Purchase Date
                            </th>
                            <th className="text-left text-xs font-bold text-p-color uppercase tracking-wider px-4 py-3">
                                Redemption Date
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
                        {licenses.map((license) => (
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
                                    {license.can_gift && (
                                        <button
                                            onClick={() => onGift?.(license.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--palette-primary)] hover:bg-[var(--palette-primary)]/10 rounded-lg transition-colors"
                                        >
                                            <Gift size={14} />
                                            Gift
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[var(--palette-border)]">
                {licenses.map((license) => (
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

                        {/* Gift Button */}
                        {license.can_gift && (
                            <button
                                onClick={() => onGift?.(license.id)}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--palette-primary)] bg-[var(--palette-primary)]/10 hover:bg-[var(--palette-primary)]/20 rounded-lg transition-colors"
                            >
                                <Gift size={16} />
                                Gift License
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
