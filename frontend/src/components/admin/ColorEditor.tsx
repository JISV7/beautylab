import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import type { ColorEditorProps } from './types';

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <div className="text-xs font-semibold text-p-color">{label}</div>
        <div className="flex items-center gap-2">
            <div className="relative group cursor-pointer shrink-0">
                <input
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div
                    className="w-10 h-10 rounded border-2 palette-border shadow-sm"
                    style={{ backgroundColor: value }}
                ></div>
            </div>
            <div className="flex-1 relative">
                <input
                    className="theme-input uppercase text-xs font-mono py-1.5"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-p-color">
                    <Palette className="w-3.5 h-3.5" />
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
            <div className="p-6 border-b palette-border flex items-center gap-3">
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
                    value={colors.decorator}
                    onChange={(v) => onColorChange('decorator', v)}
                />
            </div>

            {/* Live Preview Box */}
            <div className="p-6 border rounded-xl palette-border" style={{ background: colors.background }}>
                <h1
                    style={{
                        fontFamily: styles.h1.fontFamily,
                        fontSize: `${styles.h1.size}rem`,
                        color: styles.h1.color,
                        fontWeight: styles.h1.fontWeight,
                        lineHeight: styles.h1.lineHeight
                    }}
                    className="mb-4"
                >
                    Real-Time Preview H1
                </h1>
                <p
                    className="mb-6"
                    style={{
                        fontFamily: styles.p.fontFamily,
                        fontSize: `${styles.p.size}rem`,
                        color: styles.p.color,
                        fontWeight: styles.p.fontWeight,
                        lineHeight: styles.p.lineHeight
                    }}
                >
                    This is an example of how text appears on the site. Colors and typography work together.
                </p>

                <div
                    className="flex flex-col gap-4 p-4 sm:p-6 rounded-lg border"
                    style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                    }}
                >
                    <div className="flex flex-col gap-2">
                        <h4
                            style={{
                                fontFamily: styles.h4.fontFamily,
                                fontSize: `${styles.h4.size}rem`,
                                color: styles.h4.color,
                                fontWeight: styles.h4.fontWeight,
                                lineHeight: styles.h4.lineHeight
                            }}
                        >
                            Surface Card H4
                        </h4>
                        <p
                            style={{
                                fontFamily: styles.p.fontFamily,
                                fontSize: `${styles.p.size}rem`,
                                color: styles.p.color,
                                fontWeight: styles.p.fontWeight,
                                lineHeight: styles.p.lineHeight
                            }}
                        >
                            Example card content with configured colors and typography.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-start">
                        <button
                            className="theme-button"
                            style={{
                                backgroundColor: colors.primary,
                                color: '#FFFFFF',
                                borderColor: colors.primary
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accent;
                                e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colors.primary;
                                e.currentTarget.style.borderColor = colors.primary;
                            }}
                        >
                            Primary
                        </button>
                        <button
                            className="theme-button"
                            style={{
                                backgroundColor: 'transparent',
                                color: colors.secondary,
                                borderColor: colors.secondary,
                                borderWidth: '2px',
                                borderStyle: 'solid'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accent;
                                e.currentTarget.style.borderColor = colors.accent;
                                e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = colors.secondary;
                                e.currentTarget.style.color = colors.secondary;
                            }}
                        >
                            Secondary
                        </button>
                        <button
                            className="theme-button"
                            style={{
                                backgroundColor: colors.accent,
                                color: '#FFFFFF',
                                borderColor: colors.accent
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.primary;
                                e.currentTarget.style.borderColor = colors.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accent;
                                e.currentTarget.style.borderColor = colors.accent;
                            }}
                        >
                            Accent
                        </button>
                        <button
                            className="theme-button"
                            style={{
                                backgroundColor: colors.primary,
                                color: colors.decorator,
                                borderColor: colors.primary
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.accent;
                                e.currentTarget.style.borderColor = colors.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colors.primary;
                                e.currentTarget.style.borderColor = colors.primary;
                            }}
                        >
                            <Sparkles className="w-4 h-4" />
                            Decorator
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
