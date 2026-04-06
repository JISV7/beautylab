import React, { useState } from 'react';
import { AdminHeader } from '../components/layout/AdminHeader';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UnifiedThemeConfig } from '../components/admin/UnifiedThemeConfig';
import { CourseList } from '../components/admin/CourseList';
import { CourseManagement } from '../components/admin/CourseManagement';
import { CategoryManagementPage } from '../pages/CategoryManagementPage';
import { CouponManagement } from '../components/admin/CouponManagement';
import InvoicesPage from '../pages/InvoicesPage';
import CompanyInfoPage from '../pages/CompanyInfoPage';
import PrinterInfoPage from '../pages/PrinterInfoPage';

type AdminTab = 'dashboard' | 'themes' | 'categories' | 'users' | 'content' | 'invoices' | 'coupons' | 'company-info' | 'printer-info';

type ContentView = 'list' | 'create' | 'edit';

interface AdminDashboardProps {
    onNavigateToDashboard?: () => void;
    onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToDashboard, onLogout }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [contentView, setContentView] = useState<ContentView>('list');
    const [editingCourseId, setEditingCourseId] = useState<string | undefined>(undefined);

    const handleNavigate = (item: string) => {
        setActiveTab(item as AdminTab);
    };

    const handleBack = () => {
        // Navigate back to dashboard
        onNavigateToDashboard?.();
    };

    // Content tab navigation handlers
    const handleNavigateToCreate = () => {
        setContentView('create');
        setEditingCourseId(undefined);
    };

    const handleNavigateToEdit = (courseId: string) => {
        setEditingCourseId(courseId);
        setContentView('edit');
    };

    const handleBackToContentList = () => {
        setContentView('list');
        setEditingCourseId(undefined);
    };

    const handleNavigateToCategories = () => {
        setActiveTab('categories');
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
                            <h1 className="text-h1 font-bold mb-1">Admin Dashboard</h1>
                            <p className="text-paragraph">
                                Welcome to the Site Customizer.
                            </p>
                        </div>
                    )}
                    {activeTab === 'themes' && (
                        <div>
                            <UnifiedThemeConfig />
                        </div>
                    )}
                    {activeTab === 'categories' && (
                        <div>
                            <CategoryManagementPage />
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div>
                            <h1 className="text-h1 font-bold mb-1">User Management</h1>
                            <p className="text-paragraph">
                                User management features (Coming soon)...
                            </p>
                        </div>
                    )}
                    {activeTab === 'content' && (
                        <div>
                            {contentView === 'list' && (
                                <CourseList
                                    onNavigateToCreate={handleNavigateToCreate}
                                    onNavigateToEdit={handleNavigateToEdit}
                                    onNavigateToCategories={handleNavigateToCategories}
                                />
                            )}
                            {contentView === 'create' && (
                                <CourseManagement
                                    onBack={handleBackToContentList}
                                />
                            )}
                            {contentView === 'edit' && editingCourseId && (
                                <CourseManagement
                                    courseId={editingCourseId}
                                    onBack={handleBackToContentList}
                                />
                            )}
                        </div>
                    )}
                    {activeTab === 'invoices' && (
                        <div>
                            <InvoicesPage />
                        </div>
                    )}
                    {activeTab === 'coupons' && (
                        <div>
                            <CouponManagement />
                        </div>
                    )}
                    {activeTab === 'company-info' && (
                        <div>
                            <CompanyInfoPage />
                        </div>
                    )}
                    {activeTab === 'printer-info' && (
                        <div>
                            <PrinterInfoPage />
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
