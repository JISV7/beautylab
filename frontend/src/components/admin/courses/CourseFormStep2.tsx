import React from 'react';
import type { CourseFormData } from '../types';

export interface CourseFormStep2Props {
    formData: CourseFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBack: () => void;
    onNext: () => void;
}

export const CourseFormStep2: React.FC<CourseFormStep2Props> = ({
    formData,
    onChange,
    onBack,
    onNext,
}) => {
    return (
        <div className="theme-card p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-h3-size text-h3-color text-h3-font text-h3-weight">
                    Step 2: Commercial Info
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Product Name
                    </label>
                    <input
                        type="text"
                        name="product_name"
                        className="theme-input w-full"
                        placeholder="Subscription Access: Python DS"
                        value={formData.product_name}
                        onChange={onChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        SKU
                    </label>
                    <input
                        type="text"
                        name="sku"
                        className="theme-input w-full uppercase"
                        placeholder="SLT-PY-001"
                        value={formData.sku}
                        onChange={onChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 text-p-color">
                        Price (Bs.)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-p-color opacity-40 font-bold">
                            Bs.
                        </span>
                        <input
                            type="number"
                            name="price"
                            className="theme-input w-full pl-12 pr-4"
                            step="0.01"
                            min="0"
                            placeholder="2500.00"
                            value={formData.price}
                            onChange={onChange}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    className="theme-button"
                    style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-p-color)',
                        border: '1px solid var(--palette-border)',
                    }}
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="theme-button theme-button-primary"
                >
                    Next: Review
                </button>
            </div>
        </div>
    );
};
