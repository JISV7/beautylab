import React from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeSidebarItem?: string;
    onNavigate?: (item: string) => void;
    onBack?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    activeSidebarItem = 'theme',
    onNavigate,
    onBack,
}) => {
    return (
        <div className="min-h-screen flex theme-background">
            {/* Admin Sidebar */}
            <AdminSidebar 
                activeItem={activeSidebarItem} 
                onNavigate={onNavigate}
                onBack={onBack}
            />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
