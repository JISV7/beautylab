import React from 'react';

export type LicenseStatus = 'pending' | 'active' | 'redeemed' | 'expired' | 'cancelled';

interface LicenseStatusBadgeProps {
    status: LicenseStatus;
}

export const LicenseStatusBadge: React.FC<LicenseStatusBadgeProps> = ({ status }) => {
    const getStatusStyles = () => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 dark:bg-amber-900/30 text-warning dark:text-warning border-amber-200 dark:border-amber-800';
            case 'active':
                return 'bg-green-100 dark:bg-green-900/30 text-success dark:text-success border-green-200 dark:border-green-800';
            case 'redeemed':
                return 'bg-blue-100 dark:bg-blue-900/30 text-info dark:text-info border-blue-200 dark:border-blue-800';
            case 'expired':
                return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
            case 'cancelled':
                return 'bg-red-100 dark:bg-red-900/30 text-danger dark:text-danger border-red-200 dark:border-red-800';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusLabel = () => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}
        >
            {getStatusLabel()}
        </span>
    );
};
