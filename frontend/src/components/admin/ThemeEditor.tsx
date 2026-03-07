import React from 'react';
import { Save, Palette, Type, Eye, X } from 'lucide-react';
import type { ThemeEditorProps, ColorPalette, TypographyStyle } from './types';
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
    const [activeTab, setActiveTab] = React.useState<'colors' | 'typography'>('colors');

    // Color state
    const [colors, setColors] = React.useState<ColorPalette>({
        primary: theme[activeMode].colors.primary,
        secondary: theme[activeMode].colors.secondary,
        accent: theme[activeMode].colors.accent,
        background: theme[activeMode].colors.background,
        surface: theme[activeMode].colors.surface,
        border: theme[activeMode].colors.border,
    });

    // Typography state
    const [styles, setStyles] = React.useState<Record<string, TypographyStyle>>({
        h1: {
            fontFamily: theme[activeMode].typography.h1?.fontFamily || theme[activeMode].typography.title?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.h1?.fontSize || '2.5'),
            color: theme[activeMode].typography.h1?.color || theme[activeMode].typography.title?.color || theme[activeMode].colors.text
        },
        h2: {
            fontFamily: theme[activeMode].typography.h2?.fontFamily || theme[activeMode].typography.title?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.h2?.fontSize || '2.0'),
            color: theme[activeMode].typography.h2?.color || theme[activeMode].typography.title?.color || theme[activeMode].colors.text
        },
        h3: {
            fontFamily: theme[activeMode].typography.h3?.fontFamily || theme[activeMode].typography.title?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.h3?.fontSize || '1.75'),
            color: theme[activeMode].typography.h3?.color || theme[activeMode].typography.title?.color || theme[activeMode].colors.text
        },
        h4: {
            fontFamily: theme[activeMode].typography.h4?.fontFamily || theme[activeMode].typography.title?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.h4?.fontSize || '1.5'),
            color: theme[activeMode].typography.h4?.color || theme[activeMode].typography.title?.color || theme[activeMode].colors.text
        },
        h5: {
            fontFamily: theme[activeMode].typography.h5?.fontFamily || theme[activeMode].typography.title?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.h5?.fontSize || '1.25'),
            color: theme[activeMode].typography.h5?.color || theme[activeMode].typography.title?.color || theme[activeMode].colors.text
        },
        h6: {
            fontFamily: theme[activeMode].typography.h6?.fontFamily || theme[activeMode].typography.title?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.h6?.fontSize || '1.0'),
            color: theme[activeMode].typography.h6?.color || theme[activeMode].typography.title?.color || theme[activeMode].colors.text
        },
        p: {
            fontFamily: theme[activeMode].typography.paragraph?.fontFamily || 'Manrope',
            size: parseFloat(theme[activeMode].typography.paragraph?.fontSize || '1.0'),
            color: theme[activeMode].typography.paragraph?.color || theme[activeMode].colors.textSecondary
        }
    });

    // Sync when mode changes
    React.useEffect(() => {
        const modeData = theme[activeMode];
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
        });

        setStyles({
            h1: {
                fontFamily: modeData.typography.h1?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h1?.fontSize || '2.5'),
                color: modeData.typography.h1?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h2: {
                fontFamily: modeData.typography.h2?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h2?.fontSize || '2.0'),
                color: modeData.typography.h2?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h3: {
                fontFamily: modeData.typography.h3?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h3?.fontSize || '1.75'),
                color: modeData.typography.h3?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h4: {
                fontFamily: modeData.typography.h4?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h4?.fontSize || '1.5'),
                color: modeData.typography.h4?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h5: {
                fontFamily: modeData.typography.h5?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h5?.fontSize || '1.25'),
                color: modeData.typography.h5?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h6: {
                fontFamily: modeData.typography.h6?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h6?.fontSize || '1.0'),
                color: modeData.typography.h6?.color || modeData.typography.title?.color || modeData.colors.text
            },
            p: {
                fontFamily: modeData.typography.paragraph?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.paragraph?.fontSize || '1.0'),
                color: modeData.typography.paragraph?.color || modeData.colors.textSecondary
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
        onSave(colors, styles);
    };

    const handleDiscard = () => {
        const modeData = theme[activeMode];
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
        });

        setStyles({
            h1: {
                fontFamily: modeData.typography.h1?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h1?.fontSize || '2.5'),
                color: modeData.typography.h1?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h2: {
                fontFamily: modeData.typography.h2?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h2?.fontSize || '2.0'),
                color: modeData.typography.h2?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h3: {
                fontFamily: modeData.typography.h3?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h3?.fontSize || '1.75'),
                color: modeData.typography.h3?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h4: {
                fontFamily: modeData.typography.h4?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h4?.fontSize || '1.5'),
                color: modeData.typography.h4?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h5: {
                fontFamily: modeData.typography.h5?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h5?.fontSize || '1.25'),
                color: modeData.typography.h5?.color || modeData.typography.title?.color || modeData.colors.text
            },
            h6: {
                fontFamily: modeData.typography.h6?.fontFamily || modeData.typography.title?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.h6?.fontSize || '1.0'),
                color: modeData.typography.h6?.color || modeData.typography.title?.color || modeData.colors.text
            },
            p: {
                fontFamily: modeData.typography.paragraph?.fontFamily || 'Manrope',
                size: parseFloat(modeData.typography.paragraph?.fontSize || '1.0'),
                color: modeData.typography.paragraph?.color || modeData.colors.textSecondary
            }
        });
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            {/* Header */}
            <header className="h-16 theme-surface border-b theme-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5 theme-text-secondary" />
                    </button>
                    <h2 className="text-xl font-bold theme-text-base">
                        Edit: {theme.name}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDiscard}
                        className="px-4 py-2 text-sm font-medium theme-text-secondary rounded-lg border theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={onPublish}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        Publish Theme
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white theme-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Mode Tabs */}
                    <div className="flex items-center gap-2">
                        {(['light', 'dark', 'accessibility'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => onModeChange(mode)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors capitalize ${
                                    activeMode === mode
                                        ? 'bg-blue-500 text-white'
                                        : 'theme-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Content Tabs */}
                    <div className="flex gap-4 border-b theme-border">
                        <button
                            onClick={() => setActiveTab('colors')}
                            className={`pb-2 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'colors'
                                    ? 'text-blue-600 border-b-2 border-blue-500'
                                    : 'theme-text-secondary hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Palette className="w-4 h-4" />
                            Colors
                        </button>
                        <button
                            onClick={() => setActiveTab('typography')}
                            className={`pb-2 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'typography'
                                    ? 'text-blue-600 border-b-2 border-blue-500'
                                    : 'theme-text-secondary hover:text-slate-900 dark:hover:text-white'
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
                            activeMode={activeMode}
                            colors={colors}
                            onStyleChange={handleStyleChange}
                            onFontUploaded={() => {}}
                            onFontDeleted={() => {}}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
