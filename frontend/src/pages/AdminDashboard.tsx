import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ThemeEditor } from '../components/admin/ThemeEditor';
import { UserManager } from '../components/admin/UserManager';

type AdminTab = 'theme' | 'users' | 'settings';

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('theme');

    const handleNavigate = (item: string) => {
        setActiveTab(item as AdminTab);
    };

    const handleBack = () => {
        // Navigate back to dashboard
        window.location.href = '/dashboard';
    };

    const handleSave = () => {
        console.log('Theme saved!');
        // Could show a toast notification here
    };

    return (
        <AdminLayout
            activeSidebarItem={activeTab}
            onNavigate={handleNavigate}
            onBack={handleBack}
        >
            {activeTab === 'theme' && (
                <ThemeEditor onSave={handleSave} />
            )}
            {activeTab === 'users' && (
                <UserManager />
            )}
            {activeTab === 'settings' && (
                <div>
                    <h1 className="text-2xl font-bold theme-text-base mb-2">Site Settings</h1>
                    <p className="theme-text-secondary">
                        General site configuration and settings (Coming soon)
                    </p>
                </div>
            )}
        </AdminLayout>
    );
};
