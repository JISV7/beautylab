import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UnifiedThemeConfig } from '../components/admin/UnifiedThemeConfig';
import { UserManager } from '../components/admin/UserManager';

type AdminTab = 'dashboard' | 'themes' | 'users' | 'content';

interface AdminDashboardProps {
    onNavigateToDashboard?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToDashboard }) => {
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
        <div className="min-h-screen flex theme-background">
            {/* Admin Layout with Sidebar */}
            <AdminLayout
                activeSidebarItem={activeTab}
                onNavigate={handleNavigate}
                onBack={handleBack}
                sidebarOpen={sidebarOpen}
                onSidebarClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-[var(--palette-border)] bg-[var(--palette-surface)]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-[var(--text-p-color)] hover:bg-[var(--palette-border)] transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-[var(--text-h4-size)] text-[var(--text-h4-color)] font-bold">Codyn Admin</span>
                </header>

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
                        <UserManager />
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
