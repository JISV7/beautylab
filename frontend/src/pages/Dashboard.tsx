import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WelcomeHero } from '../components/dashboard/WelcomeHero';
import { StatsCards } from '../components/dashboard/StatsCards';
import { CoursesInProgress } from '../components/dashboard/CoursesInProgress';
import { AgenticAIWidget } from '../components/dashboard/AgenticAIWidget';
import { EmptyState } from '../components/dashboard/EmptyState';

interface DashboardProps {
    onNavigateToAdmin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAdmin }) => {
    const [activeItem, setActiveItem] = useState('home');
    const [hasCourses] = useState(true); // This would come from API in real app

    const handleContinue = (courseId?: number) => {
        console.log('Continue course:', courseId);
        // Navigate to course player
    };

    const handleNavigate = (item: string) => {
        setActiveItem(item);
    };

    const handlePromptSubmit = (prompt: string) => {
        console.log('AI Prompt submitted:', prompt);
        // Handle AI prompt submission
    };

    const handleAdminNavigate = () => {
        onNavigateToAdmin?.();
    };

    return (
        <DashboardLayout
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onAdminNavigate={handleAdminNavigate}
        >
            <div className="max-w-7xl mx-auto">
                {/* Welcome Hero with Continue Learning */}
                <WelcomeHero
                    lastActivity={{
                        courseTitle: 'Complete Web Development Bootcamp',
                        lessonTitle: 'Understanding React useEffect Hook',
                        progress: 45,
                    }}
                    onContinue={() => handleContinue(1)}
                />

                {/* Statistics Cards */}
                <StatsCards
                    streak={7}
                    xp={2450}
                    certificates={3}
                    hoursLearned={24}
                />

                {/* AI Widget */}
                <AgenticAIWidget onPromptSubmit={handlePromptSubmit} />

                {/* Courses In Progress */}
                {hasCourses ? (
                    <CoursesInProgress onContinue={handleContinue} />
                ) : (
                    <EmptyState
                        type="courses"
                        onAction={() => setActiveItem('explore')}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};
