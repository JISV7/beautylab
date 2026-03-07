import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface DashboardProps {
    onNavigateToAdmin?: () => void;
    onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAdmin, onLogout }) => {
    const [activeItem, setActiveItem] = useState('home');

    const handleNavigate = (item: string) => {
        setActiveItem(item);
    };

    const handleAdminNavigate = () => {
        onNavigateToAdmin?.();
    };

    return (
        <DashboardLayout
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onAdminNavigate={handleAdminNavigate}
            onLogout={onLogout}
        >
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-h2-size" style={{ color: 'var(--text-h2-color)', fontFamily: 'var(--text-h2-font)', fontWeight: 'var(--text-h2-weight)' }}>WIP</h1>
            </div>
        </DashboardLayout>
    );
};
