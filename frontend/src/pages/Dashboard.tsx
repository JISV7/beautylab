import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ExplorePage } from './ExplorePage';
import { CourseDetailsPage } from './CourseDetailsPage';
import InvoicesPage from './InvoicesPage';
import MyCoursesPage from './MyCoursesPage';

interface DashboardProps {
    onNavigateToAdmin?: () => void;
    onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAdmin, onLogout }) => {
    const [activeItem, setActiveItem] = useState('home');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    const handleNavigate = (item: string) => {
        setActiveItem(item);
        setSelectedCourseId(null);
    };

    const handleViewCourse = (courseId: string) => {
        setSelectedCourseId(courseId);
    };

    const handleBackToExplore = () => {
        setSelectedCourseId(null);
    };

    const handleAdminNavigate = () => {
        onNavigateToAdmin?.();
    };

    // Show course details if a course is selected
    if (selectedCourseId) {
        return (
            <DashboardLayout
                activeItem={activeItem}
                onNavigate={handleNavigate}
                onAdminNavigate={handleAdminNavigate}
                onLogout={onLogout}
            >
                <CourseDetailsPage courseId={selectedCourseId} onBack={handleBackToExplore} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onAdminNavigate={handleAdminNavigate}
            onLogout={onLogout}
        >
            {activeItem === 'explore' ? (
                <ExplorePage onViewCourse={handleViewCourse} />
            ) : activeItem === 'my-courses' ? (
                <MyCoursesPage />
            ) : activeItem === 'invoices' ? (
                <InvoicesPage />
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
