import React from 'react';
import { Save, Palette, Type, Eye, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeEditorProps, ColorPalette, TypographyStyle } from './types';
import type { Font } from '../../data/theme.types';
import { ColorEditor } from './ColorEditor';
import { TypographyEditor } from './TypographyEditor';
import { FontManager } from './FontManager';

export const ThemeEditor: React.FC<ThemeEditorProps> = ({
    theme,
    activeMode,
    onModeChange,
    onSave,
    onPublish,
    onPreview,
    onBack,
}) => {
    const { fetchFonts, uploadFont, deleteFont } = useTheme();
    const [activeTab, setActiveTab] = React.useState<'colors' | 'typography'>('colors');
    const [fonts, setFonts] = React.useState<Font[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch available fonts on mount
    React.useEffect(() => {
        const loadFonts = async () => {
            const loadedFonts = await fetchFonts();
            setFonts(loadedFonts);
        };
        loadFonts();
    }, [fetchFonts]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploading(true);
            // Upload all files in parallel
            await Promise.all(Array.from(files).map(file => uploadFont(file)));

            // Refresh fonts from context to inject @font-face rules
            const allFonts = await fetchFonts();
            setFonts(allFonts);

            // Clear the input
            if (event.target) {
                event.target.value = '';
            }
        } catch (error: any) {
            console.error('Failed to upload fonts:', error);
            alert(error.response?.data?.detail || 'Failed to upload fonts');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFont = async (font: Font) => {
        try {
            await deleteFont(font.id);
            // Refresh fonts from context to update the list
            const allFonts = await fetchFonts();
            setFonts(allFonts);
        } catch (error: any) {
            console.error('Failed to delete font:', error);
            alert(error.response?.data?.detail || 'Failed to delete font');
        }
    };

    const handleApplyFontToAll = (font: Font) => {
        const fontName = font.name;
        const fontId = font.id;
        // Apply the selected font to all H1-H6 and P elements
        setStyles(prev => ({
            ...prev,
            h1: { ...prev.h1, fontFamily: fontName, fontId },
            h2: { ...prev.h2, fontFamily: fontName, fontId },
            h3: { ...prev.h3, fontFamily: fontName, fontId },
            h4: { ...prev.h4, fontFamily: fontName, fontId },
            h5: { ...prev.h5, fontFamily: fontName, fontId },
            h6: { ...prev.h6, fontFamily: fontName, fontId },
            p: { ...prev.p, fontFamily: fontName, fontId },
        }));
    };

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
            fontFamily: theme.config[activeMode].typography.h1?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.h1?.fontId || '',
            size: parseFloat(theme.config[activeMode].typography.h1?.fontSize || '2.492'),
            color: theme.config[activeMode].typography.h1?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h1?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h1?.lineHeight || '1.2'
        },
        h2: {
            fontFamily: theme.config[activeMode].typography.h2?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.h2?.fontId || '',
            size: parseFloat(theme.config[activeMode].typography.h2?.fontSize || '2.074'),
            color: theme.config[activeMode].typography.h2?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h2?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h2?.lineHeight || '1.2'
        },
        h3: {
            fontFamily: theme.config[activeMode].typography.h3?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.h3?.fontId || '',
            size: parseFloat(theme.config[activeMode].typography.h3?.fontSize || '1.73'),
            color: theme.config[activeMode].typography.h3?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h3?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h3?.lineHeight || '1.3'
        },
        h4: {
            fontFamily: theme.config[activeMode].typography.h4?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.h4?.fontId || '',
            size: parseFloat(theme.config[activeMode].typography.h4?.fontSize || '1.44'),
            color: theme.config[activeMode].typography.h4?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h4?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h4?.lineHeight || '1.4'
        },
        h5: {
            fontFamily: theme.config[activeMode].typography.h5?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.h5?.fontId || '',
            size: parseFloat(theme.config[activeMode].typography.h5?.fontSize || '1.2'),
            color: theme.config[activeMode].typography.h5?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h5?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h5?.lineHeight || '1.4'
        },
        h6: {
            fontFamily: theme.config[activeMode].typography.h6?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.h6?.fontId || '',
            size: parseFloat(theme.config[activeMode].typography.h6?.fontSize || '1.0'),
            color: theme.config[activeMode].typography.h6?.color || '#000000',
            fontWeight: theme.config[activeMode].typography.h6?.fontWeight || 400,
            lineHeight: theme.config[activeMode].typography.h6?.lineHeight || '1.5'
        },
        p: {
            fontFamily: theme.config[activeMode].typography.paragraph?.fontName || 'Roboto',
            fontId: theme.config[activeMode].typography.paragraph?.fontId || '',
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
                fontFamily: modeData.typography.h1?.fontName || 'Roboto',
                fontId: modeData.typography.h1?.fontId || '',
                size: parseFloat(modeData.typography.h1?.fontSize || '2.492'),
                color: modeData.typography.h1?.color || '#000000',
                fontWeight: modeData.typography.h1?.fontWeight || 400,
                lineHeight: modeData.typography.h1?.lineHeight || '1.2'
            },
            h2: {
                fontFamily: modeData.typography.h2?.fontName || 'Roboto',
                fontId: modeData.typography.h2?.fontId || '',
                size: parseFloat(modeData.typography.h2?.fontSize || '2.074'),
                color: modeData.typography.h2?.color || '#000000',
                fontWeight: modeData.typography.h2?.fontWeight || 400,
                lineHeight: modeData.typography.h2?.lineHeight || '1.2'
            },
            h3: {
                fontFamily: modeData.typography.h3?.fontName || 'Roboto',
                fontId: modeData.typography.h3?.fontId || '',
                size: parseFloat(modeData.typography.h3?.fontSize || '1.73'),
                color: modeData.typography.h3?.color || '#000000',
                fontWeight: modeData.typography.h3?.fontWeight || 400,
                lineHeight: modeData.typography.h3?.lineHeight || '1.3'
            },
            h4: {
                fontFamily: modeData.typography.h4?.fontName || 'Roboto',
                fontId: modeData.typography.h4?.fontId || '',
                size: parseFloat(modeData.typography.h4?.fontSize || '1.44'),
                color: modeData.typography.h4?.color || '#000000',
                fontWeight: modeData.typography.h4?.fontWeight || 400,
                lineHeight: modeData.typography.h4?.lineHeight || '1.4'
            },
            h5: {
                fontFamily: modeData.typography.h5?.fontName || 'Roboto',
                fontId: modeData.typography.h5?.fontId || '',
                size: parseFloat(modeData.typography.h5?.fontSize || '1.2'),
                color: modeData.typography.h5?.color || '#000000',
                fontWeight: modeData.typography.h5?.fontWeight || 400,
                lineHeight: modeData.typography.h5?.lineHeight || '1.4'
            },
            h6: {
                fontFamily: modeData.typography.h6?.fontName || 'Roboto',
                fontId: modeData.typography.h6?.fontId || '',
                size: parseFloat(modeData.typography.h6?.fontSize || '1.0'),
                color: modeData.typography.h6?.color || '#000000',
                fontWeight: modeData.typography.h6?.fontWeight || 400,
                lineHeight: modeData.typography.h6?.lineHeight || '1.5'
            },
            p: {
                fontFamily: modeData.typography.paragraph?.fontName || 'Roboto',
                fontId: modeData.typography.paragraph?.fontId || '',
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

    // Typography size validation
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

    const validateTypographySizes = React.useCallback(() => {
        const errors: string[] = [];
        const sizes: Record<string, number> = {
            h1: styles.h1.size,
            h2: styles.h2.size,
            h3: styles.h3.size,
            h4: styles.h4.size,
            h5: styles.h5.size,
            h6: styles.h6.size,
            p: styles.p.size,
        };

        // Check H6 >= P
        if (sizes.h6 < sizes.p) {
            errors.push(
                `H6 size (${sizes.h6}rem) must be at least equal to Paragraph size (${sizes.p}rem). Minimum required: ${sizes.p}rem`
            );
        }

        // Define hierarchy checks: [higher, lower]
        const hierarchyChecks: Array<[string, string]> = [
            ['h5', 'h6'],
            ['h4', 'h5'],
            ['h3', 'h4'],
            ['h2', 'h3'],
            ['h1', 'h2'],
        ];

        for (const [higher, lower] of hierarchyChecks) {
            const minRequired = sizes[lower] * 1.2;
            if (sizes[higher] < minRequired) {
                errors.push(
                    `${higher.toUpperCase()} size (${sizes[higher]}rem) must be at least 1.2× ${lower.toUpperCase()} size (${sizes[lower]}rem). Minimum required: ${minRequired.toFixed(3)}rem`
                );
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    }, [styles]);

    // Validate when styles change
    React.useEffect(() => {
        validateTypographySizes();
    }, [validateTypographySizes]);

    const handleSave = () => {
        // Check validation before saving
        if (validationErrors.length > 0) {
            alert('Please fix the following typography errors before saving:\n\n' + validationErrors.join('\n'));
            return;
        }
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
                fontFamily: modeData.typography.h1?.fontName || 'Roboto',
                fontId: modeData.typography.h1?.fontId || '',
                size: parseFloat(modeData.typography.h1?.fontSize || '2.492'),
                color: modeData.typography.h1?.color || '#000000',
                fontWeight: modeData.typography.h1?.fontWeight || 400,
                lineHeight: modeData.typography.h1?.lineHeight || '1.2'
            },
            h2: {
                fontFamily: modeData.typography.h2?.fontName || 'Roboto',
                fontId: modeData.typography.h2?.fontId || '',
                size: parseFloat(modeData.typography.h2?.fontSize || '2.074'),
                color: modeData.typography.h2?.color || '#000000',
                fontWeight: modeData.typography.h2?.fontWeight || 400,
                lineHeight: modeData.typography.h2?.lineHeight || '1.2'
            },
            h3: {
                fontFamily: modeData.typography.h3?.fontName || 'Roboto',
                fontId: modeData.typography.h3?.fontId || '',
                size: parseFloat(modeData.typography.h3?.fontSize || '1.73'),
                color: modeData.typography.h3?.color || '#000000',
                fontWeight: modeData.typography.h3?.fontWeight || 400,
                lineHeight: modeData.typography.h3?.lineHeight || '1.3'
            },
            h4: {
                fontFamily: modeData.typography.h4?.fontName || 'Roboto',
                fontId: modeData.typography.h4?.fontId || '',
                size: parseFloat(modeData.typography.h4?.fontSize || '1.44'),
                color: modeData.typography.h4?.color || '#000000',
                fontWeight: modeData.typography.h4?.fontWeight || 400,
                lineHeight: modeData.typography.h4?.lineHeight || '1.4'
            },
            h5: {
                fontFamily: modeData.typography.h5?.fontName || 'Roboto',
                fontId: modeData.typography.h5?.fontId || '',
                size: parseFloat(modeData.typography.h5?.fontSize || '1.2'),
                color: modeData.typography.h5?.color || '#000000',
                fontWeight: modeData.typography.h5?.fontWeight || 400,
                lineHeight: modeData.typography.h5?.lineHeight || '1.4'
            },
            h6: {
                fontFamily: modeData.typography.h6?.fontName || 'Roboto',
                fontId: modeData.typography.h6?.fontId || '',
                size: parseFloat(modeData.typography.h6?.fontSize || '1.0'),
                color: modeData.typography.h6?.color || '#000000',
                fontWeight: modeData.typography.h6?.fontWeight || 400,
                lineHeight: modeData.typography.h6?.lineHeight || '1.5'
            },
            p: {
                fontFamily: modeData.typography.paragraph?.fontName || 'Roboto',
                fontId: modeData.typography.paragraph?.fontId || '',
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
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                        Edit: {theme.name}
                    </h2>
                </div>
                <div className="flex gap-2 flex-wrap items-center justify-end shrink-0">
                    <button
                        onClick={onPreview}
                        className="px-3 py-2 text-xs sm:text-sm font-medium text-paragraph rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 shrink-0"
                        title="Preview theme"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                    </button>
                    <button
                        onClick={handleDiscard}
                        className="px-3 py-2 text-xs sm:text-sm font-medium text-paragraph rounded-lg border palette-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 shrink-0"
                        title="Discard changes"
                    >
                        <span className="hidden sm:inline">Discard</span>
                        <X className="w-4 h-4 sm:hidden" />
                    </button>
                    <button
                        onClick={onPublish}
                        className="px-3 py-2 text-xs sm:text-sm font-medium decorator-color bg-palette-secondary hover:opacity-90 rounded-lg shadow-sm transition-opacity flex items-center gap-2 shrink-0"
                        title="Set theme to site"
                    >
                        <span className="sm:hidden">Set theme</span>
                        <span className="hidden sm:inline">Set Theme to Site</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-2 text-xs sm:text-sm font-medium text-white theme-button-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
                        title="Save changes"
                    >
                        <Save className="w-4 h-4 sm:hidden" />
                        <span className="hidden sm:inline">Save Changes</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Validation Error Banner */}
                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0">
                                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                                        Typography Size Validation Errors
                                    </h3>
                                    <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                                        {validationErrors.map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mode Tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {(['light', 'dark', 'accessibility'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => onModeChange(mode)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors capitalize ${
                                    activeMode === mode
                                        ? 'theme-button theme-button-primary'
                                        : 'text-paragraph hover:bg-black/5 dark:hover:bg-white/5'
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
                                    : 'text-paragraph hover:text-slate-900 dark:hover:text-white'
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
                                    : 'text-paragraph hover:text-slate-900 dark:hover:text-white'
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
                        <div className="space-y-8">
                            <FontManager
                                installedFonts={fonts}
                                uploading={uploading}
                                fileInputRef={fileInputRef}
                                onFileUpload={handleFileUpload}
                                onFontDelete={handleDeleteFont}
                                onApplyToAll={handleApplyFontToAll}
                            />
                            <div>
                                <TypographyEditor
                                    styles={styles}
                                    colors={colors}
                                    fonts={fonts}
                                    onStyleChange={handleStyleChange}
                                    validationErrors={validationErrors}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
