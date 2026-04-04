import React from 'react';
import { Clock } from 'lucide-react';
import { ShareModal } from './ShareModal';

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    duration_hours: number | null;
    published: boolean;
    price: string;
    tax_rate: string;
    category_id: number | null;
    category_name: string | null;
    category_slug: string | null;
    level_id: number | null;
    level_name: string | null;
    level_slug: string | null;
    created_at: string;
}

export interface ExploreCardProps {
    course: Course;
    onViewDetails?: (courseId: string) => void;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({ course, onViewDetails }) => {
    const formatPrice = (price: string) => {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) return 'Bs. 0,00';

        const formatted = numericPrice.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return `Bs. ${formatted}`;
    };

    const isNew = () => {
        const createdDate = new Date(course.created_at);
        const now = new Date();
        const minutesDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60);
        return minutesDiff < 3;
    };

    const isFeatured = course.published;

    return (
        <div className="palette-surface palette-border border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group flex flex-col">
            {/* Image Container */}
            <div className="h-48 w-full overflow-hidden relative">
                {course.image_url ? (
                    <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : null}

                {/* Placeholder when no image */}
                <div className={`w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${course.image_url ? 'hidden' : ''}`}>
                    <span className="text-p-color opacity-40 text-sm">No image</span>
                </div>

                {/* Top-left Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                    {isNew() && (
                        <span className="bg-emerald-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            New
                        </span>
                    )}
                    {isFeatured && (
                        <span className="bg-[var(--palette-primary)]/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Featured
                        </span>
                    )}
                </div>

                {/* Top-right: Share Icon */}
                <div className="absolute top-3 right-3">
                    <ShareModal
                        courseTitle={course.title}
                        courseId={course.id}
                        description={course.description}
                        imageUrl={course.image_url}
                        durationHours={course.duration_hours}
                        levelName={course.level_name}
                        price={course.price}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Category */}
                {course.category_name && (
                    <div className="mb-2">
                        <span className="text-[var(--palette-primary)] text-[10px] font-black uppercase tracking-widest">
                            {course.category_name}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-h3-font text-h3-size text-h3-color mb-2 line-clamp-2 min-h-[2.8rem]">
                    {course.title}
                </h3>

                {/* Description - 2 lines max */}
                <p className="text-p-font text-p-size text-p-color mb-4 flex-grow line-clamp-2 opacity-75 text-sm leading-relaxed">
                    {course.description || 'Discover this amazing course and expand your knowledge with our expert-led content.'}
                </p>

                {/* Meta Row: Level + Duration */}
                <div className="flex items-center gap-2 mb-3">
                    {course.level_name && (
                        <span className="bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                            {course.level_name}
                        </span>
                    )}
                    {course.duration_hours && (
                        <span className="bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-2.5 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duration_hours}h
                        </span>
                    )}
                </div>

                {/* Footer: Price & CTA */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[10px] font-bold text-p-color opacity-40 uppercase tracking-wider">
                            Price
                        </p>
                        <p className="text-lg font-black text-p-color">
                            {formatPrice(course.price)}
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => onViewDetails?.(course.id)}
                    className="theme-button theme-button-primary w-full"
                >
                    View Details
                </button>
            </div>
        </div>
    );
};
