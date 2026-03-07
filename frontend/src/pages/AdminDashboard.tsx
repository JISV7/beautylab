import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UnifiedThemeConfig } from '../components/admin/UnifiedThemeConfig';
import { UserManager } from '../components/admin/UserManager';

type AdminTab = 'dashboard' | 'themes' | 'users' | 'content';

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

    const handleNavigate = (item: string) => {
        setActiveTab(item as AdminTab);
    };

    const handleBack = () => {
        // Navigate back to dashboard
        window.location.href = '/dashboard';
    };

    return (
        <AdminLayout
            activeSidebarItem={activeTab}
            onNavigate={handleNavigate}
            onBack={handleBack}
        >
            {activeTab === 'dashboard' && (
                <div>
                    <h1 className="text-2xl font-bold theme-text-base mb-2">Admin Dashboard</h1>
                    <p className="theme-text-secondary">
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
                <UserManager />
            )}
            {activeTab === 'content' && (
                <div>
                    <h1 className="text-2xl font-bold theme-text-base mb-2">Content Management</h1>
                    <p className="theme-text-secondary">
                        Manage your site's content (Coming soon)...
                    </p>
                </div>
            )}
        </AdminLayout>
    );
};
