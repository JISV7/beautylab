import React from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    activeSidebarItem?: string;
    onNavigate?: (item: string) => void;
    onBack?: () => void;
    sidebarOpen?: boolean;
    onSidebarClose?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    activeSidebarItem = 'theme',
    onNavigate,
    onBack,
    sidebarOpen = false,
    onSidebarClose
}) => {
    const handleNavigate = (item: string) => {
        onNavigate?.(item);
        // Close sidebar on mobile after navigation
        onSidebarClose?.();
    };

    return (
        <>
            {/* Admin Sidebar */}
            <AdminSidebar
                activeItem={activeSidebarItem}
                onNavigate={handleNavigate}
                onBack={onBack}
                isOpen={sidebarOpen}
                onClose={onSidebarClose}
            />
        </>
    );
};
