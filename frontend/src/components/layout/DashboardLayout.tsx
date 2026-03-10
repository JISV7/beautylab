import React, { useState } from 'react';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleNavigation = (item: string) => {
        if (item === 'admin') {
            onAdminNavigate?.();
        } else {
            onNavigate?.(item);
        }
        // Close sidebar on mobile after navigation
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col theme-background">
            {/* Header - Full Width Top */}
            <DashboardHeader 
                onNavigate={onNavigate} 
                onNavigateToAdmin={onAdminNavigate} 
                onLogout={onLogout}
                onMenuToggle={() => setSidebarOpen(true)}
            />

            {/* Bottom Row: Sidebar + Main Content */}
            <div className="flex flex-1">
                {/* Sidebar - Left Side */}
                <Sidebar
                    activeItem={activeItem}
                    onNavigate={handleNavigation}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};
