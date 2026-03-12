import React from 'react';
import { Eye, Edit, X } from 'lucide-react';
import type { ThemePreviewProps } from './types';

interface PaletteCardProps {
    mode: 'light' | 'dark' | 'accessibility';
    theme: ThemePreviewProps['theme'];
    onEdit: () => void;
}

const PaletteCard: React.FC<PaletteCardProps> = ({ mode, theme, onEdit }) => {
    const modeData = theme.config[mode];

    return (
        <div
            className="theme-card h-full flex flex-col"
            style={{
                backgroundColor: modeData.colors.surface,
                borderColor: modeData.colors.border,
            }}
        >
            <div
                className="p-4 border-b flex items-center justify-between shrink-0"
                style={{
                    borderColor: modeData.colors.border,
                    backgroundColor: modeData.colors.surface,
                }}
            >
                <h3
                    className="font-bold capitalize whitespace-nowrap"
                    style={{ color: modeData.typography.h4.color }}
                >
                    {mode} Mode
                </h3>
                <button
                    onClick={onEdit}
                    className="text-sm hover:underline shrink-0"
                    style={{ color: modeData.colors.primary }}
                >
                    Edit
                </button>
            </div>
            <div className="p-6 space-y-4 flex-1" style={{ backgroundColor: modeData.colors.background }}>
                {/* Color swatches */}
                <div className="grid grid-cols-3 gap-2">
                    <div
                        className="rounded-lg p-1.5 sm:p-2 text-[0.6rem] sm:text-xs text-center font-mono leading-tight whitespace-nowrap"
                        style={{ backgroundColor: modeData.colors.primary, color: '#fff' }}
                    >
                        Primary
                    </div>
                    <div
                        className="rounded-lg p-1.5 sm:p-2 text-[0.6rem] sm:text-xs text-center font-mono leading-tight whitespace-nowrap"
                        style={{ backgroundColor: modeData.colors.secondary, color: '#fff' }}
                    >
                        Secondary
                    </div>
                    <div
                        className="rounded-lg p-1.5 sm:p-2 text-[0.6rem] sm:text-xs text-center font-mono leading-tight whitespace-nowrap"
                        style={{ backgroundColor: modeData.colors.accent, color: '#fff' }}
                    >
                        Accent
                    </div>
                </div>

                {/* Typography sample */}
                <div className="space-y-2">
                    <h4
                        className="font-bold"
                        style={{
                            fontFamily: modeData.typography.h4.fontName,
                            fontSize: `${modeData.typography.h4.fontSize}rem`,
                            color: modeData.typography.h4.color,
                            fontWeight: modeData.typography.h4.fontWeight || 400,
                        }}
                    >
                        Heading Sample
                    </h4>
                    <p
                        className="text-p-font text-p-size"
                        style={{
                            fontFamily: modeData.typography.paragraph.fontName,
                            fontSize: `${modeData.typography.paragraph.fontSize}rem`,
                            color: modeData.typography.paragraph.color,
                            fontWeight: modeData.typography.paragraph.fontWeight || 400,
                            lineHeight: modeData.typography.paragraph.lineHeight || 1.6,
                        }}
                    >
                        Paragraph text sample showing the typography settings.
                    </p>
                </div>

                {/* Button sample */}
                <button
                    className="theme-button mt-auto"
                    style={{
                        backgroundColor: modeData.colors.primary,
                        color: modeData.typography.decorator.color,
                    }}
                >
                    Button
                </button>
            </div>
        </div>
    );
};

export const ThemePreview: React.FC<ThemePreviewProps> = ({
    theme,
    onEdit,
    onClose,
    onPublish,
}) => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="h-16 palette-surface border-b palette-border px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold">Preview: {theme.name}</h2>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-p-color rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 text-sm font-medium text-white theme-button-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Theme
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                        <PaletteCard
                            mode="light"
                            theme={theme}
                            onEdit={() => onEdit()}
                        />
                        <PaletteCard
                            mode="dark"
                            theme={theme}
                            onEdit={() => onEdit()}
                        />
                        <PaletteCard
                            mode="accessibility"
                            theme={theme}
                            onEdit={() => onEdit()}
                        />
                    </div>

                    {/* Publish button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={onPublish}
                            className="px-8 py-4 text-lg font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg transition-colors flex items-center gap-3"
                        >
                            <Eye className="w-6 h-6" />
                            Set Theme to Site
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
