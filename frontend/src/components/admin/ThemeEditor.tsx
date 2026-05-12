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
    const [activeTab, setActiveTab] = React.useState<'colors' | 'typography' | 'loader'>('colors');
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
        } catch (error) {
            console.error('Failed to upload fonts:', error);
            // In a real app we'd use a proper notification system
            alert('Failed to upload fonts');
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
        } catch (error) {
            console.error('Failed to delete font:', error);
            alert('Failed to delete font');
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

    // Initialize from the theme's current active mode
    const initialMode = activeMode;
    const initialColors: ColorPalette = {
        primary: theme.config[initialMode].colors.primary,
        secondary: theme.config[initialMode].colors.secondary,
        accent: theme.config[initialMode].colors.accent,
        background: theme.config[initialMode].colors.background,
        surface: theme.config[initialMode].colors.surface,
        border: theme.config[initialMode].colors.border,
        decorator: theme.config[initialMode].colors.decorator || theme.config[initialMode].typography.decorator?.color || '#ffffff',
    };

    const initialStyles: Record<string, TypographyStyle> = {
        h1: { fontFamily: theme.config[initialMode].typography.h1?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.h1?.fontId || '', size: parseFloat(theme.config[initialMode].typography.h1?.fontSize || '2.492'), color: theme.config[initialMode].typography.h1?.color || '#000000', fontWeight: theme.config[initialMode].typography.h1?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.h1?.lineHeight || '1.2' },
        h2: { fontFamily: theme.config[initialMode].typography.h2?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.h2?.fontId || '', size: parseFloat(theme.config[initialMode].typography.h2?.fontSize || '2.074'), color: theme.config[initialMode].typography.h2?.color || '#000000', fontWeight: theme.config[initialMode].typography.h2?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.h2?.lineHeight || '1.2' },
        h3: { fontFamily: theme.config[initialMode].typography.h3?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.h3?.fontId || '', size: parseFloat(theme.config[initialMode].typography.h3?.fontSize || '1.73'), color: theme.config[initialMode].typography.h3?.color || '#000000', fontWeight: theme.config[initialMode].typography.h3?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.h3?.lineHeight || '1.3' },
        h4: { fontFamily: theme.config[initialMode].typography.h4?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.h4?.fontId || '', size: parseFloat(theme.config[initialMode].typography.h4?.fontSize || '1.44'), color: theme.config[initialMode].typography.h4?.color || '#000000', fontWeight: theme.config[initialMode].typography.h4?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.h4?.lineHeight || '1.4' },
        h5: { fontFamily: theme.config[initialMode].typography.h5?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.h5?.fontId || '', size: parseFloat(theme.config[initialMode].typography.h5?.fontSize || '1.2'), color: theme.config[initialMode].typography.h5?.color || '#000000', fontWeight: theme.config[initialMode].typography.h5?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.h5?.lineHeight || '1.4' },
        h6: { fontFamily: theme.config[initialMode].typography.h6?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.h6?.fontId || '', size: parseFloat(theme.config[initialMode].typography.h6?.fontSize || '1.0'), color: theme.config[initialMode].typography.h6?.color || '#000000', fontWeight: theme.config[initialMode].typography.h6?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.h6?.lineHeight || '1.5' },
        p: { fontFamily: theme.config[initialMode].typography.paragraph?.fontName || 'Roboto', fontId: theme.config[initialMode].typography.paragraph?.fontId || '', size: parseFloat(theme.config[initialMode].typography.paragraph?.fontSize || '1.0'), color: theme.config[initialMode].typography.paragraph?.color || '#000000', fontWeight: theme.config[initialMode].typography.paragraph?.fontWeight || 400, lineHeight: theme.config[initialMode].typography.paragraph?.lineHeight || '1.6' },
    };

    // Buffer to hold edits for all modes during the session
    const editBufferRef = React.useRef<Record<string, { colors: ColorPalette, styles: Record<string, TypographyStyle>, loader: { enabled: boolean } }>>({
        light: { 
            colors: initialColors, 
            styles: initialStyles,
            loader: { 
                enabled: theme.config.light.colors.loader?.enabled ?? false
            }
        },
        dark: { 
            colors: initialColors, 
            styles: initialStyles,
            loader: { 
                enabled: theme.config.dark.colors.loader?.enabled ?? false
            }
        },
        accessibility: { 
            colors: initialColors, 
            styles: initialStyles,
            loader: { 
                enabled: theme.config.accessibility.colors.loader?.enabled ?? false
            }
        },
    });

    const [loader, setLoader] = React.useState(editBufferRef.current[initialMode].loader);
    const lastModeRef = React.useRef<string>(initialMode);

    // Active view state — mirrors the buffer for the current mode
    const [colors, setColors] = React.useState<ColorPalette>(initialColors);
    const [styles, setStyles] = React.useState<Record<string, TypographyStyle>>(initialStyles);

    // Use a ref to always have the latest state for mode-switching
    const currentStateRef = React.useRef({ colors, styles, loader });
    React.useEffect(() => {
        currentStateRef.current = { colors, styles, loader };
    }, [colors, styles, loader]);

    // When mode changes: save current edits to buffer, load the new mode's buffer
    React.useEffect(() => {
        const prevMode = lastModeRef.current;
        if (prevMode === activeMode) return;

        // Save current editing state to the previous mode's buffer
        editBufferRef.current[prevMode] = {
            colors: { ...currentStateRef.current.colors },
            styles: { ...currentStateRef.current.styles },
            loader: { ...currentStateRef.current.loader }
        };
        lastModeRef.current = activeMode;
        // Load the target mode's buffer
        const buf = editBufferRef.current[activeMode];
        setColors(buf.colors);
        setStyles(buf.styles);
        setLoader(buf.loader);
    }, [activeMode]);

    // When the saved theme config changes (after a successful save),
    // sync ALL mode buffers from the server state so they reflect
    // the latest persisted values. Also update the current view.
    React.useEffect(() => {
        for (const mode of ['light', 'dark', 'accessibility'] as const) {
            const md = theme.config[mode];
            editBufferRef.current[mode] = {
                colors: {
                    primary: md.colors.primary,
                    secondary: md.colors.secondary,
                    accent: md.colors.accent,
                    background: md.colors.background,
                    surface: md.colors.surface,
                    border: md.colors.border,
                    decorator: md.colors.decorator || md.typography.decorator?.color || '#ffffff',
                },
                styles: {
                    h1: { fontFamily: md.typography.h1?.fontName || 'Roboto', fontId: md.typography.h1?.fontId || '', size: parseFloat(md.typography.h1?.fontSize || '2.492'), color: md.typography.h1?.color || '#000000', fontWeight: md.typography.h1?.fontWeight || 400, lineHeight: md.typography.h1?.lineHeight || '1.2' },
                    h2: { fontFamily: md.typography.h2?.fontName || 'Roboto', fontId: md.typography.h2?.fontId || '', size: parseFloat(md.typography.h2?.fontSize || '2.074'), color: md.typography.h2?.color || '#000000', fontWeight: md.typography.h2?.fontWeight || 400, lineHeight: md.typography.h2?.lineHeight || '1.2' },
                    h3: { fontFamily: md.typography.h3?.fontName || 'Roboto', fontId: md.typography.h3?.fontId || '', size: parseFloat(md.typography.h3?.fontSize || '1.73'), color: md.typography.h3?.color || '#000000', fontWeight: md.typography.h3?.fontWeight || 400, lineHeight: md.typography.h3?.lineHeight || '1.3' },
                    h4: { fontFamily: md.typography.h4?.fontName || 'Roboto', fontId: md.typography.h4?.fontId || '', size: parseFloat(md.typography.h4?.fontSize || '1.44'), color: md.typography.h4?.color || '#000000', fontWeight: md.typography.h4?.fontWeight || 400, lineHeight: md.typography.h4?.lineHeight || '1.4' },
                    h5: { fontFamily: md.typography.h5?.fontName || 'Roboto', fontId: md.typography.h5?.fontId || '', size: parseFloat(md.typography.h5?.fontSize || '1.2'), color: md.typography.h5?.color || '#000000', fontWeight: md.typography.h5?.fontWeight || 400, lineHeight: md.typography.h5?.lineHeight || '1.4' },
                    h6: { fontFamily: md.typography.h6?.fontName || 'Roboto', fontId: md.typography.h6?.fontId || '', size: parseFloat(md.typography.h6?.fontSize || '1.0'), color: md.typography.h6?.color || '#000000', fontWeight: md.typography.h6?.fontWeight || 400, lineHeight: md.typography.h6?.lineHeight || '1.5' },
                    p: { fontFamily: md.typography.paragraph?.fontName || 'Roboto', fontId: md.typography.paragraph?.fontId || '', size: parseFloat(md.typography.paragraph?.fontSize || '1.0'), color: md.typography.paragraph?.color || '#000000', fontWeight: md.typography.paragraph?.fontWeight || 400, lineHeight: md.typography.paragraph?.lineHeight || '1.6' },
                },
                loader: {
                    enabled: md.colors.loader?.enabled ?? false
                }
            };
        }
        // Also sync the current view
        const md = theme.config[activeMode];
        setColors({
            primary: md.colors.primary, secondary: md.colors.secondary, accent: md.colors.accent,
            background: md.colors.background, surface: md.colors.surface, border: md.colors.border,
            decorator: md.colors.decorator || md.typography.decorator?.color || '#ffffff',
        });
        setStyles({
            h1: { fontFamily: md.typography.h1?.fontName || 'Roboto', fontId: md.typography.h1?.fontId || '', size: parseFloat(md.typography.h1?.fontSize || '2.492'), color: md.typography.h1?.color || '#000000', fontWeight: md.typography.h1?.fontWeight || 400, lineHeight: md.typography.h1?.lineHeight || '1.2' },
            h2: { fontFamily: md.typography.h2?.fontName || 'Roboto', fontId: md.typography.h2?.fontId || '', size: parseFloat(md.typography.h2?.fontSize || '2.074'), color: md.typography.h2?.color || '#000000', fontWeight: md.typography.h2?.fontWeight || 400, lineHeight: md.typography.h2?.lineHeight || '1.2' },
            h3: { fontFamily: md.typography.h3?.fontName || 'Roboto', fontId: md.typography.h3?.fontId || '', size: parseFloat(md.typography.h3?.fontSize || '1.73'), color: md.typography.h3?.color || '#000000', fontWeight: md.typography.h3?.fontWeight || 400, lineHeight: md.typography.h3?.lineHeight || '1.3' },
            h4: { fontFamily: md.typography.h4?.fontName || 'Roboto', fontId: md.typography.h4?.fontId || '', size: parseFloat(md.typography.h4?.fontSize || '1.44'), color: md.typography.h4?.color || '#000000', fontWeight: md.typography.h4?.fontWeight || 400, lineHeight: md.typography.h4?.lineHeight || '1.4' },
            h5: { fontFamily: md.typography.h5?.fontName || 'Roboto', fontId: md.typography.h5?.fontId || '', size: parseFloat(md.typography.h5?.fontSize || '1.2'), color: md.typography.h5?.color || '#000000', fontWeight: md.typography.h5?.fontWeight || 400, lineHeight: md.typography.h5?.lineHeight || '1.4' },
            h6: { fontFamily: md.typography.h6?.fontName || 'Roboto', fontId: md.typography.h6?.fontId || '', size: parseFloat(md.typography.h6?.fontSize || '1.0'), color: md.typography.h6?.color || '#000000', fontWeight: md.typography.h6?.fontWeight || 400, lineHeight: md.typography.h6?.lineHeight || '1.5' },
            p: { fontFamily: md.typography.paragraph?.fontName || 'Roboto', fontId: md.typography.paragraph?.fontId || '', size: parseFloat(md.typography.paragraph?.fontSize || '1.0'), color: md.typography.paragraph?.color || '#000000', fontWeight: md.typography.paragraph?.fontWeight || 400, lineHeight: md.typography.paragraph?.lineHeight || '1.6' },
        });
        setLoader({
            enabled: md.colors.loader?.enabled ?? false
        });
    }, [theme.config, activeMode]);

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

    const validateStyles = (): boolean => {
        const errors: string[] = [];
        const hTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        
        // H1 must be larger than H2, etc.
        for (let i = 0; i < hTags.length - 1; i++) {
            if (styles[hTags[i]].size <= styles[hTags[i+1]].size) {
                errors.push(`${hTags[i].toUpperCase()} should be larger than ${hTags[i+1].toUpperCase()}`);
            }
        }
        
        // Paragraph should be smaller than H6
        if (styles.p.size >= styles.h6.size) {
            errors.push('Paragraph should be smaller than H6');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSaveInternal = () => {
        if (!validateStyles()) {
            setActiveTab('typography');
            return;
        }

        // Save current active mode buffer before submitting
        const finalBuffer = {
            ...editBufferRef.current,
            [activeMode]: { colors, styles, loader }
        };
        onSave(finalBuffer, activeMode);
    };

    const handlePublishInternal = () => {
        if (!validateStyles()) {
            setActiveTab('typography');
            return;
        }

        onPublish();
    };

    const handlePreviewInternal = () => {
        // Just preview the current mode state
        onPreview();
    };

    return (
        <div className="flex flex-col h-full bg-[var(--palette-surface)] border-l border-[var(--palette-border)] shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--palette-border)] flex items-center justify-between shrink-0 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-paragraph"
                    >
                        <X size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-h2 flex items-center gap-2">
                            Theme Customizer
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-palette-primary text-white font-black tracking-wider">
                                {theme.isActive ? 'Live' : 'Draft'}
                            </span>
                        </h2>
                        <p className="text-xs text-paragraph opacity-60">Editing: {theme.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePreviewInternal}
                        className="p-2 text-paragraph hover:text-palette-primary transition-colors"
                        title="Preview theme"
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        onClick={handleSaveInternal}
                        className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-paragraph rounded-lg font-semibold transition-all border border-palette-border"
                    >
                        <Save size={18} />
                        <span className="hidden sm:inline">Save Draft</span>
                    </button>
                    <button
                        onClick={handlePublishInternal}
                        className="flex items-center gap-2 px-4 py-2 bg-palette-primary hover:opacity-90 text-white rounded-lg font-bold shadow-lg shadow-palette-primary/20 transition-all"
                    >
                        Publish
                    </button>
                </div>
            </div>

            {/* Mode Toggle & Tabs */}
            <div className="p-4 border-b border-[var(--palette-border)] space-y-4 shrink-0">
                {/* Mode Selector */}
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                    {(['light', 'dark', 'accessibility'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => onModeChange(mode)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                                activeMode === mode
                                    ? 'bg-[var(--palette-surface)] text-palette-primary shadow-sm ring-1 ring-black/5'
                                    : 'text-paragraph opacity-50 hover:opacity-80'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            activeTab === 'colors'
                                ? 'bg-palette-primary/10 text-palette-primary border border-palette-primary/20'
                                : 'text-paragraph opacity-60 hover:bg-black/5 hover:opacity-100'
                        }`}
                    >
                        <Palette size={16} />
                        Colors
                    </button>
                    <button
                        onClick={() => setActiveTab('typography')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            activeTab === 'typography'
                                ? 'bg-palette-primary/10 text-palette-primary border border-palette-primary/20'
                                : 'text-paragraph opacity-60 hover:bg-black/5 hover:opacity-100'
                        }`}
                    >
                        <Type size={16} />
                        Typography
                    </button>
                    <button
                        onClick={() => setActiveTab('loader')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            activeTab === 'loader'
                                ? 'bg-palette-primary/10 text-palette-primary border border-palette-primary/20'
                                : 'text-paragraph opacity-60 hover:bg-black/5 hover:opacity-100'
                        }`}
                    >
                        <Save size={16} />
                        Loader
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'colors' && (
                    <ColorEditor 
                        colors={colors} 
                        activeMode={activeMode}
                        styles={styles}
                        onColorChange={handleColorChange} 
                    />
                )}
                
                {activeTab === 'typography' && (
                    <div className="space-y-6">
                        {validationErrors.length > 0 && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Typography Validation:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {validationErrors.map((err, i) => (
                                        <li key={i} className="text-[10px] text-red-600 dark:text-red-400">{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <TypographyEditor 
                            styles={styles} 
                            colors={colors}
                            fonts={fonts}
                            onStyleChange={handleStyleChange} 
                        />
                        <div className="pt-6 border-t border-[var(--palette-border)]">
                            <FontManager 
                                installedFonts={fonts} 
                                onFileUpload={handleFileUpload} 
                                onFontDelete={handleDeleteFont}
                                onApplyToAll={handleApplyFontToAll}
                                uploading={uploading}
                                fileInputRef={fileInputRef}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'loader' && (
                    <div className="space-y-6">
                        <div className="theme-card">
                            <h3 className="text-sm font-bold text-h3 mb-4 flex items-center gap-2">
                                <Save size={16} className="text-palette-primary" />
                                Tangram Loader
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-palette-border">
                                <div>
                                    <p className="text-sm font-bold text-paragraph">Enable Page Loader</p>
                                    <p className="text-xs text-paragraph opacity-60">Shows the Tangram animation on page transitions</p>
                                </div>
                                <button
                                    onClick={() => setLoader({ enabled: !loader.enabled })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${
                                        loader.enabled ? 'bg-palette-primary' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                        loader.enabled ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Status */}
            <div className="p-3 bg-black/[0.05] dark:bg-white/[0.05] border-t border-palette-border shrink-0">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-paragraph opacity-40 uppercase tracking-widest">
                        unsaved changes in buffer
                    </span>
                    <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${colors !== initialColors ? 'bg-palette-primary' : 'bg-paragraph/10'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${styles !== initialStyles ? 'bg-palette-primary' : 'bg-paragraph/10'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
};
