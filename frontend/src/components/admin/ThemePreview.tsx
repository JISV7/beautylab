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
        <div className="theme-surface rounded-xl border theme-border overflow-hidden shadow-sm">
            <div className="p-4 border-b theme-border flex items-center justify-between">
                <h3 className="font-bold theme-text-base capitalize">{mode} Mode</h3>
                <button
                    onClick={onEdit}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Edit
                </button>
            </div>
            <div className="p-6 space-y-4" style={{ backgroundColor: modeData.colors.background }}>
                {/* Color swatches */}
                <div className="grid grid-cols-3 gap-2">
                    <div
                        className="rounded-lg p-2 text-xs text-center font-mono"
                        style={{ backgroundColor: modeData.colors.primary, color: '#fff' }}
                    >
                        Primary
                    </div>
                    <div
                        className="rounded-lg p-2 text-xs text-center font-mono"
                        style={{ backgroundColor: modeData.colors.secondary, color: '#fff' }}
                    >
                        Secondary
                    </div>
                    <div
                        className="rounded-lg p-2 text-xs text-center font-mono"
                        style={{ backgroundColor: modeData.colors.accent, color: '#fff' }}
                    >
                        Accent
                    </div>
                </div>

                {/* Typography sample */}
                <div className="space-y-2">
                    <h4
                        className="font-bold theme-text-base"
                        style={{
                            fontFamily: modeData.typography.h1.fontName || 'system-ui',
                            fontSize: `${modeData.typography.h1.fontSize}rem`,
                            color: modeData.typography.h1.color
                        }}
                    >
                        Heading Sample
                    </h4>
                    <p
                        className="theme-text-secondary"
                        style={{
                            fontFamily: modeData.typography.paragraph.fontName || 'system-ui',
                            fontSize: `${modeData.typography.paragraph.fontSize}rem`,
                            color: modeData.typography.paragraph.color
                        }}
                    >
                        Paragraph text sample showing the typography settings.
                    </p>
                </div>

                {/* Button sample */}
                <button
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ backgroundColor: modeData.colors.primary, color: '#FFFFFF' }}
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
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <header className="h-16 theme-surface border-b theme-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold theme-text-base">Preview: {theme.name}</h2>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium theme-text-secondary rounded-lg border theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 text-sm font-medium text-white theme-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Theme
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            Publish This Theme to Site
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
