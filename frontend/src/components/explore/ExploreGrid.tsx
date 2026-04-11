import React from 'react';
import { Search } from 'lucide-react';
import type { Course } from './ExploreCard';
import { ExploreCard } from './ExploreCard';

export interface ExploreGridProps {
    courses: Course[];
    isLoading: boolean;
    onViewDetails?: (courseId: string) => void;
}

export const ExploreGrid: React.FC<ExploreGridProps> = ({ courses, isLoading, onViewDetails }) => {
    // Loading Skeleton
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-[var(--palette-surface)] rounded-xl shadow-lg overflow-hidden border border-[var(--palette-border)] animate-pulse"
                    >
                        <div className="h-48 bg-[var(--palette-background)]" />
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-3 w-20 bg-[var(--palette-border)] rounded" />
                                <div className="h-3 w-16 bg-[var(--palette-border)] rounded" />
                            </div>
                            <div className="h-5 w-full bg-[var(--palette-border)] rounded" />
                            <div className="h-5 w-2/3 bg-[var(--palette-border)] rounded" />
                            <div className="h-4 w-full bg-[var(--palette-border)] rounded" />
                            <div className="h-4 w-3/4 bg-[var(--palette-border)] rounded" />
                            <div className="h-6 w-24 bg-[var(--palette-border)] rounded" />
                            <div className="flex justify-between items-center pt-4 border-t border-[var(--palette-border)]">
                                <div className="h-8 w-20 bg-[var(--palette-border)] rounded" />
                                <div className="h-8 w-24 bg-[var(--palette-border)] rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty State
    if (courses.length === 0) {
        return (
            <div className="palette-surface palette-border border rounded-xl p-12 text-center">
                <Search size={48} className="mx-auto mb-4 opacity-50 text-paragraph" />
                <h3 className="text-xl font-bold text-paragraph mb-2">
                    No courses found
                </h3>
                <p className="text-paragraph opacity-75 max-w-md mx-auto">
                    We couldn't find any courses matching your current filters. Try adjusting your search or filter criteria.
                </p>
            </div>
        );
    }

    // Course Grid
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <ExploreCard key={course.id} course={course} onViewDetails={onViewDetails} />
            ))}
        </div>
    );
};
