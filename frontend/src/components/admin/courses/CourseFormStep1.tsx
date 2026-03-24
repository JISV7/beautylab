import React from 'react';
import { HelpCircle, Upload } from 'lucide-react';
import type { Category, Level, CourseFormData } from '../types';

export interface CourseFormStep1Props {
    formData: CourseFormData;
    categories: Category[];
    levels: Level[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onNext: () => void;
}

export const CourseFormStep1: React.FC<CourseFormStep1Props> = ({
    formData,
    categories,
    levels,
    onChange,
    onNext,
}) => {
    return (
        <div className="theme-card p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-h3-size text-h3-color text-h3-font text-h3-weight">
                    Step 1: Course Info
                </h3>
                <HelpCircle size={20} className="text-p-color opacity-40 cursor-help" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Course Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        className="theme-input w-full"
                        placeholder="e.g. Python for Data Science"
                        value={formData.title}
                        onChange={onChange}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Slug
                    </label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--palette-border)] bg-[var(--palette-surface)] text-p-color opacity-60 text-xs">
                            beautylab.com/c/
                        </span>
                        <input
                            type="text"
                            name="slug"
                            className="theme-input rounded-l-none flex-1"
                            placeholder="python-ds-101"
                            value={formData.slug}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Category Selection
                    </label>
                    <select
                        name="category_id"
                        className="theme-input w-full"
                        value={formData.category_id}
                        onChange={onChange}
                    >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Level Selection
                    </label>
                    <select
                        name="level_id"
                        className="theme-input w-full"
                        value={formData.level_id}
                        onChange={onChange}
                    >
                        <option value="">Select a level</option>
                        {levels.map(level => (
                            <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Duration (Hours)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            name="duration_hours"
                            className="theme-input w-full pl-4 pr-10"
                            value={formData.duration_hours}
                            onChange={onChange}
                            placeholder="40"
                            min="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-p-color opacity-40 text-xs font-bold">
                            hrs
                        </span>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Description
                    </label>
                    <textarea
                        name="description"
                        className="theme-input w-full min-h-[120px]"
                        placeholder="Briefly describe what students will learn..."
                        value={formData.description}
                        onChange={onChange}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Image URL Input
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="url"
                            name="image_url"
                            className="theme-input flex-1"
                            placeholder="https://cdn.beautylab.com/images/..."
                            value={formData.image_url}
                            onChange={onChange}
                        />
                        <button
                            type="button"
                            className="px-4 border border-[var(--palette-border)] rounded-lg hover:bg-[var(--palette-surface)] transition-colors flex items-center gap-2"
                        >
                            <Upload size={18} className="text-p-color opacity-60" />
                            <span className="text-sm font-bold text-p-color">Browse</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={onNext}
                    className="theme-button theme-button-primary"
                >
                    Next: Commercial Info
                </button>
            </div>
        </div>
    );
};
