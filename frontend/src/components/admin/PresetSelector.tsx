import React from 'react';
import { Check, Palette } from 'lucide-react';

interface Preset {
    name: string;
    light: {
        colors: {
            primary: string;
            secondary: string;
            accent: string;
        };
    };
}

interface PresetSelectorProps {
    presets: Record<string, Preset>;
    currentPreset?: string;
    onSelectPreset: (presetName: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    presets,
    currentPreset,
    onSelectPreset,
}) => {
    return (
        <div className="admin-editor-panel mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 theme-primary" />
                <h3 className="text-lg font-semibold theme-text-base">Theme Presets</h3>
            </div>
            <p className="text-sm theme-text-secondary mb-4">
                Quick start with pre-configured theme combinations
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(presets).map(([key, preset]) => (
                    <button
                        key={key}
                        onClick={() => onSelectPreset(key)}
                        className={`
                            relative p-4 rounded-xl border-2 transition-all
                            ${currentPreset === key
                                ? 'border-[var(--theme-primary-value)] bg-[var(--theme-primary-value)]/5'
                                : 'theme-border hover:border-[var(--theme-primary-value)]/50'
                            }
                        `}
                    >
                        {currentPreset === key && (
                            <div className="absolute top-2 right-2 theme-primary text-white rounded-full p-1">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                        
                        {/* Color Preview */}
                        <div className="flex gap-1 mb-3">
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.light.colors.primary }}
                                title="Primary"
                            />
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.light.colors.secondary }}
                                title="Secondary"
                            />
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.light.colors.accent }}
                                title="Accent"
                            />
                        </div>
                        
                        <p className="text-sm font-medium theme-text-base">{preset.name}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
