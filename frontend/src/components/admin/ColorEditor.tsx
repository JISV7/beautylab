import React from 'react';
import { Palette } from 'lucide-react';
import type { ColorEditorProps } from './types';

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <div className="text-sm font-semibold theme-text-secondary">{label}</div>
        <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer shrink-0">
                <input
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div
                    className="w-12 h-12 rounded border-2 theme-border shadow-sm"
                    style={{ backgroundColor: value }}
                ></div>
            </div>
            <div className="flex-1 relative">
                <input
                    className="theme-input uppercase text-sm font-mono"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 theme-text-secondary">
                    <Palette className="w-4 h-4" />
                </div>
            </div>
        </div>
    </div>
);

export const ColorEditor: React.FC<ColorEditorProps> = ({
    colors,
    activeMode,
    styles,
    onColorChange,
}) => {
    return (
        <div className="theme-card">
            <div className="p-6 border-b theme-border flex items-center gap-3">
                <Palette className="w-6 h-6 text-palette-primary" />
                <h3 className="text-xl font-bold">
                    Color Palette - {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}
                </h3>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorInput
                    label="Primary Color (Buttons, Links)"
                    value={colors.primary}
                    onChange={(v) => onColorChange('primary', v)}
                />
                <ColorInput
                    label="Secondary Color"
                    value={colors.secondary}
                    onChange={(v) => onColorChange('secondary', v)}
                />
                <ColorInput
                    label="Accent Color"
                    value={colors.accent}
                    onChange={(v) => onColorChange('accent', v)}
                />
                <ColorInput
                    label="General Background Color"
                    value={colors.background}
                    onChange={(v) => onColorChange('background', v)}
                />
                <ColorInput
                    label="Surfaces (Cards, Panels)"
                    value={colors.surface}
                    onChange={(v) => onColorChange('surface', v)}
                />
                <ColorInput
                    label="Boxes and Borders"
                    value={colors.border}
                    onChange={(v) => onColorChange('border', v)}
                />
                <ColorInput
                    label="Decorator Color (Icons, Decorative Elements)"
                    value={colors.decorator || '#ffffff'}
                    onChange={(v) => onColorChange('decorator', v)}
                />
            </div>

            {/* Live Preview Box */}
            <div className="p-6 border-t theme-border" style={{ background: colors.background }}>
                <h2 className="text-h1-color text-h1-font text-h1-size font-bold mb-4">
                    Real-Time Preview
                </h2>
                <p 
                    className="mb-6"
                    style={{ 
                        color: styles.p.color, 
                        fontFamily: styles.p.fontFamily, 
                        fontSize: `${styles.p.size}rem`,
                        fontWeight: styles.p.fontWeight,
                        lineHeight: styles.p.lineHeight
                    }}
                >
                    This is an example of how text appears on the site. Colors and typography work together.
                </p>

                <div 
                    className="flex flex-col sm:flex-row gap-4 p-6 rounded-lg border" 
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                    <div className="flex-1 flex flex-col gap-2">
                        <h4 
                            className="font-bold"
                            style={{ 
                                color: styles.h4.color, 
                                fontFamily: styles.h4.fontFamily, 
                                fontSize: `${styles.h4.size}rem`,
                                fontWeight: styles.h4.fontWeight
                            }}
                        >
                            Surface Card
                        </h4>
                        <p 
                            className="text-sm"
                            style={{ 
                                color: styles.p.color, 
                                fontFamily: styles.p.fontFamily, 
                                fontSize: `${styles.p.size}rem`,
                                fontWeight: styles.p.fontWeight
                            }}
                        >
                            Example card content with configured colors and typography.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            className="theme-button theme-button-primary"
                        >
                            Primary
                        </button>
                        <button
                            className="theme-button theme-button-secondary"
                        >
                            Secondary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
