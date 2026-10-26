import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ExplorePage } from './ExplorePage';
import { CartPage } from '../components/cart/CartPage';
import InvoicesPage from './InvoicesPage';
import MyCoursesPage from './MyCoursesPage';
import { CourseDetailsPage } from './CourseDetailsPage';
import CoursePlayerPage from './CoursePlayerPage';
import { SettingsPage } from './SettingsPage';
import { UserHomePage } from './UserHomePage';
import { LearningPathsPage } from './LearningPathsPage';
import { CommunityPage } from './CommunityPage';

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
                    onViewCourses={() => handleNavigate('my-courses')}
                    isAuthenticated={true}
                />
            </DashboardLayout>
        );
    }

    // Protected learning player
    if (activeTab === 'course-player' && courseId) {
        return (
            <DashboardLayout
                activeItem="my-courses"
                onNavigate={handleNavigate}
                onAdminNavigate={handleAdminNavigate}
                onNavigateToHome={handleNavigateToHome}
                onLogout={onLogout}
            >
                <CoursePlayerPage
                    courseId={courseId}
                    onBack={() => handleNavigate('my-courses')}
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
            {activeTab === 'home' ? (
                <UserHomePage />
            ) : activeTab === 'explore' ? (
                <ExplorePage />
            ) : activeTab === 'my-courses' ? (
                <MyCoursesPage />
            ) : activeTab === 'learning-paths' ? (
                <LearningPathsPage />
            ) : activeTab === 'community' ? (
                <CommunityPage />
            ) : activeTab === 'invoices' ? (
                <InvoicesPage />
            ) : activeTab === 'cart' ? (
                <CartPage onBack={() => handleNavigate('explore')} />
            ) : activeTab === 'settings' ? (
                <SettingsPage />
            ) : (
                <UserHomePage />
            )}
        </DashboardLayout>
    );
};
