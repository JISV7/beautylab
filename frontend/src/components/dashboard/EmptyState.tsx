import React from 'react';
import { Book, Compass, Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
    type?: 'courses' | 'explore' | 'paths' | 'default';
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'default',
    title,
    description,
    actionLabel = 'Get Started',
    onAction,
}) => {
    const getConfig = () => {
        switch (type) {
            case 'courses':
                return {
                    icon: Book,
                    title: title || 'No courses yet',
                    description: description || 'Start your learning journey by exploring our course catalog.',
                    actionLabel: actionLabel || 'Browse Courses',
                };
            case 'explore':
                return {
                    icon: Compass,
                    title: title || 'Nothing to show',
                    description: description || 'Discover new topics and technologies to learn.',
                    actionLabel: actionLabel || 'Explore Catalog',
                };
            case 'paths':
                return {
                    icon: Sparkles,
                    title: title || 'No learning paths',
                    description: description || 'Create your personalized learning path to track progress.',
                    actionLabel: actionLabel || 'Create Path',
                };
            default:
                return {
                    icon: Book,
                    title: title || 'Nothing here yet',
                    description: description || 'Check back later for updates.',
                    actionLabel: actionLabel,
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full theme-primary/10 flex items-center justify-center">
                <Icon className="w-10 h-10 theme-primary" style={{ color: 'var(--decorator-color)' }} />
            </div>
            <h3 className="text-xl font-bold theme-text-base mb-2">
                {config.title}
            </h3>
            <p className="theme-text-secondary mb-6 max-w-md mx-auto">
                {config.description}
            </p>
            {config.actionLabel && (
                <button
                    onClick={onAction}
                    className="theme-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                    {config.actionLabel}
                    <ArrowRight className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
                </button>
            )}
        </div>
    );
};
