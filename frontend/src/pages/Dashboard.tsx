import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface DashboardProps {
    onNavigateToAdmin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAdmin }) => {
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
        >
            <div className="max-w-7xl mx-auto p-6">
                <p className="text-p-size text-p-color">WIP</p>
            </div>
        </DashboardLayout>
    );
};
