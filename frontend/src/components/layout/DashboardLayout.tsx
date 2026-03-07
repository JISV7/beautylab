import React from 'react';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeItem?: string;
    onNavigate?: (item: string) => void;
    onAdminNavigate?: () => void;
    onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    activeItem = 'home',
    onNavigate,
    onAdminNavigate,
    onLogout,
}) => {
    const handleNavigation = (item: string) => {
        if (item === 'admin') {
            onAdminNavigate?.();
        } else {
            onNavigate?.(item);
        }
    };

    return (
        <div className="min-h-screen flex theme-background">
            {/* Sidebar */}
            <Sidebar
                activeItem={activeItem}
                onNavigate={handleNavigation}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <DashboardHeader onNavigate={onNavigate} onNavigateToAdmin={onAdminNavigate} onLogout={onLogout} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
