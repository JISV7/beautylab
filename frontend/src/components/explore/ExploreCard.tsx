import React from 'react';
import { Clock } from 'lucide-react';

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
}

export const ExploreCard: React.FC<ExploreCardProps> = ({ course }) => {
    const formatPrice = (price: string, taxRate: string) => {
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
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        return daysDiff < 30;
    };

    const isFeatured = course.published;

    return (
        <div className="palette-surface palette-border border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group min-h-[480px] flex flex-col">
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

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {isNew() && (
                        <span className="bg-emerald-500/90 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            New
                        </span>
                    )}
                    {isFeatured && (
                        <span className="bg-[var(--palette-primary)]/90 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            Featured
                        </span>
                    )}
                </div>

                {/* Duration Badge */}
                {course.duration_hours && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm palette-primary font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration_hours}h</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                {/* Category */}
                {course.category_name && (
                    <div className="mb-3">
                        <span className="text-[var(--palette-primary)] text-[10px] font-black uppercase tracking-widest">
                            {course.category_name}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-h3-font text-h3-size text-h3-color mb-3 line-clamp-2 min-h-[3.2rem]">
                    {course.title}
                </h3>

                {/* Description */}
                <p className="text-p-font text-p-size text-p-color mb-6 flex-grow line-clamp-2">
                    {course.description || 'Discover this amazing course and expand your knowledge with our expert-led content.'}
                </p>

                {/* Course Meta - Level */}
                {course.level_name && (
                    <div className="flex items-center gap-4 mb-6 text-p-size">
                        <div className="flex items-center gap-2">
                            <span className="bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-3 py-1 rounded-lg text-xs">
                                {course.level_name}
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer: Price & CTA */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-bold text-p-color opacity-40 uppercase tracking-wider">
                            Price
                        </p>
                        <p className="text-lg font-black text-p-color">
                            {formatPrice(course.price, course.tax_rate)}
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <button className="theme-button theme-button-primary w-full">
                    View Details
                </button>
            </div>
        </div>
    );
};
