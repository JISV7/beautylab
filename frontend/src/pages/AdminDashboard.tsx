import React, { useState } from 'react';
import { AdminHeader } from '../components/layout/AdminHeader';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UnifiedThemeConfig } from '../components/admin/UnifiedThemeConfig';

type AdminTab = 'dashboard' | 'themes' | 'users' | 'content';

interface AdminDashboardProps {
    onNavigateToDashboard?: () => void;
    onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToDashboard, onLogout }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleNavigate = (item: string) => {
        setActiveTab(item as AdminTab);
    };

    const handleBack = () => {
        // Navigate back to dashboard
        onNavigateToDashboard?.();
    };

    return (
        <div className="min-h-screen flex flex-col theme-background">
            {/* Admin Header */}
            <AdminHeader onBack={handleBack} onMenuToggle={() => setSidebarOpen(true)} onLogout={onLogout} />

            <div className="flex flex-1 overflow-hidden">
                {/* Admin Layout with Sidebar */}
                <AdminLayout
                    activeSidebarItem={activeTab}
                    onNavigate={handleNavigate}
                    onBack={handleBack}
                    sidebarOpen={sidebarOpen}
                    onSidebarClose={() => setSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'dashboard' && (
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-h2-color)] mb-2">Admin Dashboard</h1>
                            <p className="text-[var(--text-p-color)]">
                                Welcome to the Site Customizer.
                            </p>
                        </div>
                    )}
                    {activeTab === 'themes' && (
                        <div>
                            <UnifiedThemeConfig />
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-h2-color)] mb-2">User Management</h1>
                            <p className="text-[var(--text-p-color)]">
                                User management features (Coming soon)...
                            </p>
                        </div>
                    )}
                    {activeTab === 'content' && (
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-h2-color)] mb-2">Content Management</h1>
                            <p className="text-[var(--text-p-color)]">
                                Manage your site's content (Coming soon)...
                            </p>
                        </div>
                    )}
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
