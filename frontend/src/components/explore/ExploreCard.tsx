import React from 'react';
import { Clock, BookOpen, Star } from 'lucide-react';

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
        return daysDiff < 30; // Less than 30 days old
    };

    const isFeatured = course.published;

    return (
        <article className="bg-[var(--palette-surface)] rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border border-[var(--palette-border)] flex flex-col h-full">
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden bg-[var(--palette-background)]">
                {course.image_url ? (
                    <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                
                {/* Placeholder when no image */}
                <div className={`w-full h-full flex items-center justify-center text-p-color opacity-40 ${course.image_url ? 'hidden' : ''}`}>
                    <BookOpen size={48} strokeWidth={1} />
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
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
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} strokeWidth={3} />
                        {course.duration_hours}h
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                {/* Category & Rating */}
                <div className="flex items-center justify-between mb-3">
                    {course.category_name && (
                        <span className="text-[var(--palette-primary)] text-[10px] font-black uppercase tracking-widest">
                            {course.category_name}
                        </span>
                    )}
                    <div className="flex items-center text-amber-400 gap-0.5">
                        <Star size={12} fill="currentColor" strokeWidth={0} />
                        <Star size={12} fill="currentColor" strokeWidth={0} />
                        <Star size={12} fill="currentColor" strokeWidth={0} />
                        <Star size={12} fill="currentColor" strokeWidth={0} />
                        <Star size={12} fill="currentColor" strokeWidth={0} />
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-p-color leading-tight mb-2 line-clamp-2">
                    {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-p-color opacity-60 line-clamp-2 mb-4 leading-relaxed flex-1">
                    {course.description || 'Discover this amazing course and expand your knowledge with our expert-led content.'}
                </p>

                {/* Level Badge */}
                {course.level_name && (
                    <div className="mb-4">
                        <span className="inline-block bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-3 py-1 rounded-lg text-xs">
                            {course.level_name}
                        </span>
                    </div>
                )}

                {/* Footer: Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--palette-border)] mt-auto">
                    <div>
                        <p className="text-[10px] font-bold text-p-color opacity-40 uppercase tracking-wider">
                            Enrollment
                        </p>
                        <p className="text-lg font-black text-p-color">
                            {formatPrice(course.price, course.tax_rate)}
                        </p>
                    </div>
                    <button
                        className="bg-[var(--palette-primary)] text-[var(--decorator-color)] font-bold px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] focus:ring-offset-2"
                        aria-label={`View details for ${course.title}`}
                    >
                        View Details
                    </button>
                </div>
            </div>
        </article>
    );
};
