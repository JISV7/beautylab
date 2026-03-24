import React from 'react';
import { Star, Eye as EyeIcon } from 'lucide-react';
import type { CourseFormData } from '../types';

export interface CoursePreviewCardProps {
    formData: CourseFormData;
    categoryName: string;
    levelName: string;
}

export const CoursePreviewCard: React.FC<CoursePreviewCardProps> = ({
    formData,
    categoryName,
    levelName,
}) => {
    const formatPrice = (price: string) => {
        if (!price) return 'Bs. 0,00';
        return `Bs. ${parseFloat(price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-4">
                <EyeIcon size={20} className="text-p-color opacity-40" />
                <span className="text-xs font-black text-p-color opacity-60 uppercase tracking-widest">
                    Live Preview
                </span>
            </div>

            {/* Course Card */}
            <article className="bg-[var(--palette-surface)] rounded-xl shadow-lg overflow-hidden group">
                <div className="relative h-48 w-full overflow-hidden bg-[var(--palette-border)]">
                    {formData.image_url ? (
                        <img
                            src={formData.image_url}
                            alt={formData.title || 'Course preview'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-p-color opacity-40">
                            <span className="text-sm">No image</span>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                        {formData.published && (
                            <span className="bg-[var(--palette-primary)]/90 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                                Featured
                            </span>
                        )}
                        {formData.duration_hours && (
                            <span className="bg-black/80 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                                {formData.duration_hours}h
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[var(--palette-primary)] text-[10px] font-black uppercase tracking-widest">
                            {categoryName}
                        </span>
                        <div className="flex items-center text-amber-400 gap-0.5">
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <Star size={14} />
                            <span className="text-xs font-bold text-p-color opacity-60 ml-1">(4.8)</span>
                        </div>
                    </div>
                    <h4 className="text-xl font-black text-p-color leading-tight mb-2">
                        {formData.title || 'Course Title'}
                    </h4>
                    <p className="text-sm text-p-color opacity-60 line-clamp-2 mb-6 leading-relaxed">
                        {formData.description || 'Course description will appear here...'}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--palette-border)]">
                        <div>
                            <p className="text-[10px] font-bold text-p-color opacity-40 uppercase">
                                Enrollment Price
                            </p>
                            <p className="text-lg font-black text-p-color">
                                {formatPrice(formData.price)}
                            </p>
                        </div>
                        <span className="bg-[var(--palette-primary)]/10 text-[var(--palette-primary)] font-bold px-3 py-1 rounded-lg text-xs">
                            {levelName}
                        </span>
                    </div>
                </div>
            </article>

            {/* Tip Card */}
            <div className="mt-6 bg-[var(--palette-primary)] text-white p-6 rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-2">
                        Editor's Tip
                    </p>
                    <h5 className="text-sm font-bold mb-2">Engagement Matters</h5>
                    <p className="text-xs opacity-80 leading-relaxed">
                        Courses with detailed descriptions and professional images see a 40% higher conversion rate.
                    </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                    <EyeIcon size={64} />
                </div>
            </div>
        </div>
    );
};
