import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ExplorePage } from './ExplorePage';
import { CartPage } from '../components/cart/CartPage';
import InvoicesPage from './InvoicesPage';
import MyCoursesPage from './MyCoursesPage';
import { CourseDetailsPage } from './CourseDetailsPage';

interface DashboardProps {
    onNavigateToAdmin?: () => void;
    onLogout?: () => void;
    defaultTab?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
    onNavigateToAdmin,
    onLogout,
    defaultTab = 'home',
}) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Read tab and courseId from URL
    const activeTab = searchParams.get('tab') || defaultTab;
    const courseId = searchParams.get('courseId');

    const handleNavigate = (item: string) => {
        navigate(`?tab=${item}`, { replace: true });
    };

    const handleAdminNavigate = () => {
        onNavigateToAdmin?.();
    };

    const handleNavigateToHome = () => {
        navigate('/');
    };

    // Course details view
    if (activeTab === 'course-details' && courseId) {
        return (
            <DashboardLayout
                activeItem="course-details"
                onNavigate={handleNavigate}
                onAdminNavigate={handleAdminNavigate}
                onNavigateToHome={handleNavigateToHome}
                onLogout={onLogout}
            >
                <CourseDetailsPage
                    courseId={courseId}
                    onBack={() => handleNavigate('explore')}
                    isAuthenticated={true}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            activeItem={activeTab}
            onNavigate={handleNavigate}
            onAdminNavigate={handleAdminNavigate}
            onNavigateToHome={handleNavigateToHome}
            onLogout={onLogout}
        >
            {activeTab === 'explore' ? (
                <ExplorePage />
            ) : activeTab === 'my-courses' ? (
                <MyCoursesPage />
            ) : activeTab === 'invoices' ? (
                <InvoicesPage />
            ) : activeTab === 'cart' ? (
                <CartPage onBack={() => handleNavigate('explore')} />
            ) : (
                <div className="mx-auto p-6">
                    <h1 className="text-h1-size text-h1-color text-h1-font text-h1-weight">Hello World</h1>
                    <h2 className="text-h2-size text-h2-color text-h2-font text-h2-weight">Hello World</h2>
                    <h3 className="text-h3-size text-h3-color text-h3-font text-h3-weight">Hello World</h3>
                    <h4 className="text-h4-size text-h4-color text-h4-font text-h4-weight">Hello World</h4>
                    <h5 className="text-h5-size text-h5-color text-h5-font text-h5-weight">Hello World</h5>
                    <h6 className="text-h6-size text-h6-color text-h6-font text-h6-weight">Hello World</h6>
                </div>
            )}
        </DashboardLayout>
    );
};
