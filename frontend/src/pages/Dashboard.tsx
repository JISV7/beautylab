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
            <div className="mx-auto p-6">
                <h1>Hello World</h1>
                <h2>Hello World</h2>
                <h3>Hello World</h3>
                <h4>Hello World</h4>
                <h5>Hello World</h5>
                <h6>Hello World</h6>
            </div>
        </DashboardLayout>
    );
};
