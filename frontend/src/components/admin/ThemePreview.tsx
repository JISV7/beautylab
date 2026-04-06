import React from 'react';
import { Eye, Edit, X } from 'lucide-react';
import type { ThemePreviewProps } from './types';

interface PaletteCardProps {
    mode: 'light' | 'dark' | 'accessibility';
    theme: ThemePreviewProps['theme'];
    onEdit: (mode: 'light' | 'dark' | 'accessibility') => void;
    headerRef?: (el: HTMLDivElement | null) => void;
}

const PaletteCard: React.FC<PaletteCardProps> = ({ mode, theme, onEdit, headerRef }) => {
    const modeData = theme.config[mode];

    // Build CSS variables for this card's mode
    const cardStyle: React.CSSProperties = {
        backgroundColor: modeData.colors.surface,
        borderColor: modeData.colors.border,
        // Set typography CSS variables for this mode
        ['--text-h1-font' as string]: modeData.typography.h1.fontName,
        ['--text-h1-size' as string]: `${modeData.typography.h1.fontSize}rem`,
        ['--text-h1-color' as string]: modeData.typography.h1.color,
        ['--text-h1-weight' as string]: String(modeData.typography.h1.fontWeight || 400),
        ['--text-h1-line-height' as string]: modeData.typography.h1.lineHeight || '1.2',
        ['--text-h4-font' as string]: modeData.typography.h4.fontName,
        ['--text-h4-size' as string]: `${modeData.typography.h4.fontSize}rem`,
        ['--text-h4-color' as string]: modeData.typography.h4.color,
        ['--text-h4-weight' as string]: String(modeData.typography.h4.fontWeight || 400),
        ['--text-p-font' as string]: modeData.typography.paragraph.fontName,
        ['--text-p-size' as string]: `${modeData.typography.paragraph.fontSize}rem`,
        ['--text-p-color' as string]: modeData.typography.paragraph.color,
        ['--text-p-weight' as string]: String(modeData.typography.paragraph.fontWeight || 400),
        ['--text-p-line-height' as string]: modeData.typography.paragraph.lineHeight || '1.6',
        ['--decorator-color' as string]: modeData.typography.decorator.color,
        ['--palette-primary' as string]: modeData.colors.primary,
        ['--palette-secondary' as string]: modeData.colors.secondary,
        ['--palette-accent' as string]: modeData.colors.accent,
        ['--palette-surface' as string]: modeData.colors.surface,
        ['--palette-background' as string]: modeData.colors.background,
        ['--palette-border' as string]: modeData.colors.border,
    } as any;

    return (
        <div
            className="theme-card h-full flex flex-col"
            style={cardStyle}
        >
            <div
                ref={headerRef}
                className="p-4 border-b shrink-0 relative flex items-center"
            >
                <h3
                    className="font-bold capitalize pr-20 text-h4"
                >
                    {mode} Mode
                </h3>
                <button
                    onClick={() => onEdit(mode)}
                    className="absolute top-4 right-4 text-sm hover:underline text-palette-primary"
                >
                    Edit
                </button>
            </div>
            <div className="p-6 space-y-4 flex-1" style={{ backgroundColor: 'var(--palette-background)' }}>
                {/* Color swatches */}
                <div className="grid grid-cols-3 gap-2 min-w-0">
                    <div
                        className="rounded-lg px-1 py-2 text-center break-words text-paragraph"
                        style={{ backgroundColor: 'var(--palette-primary)' }}
                    >
                        Primary
                    </div>
                    <div
                        className="rounded-lg px-1 py-2 text-center break-words text-paragraph"
                        style={{ backgroundColor: 'var(--palette-secondary)' }}
                    >
                        Secondary
                    </div>
                    <div
                        className="rounded-lg px-1 py-2 text-center break-words text-paragraph"
                        style={{ backgroundColor: 'var(--palette-accent)' }}
                    >
                        Accent
                    </div>
                </div>

                {/* Typography sample */}
                <div className="space-y-2">
                    <h1 className="text-h1">
                        Heading Sample H1
                    </h1>
                    <p className="text-paragraph">
                        Paragraph text sample showing the typography settings.
                    </p>
                </div>

                {/* Button sample */}
                <button className="theme-button theme-button-primary mt-auto">
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
    const headerRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // Sync header heights to match the tallest
    React.useEffect(() => {
        const heights = headerRefs.current.map(ref => ref?.offsetHeight || 0);
        const maxHeight = Math.max(...heights);
        headerRefs.current.forEach(ref => {
            if (ref) {
                ref.style.height = `${maxHeight}px`;
            }
        });
    }, [theme]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="h-16 palette-surface border-b palette-border px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold">Preview: {theme.name}</h2>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-paragraph rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </button>
                    <button
                        onClick={() => onEdit('light')}
                        className="px-4 py-2 text-sm font-medium text-white theme-button-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Theme
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 gap-6">
                        <PaletteCard
                            mode="light"
                            theme={theme}
                            onEdit={onEdit}
                            headerRef={el => headerRefs.current[0] = el}
                        />
                        <PaletteCard
                            mode="dark"
                            theme={theme}
                            onEdit={onEdit}
                            headerRef={el => headerRefs.current[1] = el}
                        />
                        <PaletteCard
                            mode="accessibility"
                            theme={theme}
                            onEdit={onEdit}
                            headerRef={el => headerRefs.current[2] = el}
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
