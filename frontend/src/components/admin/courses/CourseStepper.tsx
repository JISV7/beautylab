import React from 'react';

export interface CourseStepperProps {
    currentStep: number;
}

export const CourseStepper: React.FC<CourseStepperProps> = ({ currentStep }) => {
    return (
        <div className="theme-card flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === 1
                        ? 'bg-[var(--palette-primary)]'
                        : currentStep > 1
                            ? 'bg-[var(--palette-primary)]/30'
                            : 'bg-[var(--palette-surface)]'
                }`}>
                    <span className={currentStep === 1 || currentStep > 1 ? 'decorator-color' : 'text-paragraph'}>1</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-paragraph">Course Info</p>
                    <p className="text-xs text-paragraph opacity-60">Identity and metadata</p>
                </div>
            </div>
            <div className="h-px bg-[var(--palette-border)] flex-1 mx-4 hidden lg:block"></div>
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === 2
                        ? 'bg-[var(--palette-primary)]'
                        : currentStep > 2
                            ? 'bg-[var(--palette-primary)]/30'
                            : 'bg-[var(--palette-surface)]'
                }`}>
                    <span className={currentStep === 2 || currentStep > 2 ? 'decorator-color' : 'text-paragraph'}>2</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-paragraph">Commercial</p>
                    <p className="text-xs text-paragraph opacity-60">Pricing and SKU</p>
                </div>
            </div>
            <div className="h-px bg-[var(--palette-border)] flex-1 mx-4 hidden lg:block"></div>
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === 3
                        ? 'bg-[var(--palette-primary)]'
                        : currentStep > 3
                            ? 'bg-[var(--palette-primary)]/30'
                            : 'bg-[var(--palette-surface)]'
                }`}>
                    <span className={currentStep === 3 || currentStep > 3 ? 'decorator-color' : 'text-paragraph'}>3</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-paragraph">Publishing</p>
                    <p className="text-xs text-paragraph opacity-60">Review & Launch</p>
                </div>
            </div>
        </div>
    );
};
