import React from 'react';
import { Flame, Trophy, Star, Clock } from 'lucide-react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle }) => (
    <div className="dashboard-stat-card rounded-xl p-6 flex items-center gap-4">
        <div className="dashboard-stat-icon w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="dashboard-stat-title text-sm font-medium">{title}</p>
            <p className="dashboard-stat-value text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs theme-text-secondary mt-1">{subtitle}</p>}
        </div>
    </div>
);

interface StatsCardsProps {
    streak?: number;
    xp?: number;
    certificates?: number;
    hoursLearned?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
    streak = 7,
    xp = 2450,
    certificates = 3,
    hoursLearned = 24,
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
                icon={<Flame className="w-6 h-6" />}
                title="Day Streak"
                value={streak}
                subtitle="Keep it up!"
            />
            <StatCard
                icon={<Trophy className="w-6 h-6" />}
                title="Total XP"
                value={xp.toLocaleString()}
                subtitle="Experience points"
            />
            <StatCard
                icon={<Star className="w-6 h-6" />}
                title="Certificates"
                value={certificates}
                subtitle="Courses completed"
            />
            <StatCard
                icon={<Clock className="w-6 h-6" />}
                title="Hours Learned"
                value={hoursLearned}
                subtitle="This month"
            />
        </div>
    );
};
