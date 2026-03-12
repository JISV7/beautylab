import React from 'react';
import { Save, Palette, Type, Eye, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeEditorProps, ColorPalette, TypographyStyle } from './types';
import type { Font } from '../../data/theme.types';
import { ColorEditor } from './ColorEditor';
import { TypographyEditor } from './TypographyEditor';

export const ThemeEditor: React.FC<ThemeEditorProps> = ({
    theme,
    activeMode,
    onModeChange,
    onSave,
    onPublish,
    onBack,
}) => {
    const { fetchFonts } = useTheme();
    const [activeTab, setActiveTab] = React.useState<'colors' | 'typography'>('colors');
    const [fonts, setFonts] = React.useState<Font[]>([]);

    // Fetch available fonts on mount
    React.useEffect(() => {
        const loadFonts = async () => {
            const loadedFonts = await fetchFonts();
            setFonts(loadedFonts);
        };
        loadFonts();
    }, [fetchFonts]);

    // Color state
    const [colors, setColors] = React.useState<ColorPalette>({
        primary: theme.config[activeMode].colors.primary,
        secondary: theme.config[activeMode].colors.secondary,
        accent: theme.config[activeMode].colors.accent,
        background: theme.config[activeMode].colors.background,
        surface: theme.config[activeMode].colors.surface,
        border: theme.config[activeMode].colors.border,
        decorator: theme.config[activeMode].colors.decorator || theme.config[activeMode].typography.decorator?.color || '#ffffff',
    });

    // Typography state
    const [styles, setStyles] = React.useState<Record<string, TypographyStyle>>({
        h1: {
            fontFamily: theme.config[activeMode].typography.h1?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.h1?.fontSize || '2.5'),
            color: theme.config[activeMode].typography.h1?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h1?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h1?.lineHeight || '1.2'
        },
        h2: {
            fontFamily: theme.config[activeMode].typography.h2?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.h2?.fontSize || '2.0'),
            color: theme.config[activeMode].typography.h2?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h2?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h2?.lineHeight || '1.2'
        },
        h3: {
            fontFamily: theme.config[activeMode].typography.h3?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.h3?.fontSize || '1.75'),
            color: theme.config[activeMode].typography.h3?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h3?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h3?.lineHeight || '1.3'
        },
        h4: {
            fontFamily: theme.config[activeMode].typography.h4?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.h4?.fontSize || '1.5'),
            color: theme.config[activeMode].typography.h4?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h4?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h4?.lineHeight || '1.4'
        },
        h5: {
            fontFamily: theme.config[activeMode].typography.h5?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.h5?.fontSize || '1.25'),
            color: theme.config[activeMode].typography.h5?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h5?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h5?.lineHeight || '1.4'
        },
        h6: {
            fontFamily: theme.config[activeMode].typography.h6?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.h6?.fontSize || '1.0'),
            color: theme.config[activeMode].typography.h6?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h6?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h6?.lineHeight || '1.5'
        },
        p: {
            fontFamily: theme.config[activeMode].typography.paragraph?.fontName || 'Manrope',
            size: parseFloat(theme.config[activeMode].typography.paragraph?.fontSize || '1.0'),
            color: theme.config[activeMode].typography.paragraph?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.paragraph?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.paragraph?.lineHeight || '1.6'
        }
    });

    // Sync when mode changes
    React.useEffect(() => {
        const modeData = theme.config[activeMode];
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
            decorator: modeData.colors.decorator || modeData.typography.decorator?.color || '#ffffff',
        });

        setStyles({
            h1: {
                fontFamily: modeData.typography.h1?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h1?.fontSize || '2.5'),
                color: modeData.typography.h1?.color || '#000000',
                fontWeight: modeData.typography.h1?.fontWeight || 400,
                lineHeight: modeData.typography.h1?.lineHeight || '1.2'
            },
            h2: {
                fontFamily: modeData.typography.h2?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h2?.fontSize || '2.0'),
                color: modeData.typography.h2?.color || '#000000',
                fontWeight: modeData.typography.h2?.fontWeight || 400,
                lineHeight: modeData.typography.h2?.lineHeight || '1.2'
            },
            h3: {
                fontFamily: modeData.typography.h3?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h3?.fontSize || '1.75'),
                color: modeData.typography.h3?.color || '#000000',
                fontWeight: modeData.typography.h3?.fontWeight || 400,
                lineHeight: modeData.typography.h3?.lineHeight || '1.3'
            },
            h4: {
                fontFamily: modeData.typography.h4?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h4?.fontSize || '1.5'),
                color: modeData.typography.h4?.color || '#000000',
                fontWeight: modeData.typography.h4?.fontWeight || 400,
                lineHeight: modeData.typography.h4?.lineHeight || '1.4'
            },
            h5: {
                fontFamily: modeData.typography.h5?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h5?.fontSize || '1.25'),
                color: modeData.typography.h5?.color || '#000000',
                fontWeight: modeData.typography.h5?.fontWeight || 400,
                lineHeight: modeData.typography.h5?.lineHeight || '1.4'
            },
            h6: {
                fontFamily: modeData.typography.h6?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h6?.fontSize || '1.0'),
                color: modeData.typography.h6?.color || '#000000',
                fontWeight: modeData.typography.h6?.fontWeight || 400,
                lineHeight: modeData.typography.h6?.lineHeight || '1.5'
            },
            p: {
                fontFamily: modeData.typography.paragraph?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.paragraph?.fontSize || '1.0'),
                color: modeData.typography.paragraph?.color || '#000000',
                fontWeight: modeData.typography.paragraph?.fontWeight || 400,
                lineHeight: modeData.typography.paragraph?.lineHeight || '1.6'
            }
        });
    }, [activeMode, theme]);

    const handleColorChange = (key: keyof ColorPalette, value: string) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const handleStyleChange = (key: string, field: keyof TypographyStyle, value: string | number) => {
        setStyles(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSave = () => {
        const currentPalette = theme.config[activeMode];
        onSave(colors, styles, currentPalette);
    };

    const handleDiscard = () => {
        const modeData = theme.config[activeMode];
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
            decorator: modeData.colors.decorator || modeData.typography.decorator?.color || '#ffffff',
        });

        setStyles({
            h1: {
                fontFamily: modeData.typography.h1?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h1?.fontSize || '2.5'),
                color: modeData.typography.h1?.color || '#000000',
                fontWeight: modeData.typography.h1?.fontWeight || 400,
                lineHeight: modeData.typography.h1?.lineHeight || '1.2'
            },
            h2: {
                fontFamily: modeData.typography.h2?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h2?.fontSize || '2.0'),
                color: modeData.typography.h2?.color || '#000000',
                fontWeight: modeData.typography.h2?.fontWeight || 400,
                lineHeight: modeData.typography.h2?.lineHeight || '1.2'
            },
            h3: {
                fontFamily: modeData.typography.h3?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h3?.fontSize || '1.75'),
                color: modeData.typography.h3?.color || '#000000',
                fontWeight: modeData.typography.h3?.fontWeight || 400,
                lineHeight: modeData.typography.h3?.lineHeight || '1.3'
            },
            h4: {
                fontFamily: modeData.typography.h4?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h4?.fontSize || '1.5'),
                color: modeData.typography.h4?.color || '#000000',
                fontWeight: modeData.typography.h4?.fontWeight || 400,
                lineHeight: modeData.typography.h4?.lineHeight || '1.4'
            },
            h5: {
                fontFamily: modeData.typography.h5?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h5?.fontSize || '1.25'),
                color: modeData.typography.h5?.color || '#000000',
                fontWeight: modeData.typography.h5?.fontWeight || 400,
                lineHeight: modeData.typography.h5?.lineHeight || '1.4'
            },
            h6: {
                fontFamily: modeData.typography.h6?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.h6?.fontSize || '1.0'),
                color: modeData.typography.h6?.color || '#000000',
                fontWeight: modeData.typography.h6?.fontWeight || 400,
                lineHeight: modeData.typography.h6?.lineHeight || '1.5'
            },
            p: {
                fontFamily: modeData.typography.paragraph?.fontName || 'Manrope',
                size: parseFloat(modeData.typography.paragraph?.fontSize || '1.0'),
                color: modeData.typography.paragraph?.color || '#000000',
                fontWeight: modeData.typography.paragraph?.fontWeight || 400,
                lineHeight: modeData.typography.paragraph?.lineHeight || '1.6'
            }
        });
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="h-auto sm:h-16 palette-surface border-b palette-border px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 shrink-0 sticky top-0 z-10 py-3 sm:py-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold">
                        Edit: {theme.name}
                    </h2>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-wrap justify-end">
                    <button
                        onClick={handleDiscard}
                        className="px-3 py-2 text-xs sm:text-sm font-medium text-p-color rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                        title="Discard changes"
                    >
                        <span className="hidden sm:inline">Discard</span>
                        <X className="w-4 h-4 sm:hidden" />
                    </button>
                    <button
                        onClick={onPublish}
                        className="px-3 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        title="Set theme to site"
                    >
                        <Eye className="w-4 h-4 sm:hidden" />
                        <span className="hidden sm:inline">Set Theme to Site</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-2 text-xs sm:text-sm font-medium text-white theme-button-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                        title="Save changes"
                    >
                        <Save className="w-4 h-4 sm:hidden" />
                        <span className="hidden sm:inline">Save Changes</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Mode Tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {(['light', 'dark', 'accessibility'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => onModeChange(mode)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors capitalize ${
                                    activeMode === mode
                                        ? 'theme-button theme-button-primary'
                                        : 'text-p-color hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Content Tabs */}
                    <div className="flex gap-4 border-b palette-border">
                        <button
                            onClick={() => setActiveTab('colors')}
                            className={`pb-2 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'colors'
                                    ? 'text-palette-primary border-b-2 border-palette-primary'
                                    : 'text-p-color hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Palette className="w-4 h-4" />
                            Colors
                        </button>
                        <button
                            onClick={() => setActiveTab('typography')}
                            className={`pb-2 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'typography'
                                    ? 'text-palette-primary border-b-2 border-palette-primary'
                                    : 'text-p-color hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Type className="w-4 h-4" />
                            Typography
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'colors' ? (
                        <ColorEditor
                            colors={colors}
                            activeMode={activeMode}
                            styles={styles}
                            onColorChange={handleColorChange}
                        />
                    ) : (
                        <TypographyEditor
                            styles={styles}
                            colors={colors}
                            fonts={fonts}
                            onStyleChange={handleStyleChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
