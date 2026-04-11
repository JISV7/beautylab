import React from 'react';
import { Rocket } from 'lucide-react';
import type { CourseFormData } from '../types';

export interface CourseFormStep3Props {
    formData: CourseFormData;
    categoryName: string;
    levelName: string;
    onBack: () => void;
    onSave: () => void;
    saving: boolean;
    onFormDataChange: (field: keyof CourseFormData, value: any) => void;
}

export const CourseFormStep3: React.FC<CourseFormStep3Props> = ({
    formData,
    categoryName,
    levelName,
    onBack,
    onSave,
    saving,
    onFormDataChange,
}) => {
    const formatPrice = (price: string) => {
        if (!price) return 'Bs. 0,00';
        return `Bs. ${parseFloat(price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="theme-card p-6 space-y-6">
            <div className="flex items-center justify-between bg-[var(--palette-surface)] p-6 rounded-xl border border-[var(--palette-border)]">
                <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-[var(--palette-primary)]/10 flex items-center justify-center">
                        <Rocket size={24} className="text-[var(--palette-primary)]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-paragraph">
                            Step 3: Review & Publish
                        </h3>
                        <p className="text-xs text-paragraph opacity-60">
                            Ready to go live? Toggle the status below.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-paragraph">
                        Published
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.published}
                            onChange={(e) => onFormDataChange('published', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-[var(--palette-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--palette-primary)]"></div>
                    </label>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-paragraph">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-paragraph opacity-60">Title:</span>
                        <p className="font-semibold text-paragraph mt-1">{formData.title || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-paragraph opacity-60">Category:</span>
                        <p className="font-semibold text-paragraph mt-1">{categoryName}</p>
                    </div>
                    <div>
                        <span className="text-paragraph opacity-60">Level:</span>
                        <p className="font-semibold text-paragraph mt-1">{levelName}</p>
                    </div>
                    <div>
                        <span className="text-paragraph opacity-60">Duration:</span>
                        <p className="font-semibold text-paragraph mt-1">{formData.duration_hours ? `${formData.duration_hours} hours` : 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-paragraph opacity-60">Product Name:</span>
                        <p className="font-semibold text-paragraph mt-1">{formData.product_name || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-paragraph opacity-60">SKU:</span>
                        <p className="font-semibold text-paragraph mt-1">{formData.sku || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-paragraph opacity-60">Price:</span>
                        <p className="font-bold text-paragraph mt-1">{formatPrice(formData.price)}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    className="theme-button"
                    style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-paragraph)',
                        border: '1px solid var(--palette-border)',
                    }}
                >
                    Back
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="theme-button theme-button-primary"
                >
                    {saving ? 'Saving...' : (formData.published ? 'Publish Course' : 'Save as Draft')}
                </button>
            </div>
        </div>
    );
};
