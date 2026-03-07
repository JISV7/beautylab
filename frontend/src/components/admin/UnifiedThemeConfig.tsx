import React, { useState, useEffect, useRef } from 'react';
import { Save, Palette, Type, UploadCloud, Trash2, ChevronDown, ChevronUp, Loader2, Eye, Copy, Plus } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import type { NamedTheme } from '../../data/theme.types';

const API_URL = 'http://localhost:8000';

interface Font {
    id: string;
    name: string;
    filename: string;
    url: string;
    created_at: string;
}

interface TypographyStyle {
    fontFamily: string;
    size: number;
    color: string;
}

export const UnifiedThemeConfig: React.FC = () => {
    const { themeData, getCustomTheme, saveCustomTheme, updateTheme } = useTheme();

    // Theme management state
    const [themes, setThemes] = useState<Record<string, NamedTheme>>({});
    const [activeThemeName, setActiveThemeName] = useState<string>('default');
    const [activeMode, setActiveMode] = useState<'light' | 'dark' | 'accessibility'>('light');

    // Tab state: 'colors' | 'typography'
    const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors');

    // Color state (6 colors only - no text colors)
    const [colors, setColors] = useState({
        primary: '#F83A3A',
        secondary: '#FAA2B6',
        accent: '#D73359',
        background: '#fffafb',
        surface: '#FFFFFF',
        border: '#E5E7EB',
    });

    // Typography state for H1-H6 and P
    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
        h1: true,
        h2: false,
        h3: false,
        h4: false,
        h5: false,
        h6: false,
        p: false
    });

    const [styles, setStyles] = useState<Record<string, TypographyStyle>>({
        h1: { fontFamily: 'Manrope', size: 2.5, color: '#000000' },
        h2: { fontFamily: 'Manrope', size: 2.0, color: '#000000' },
        h3: { fontFamily: 'Manrope', size: 1.75, color: '#000000' },
        h4: { fontFamily: 'Manrope', size: 1.5, color: '#000000' },
        h5: { fontFamily: 'Manrope', size: 1.25, color: '#000000' },
        h6: { fontFamily: 'Manrope', size: 1.0, color: '#000000' },
        p: { fontFamily: 'Manrope', size: 1.0, color: '#4b5563' }
    });

    // Font management
    const [installedFonts, setInstalledFonts] = useState<Font[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize themes from themeData
    useEffect(() => {
        const customTheme = getCustomTheme();
        const loadedThemes: Record<string, NamedTheme> = {};

        // Check if we have themes in the custom theme
        if (customTheme?.themes) {
            Object.assign(loadedThemes, customTheme.themes);
        }

        // If no custom themes, create default from existing themeData
        if (Object.keys(loadedThemes).length === 0) {
            const accessibilityData = (themeData as any).accessibility;
            const defaultTheme: NamedTheme = {
                name: 'default',
                light: {
                    colors: { ...themeData.light.colors },
                    typography: { ...themeData.light.typography },
                    components: themeData.light.components
                },
                dark: {
                    colors: { ...themeData.dark.colors },
                    typography: { ...themeData.dark.typography },
                    components: themeData.dark.components
                },
                accessibility: {
                    colors: accessibilityData ? { ...accessibilityData.colors } : { ...themeData.light.colors },
                    typography: accessibilityData ? { ...accessibilityData.typography } : { ...themeData.light.typography },
                    components: accessibilityData?.components
                }
            };
            loadedThemes['default'] = defaultTheme;
        }

        setThemes(loadedThemes);

        // Set active theme
        const currentCustom = getCustomTheme();
        if ((currentCustom as any)?.activeThemeName) {
            setActiveThemeName((currentCustom as any).activeThemeName);
        } else {
            setActiveThemeName(Object.keys(loadedThemes)[0] || 'default');
        }
    }, []);

    // Sync colors and typography when theme/mode changes
    useEffect(() => {
        const theme = themes[activeThemeName];
        if (!theme) return;

        const modeData = theme[activeMode];
        if (!modeData) return;

        // Update colors (only 6 base colors)
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
        });

        // Update typography styles
        const typo = modeData.typography;
        setStyles({
            h1: {
                fontFamily: typo.h1?.fontFamily || typo.title?.fontFamily || 'Manrope',
                size: parseFloat(typo.h1?.fontSize || '2.5'),
                color: typo.h1?.color || typo.title?.color || modeData.colors.text
            },
            h2: {
                fontFamily: typo.h2?.fontFamily || typo.title?.fontFamily || 'Manrope',
                size: parseFloat(typo.h2?.fontSize || '2.0'),
                color: typo.h2?.color || typo.title?.color || modeData.colors.text
            },
            h3: {
                fontFamily: typo.h3?.fontFamily || typo.title?.fontFamily || 'Manrope',
                size: parseFloat(typo.h3?.fontSize || '1.75'),
                color: typo.h3?.color || typo.title?.color || modeData.colors.text
            },
            h4: {
                fontFamily: typo.h4?.fontFamily || typo.title?.fontFamily || 'Manrope',
                size: parseFloat(typo.h4?.fontSize || '1.5'),
                color: typo.h4?.color || typo.title?.color || modeData.colors.text
            },
            h5: {
                fontFamily: typo.h5?.fontFamily || typo.title?.fontFamily || 'Manrope',
                size: parseFloat(typo.h5?.fontSize || '1.25'),
                color: typo.h5?.color || typo.title?.color || modeData.colors.text
            },
            h6: {
                fontFamily: typo.h6?.fontFamily || typo.title?.fontFamily || 'Manrope',
                size: parseFloat(typo.h6?.fontSize || '1.0'),
                color: typo.h6?.color || typo.title?.color || modeData.colors.text
            },
            p: {
                fontFamily: typo.paragraph?.fontFamily || 'Manrope',
                size: parseFloat(typo.paragraph?.fontSize || '1.0'),
                color: typo.paragraph?.color || modeData.colors.textSecondary
            }
        });
    }, [activeThemeName, activeMode, themes]);

    // Fetch fonts on mount
    useEffect(() => {
        fetchFonts();
    }, []);

    const fetchFonts = async () => {
        try {
            const response = await axios.get(`${API_URL}/fonts`);
            setInstalledFonts(response.data);
        } catch (error) {
            console.error("Error fetching fonts:", error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await axios.post(`${API_URL}/fonts/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            fetchFonts();
        } catch (error) {
            console.error("Error uploading font:", error);
            alert("Error uploading font. Ensure it's a valid font file.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteFont = async (font: Font) => {
        const isUsed = Object.values(styles).some(style => style.fontFamily === font.name);

        if (isUsed) {
            alert(`Cannot delete '${font.name}' because it is currently in use.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the font "${font.name}"?`)) return;
        try {
            await axios.delete(`${API_URL}/fonts/${font.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            fetchFonts();
        } catch (error) {
            console.error("Error deleting font:", error);
        }
    };

    const handleColorChange = (key: keyof typeof colors, value: string) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const toggleBlock = (block: string) => {
        setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
    };

    const updateStyle = (key: string, field: keyof TypographyStyle, value: string | number) => {
        setStyles(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleCreateTheme = () => {
        const name = prompt("Enter a name for the new theme (e.g., 'brand2025'):");
        if (!name) return;

        const key = name.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (themes[key]) {
            alert("Theme already exists!");
            return;
        }

        // Create new theme based on current active theme
        const baseTheme = themes[activeThemeName];
        const newTheme: NamedTheme = {
            name: name,
            light: JSON.parse(JSON.stringify(baseTheme.light)),
            dark: JSON.parse(JSON.stringify(baseTheme.dark)),
            accessibility: JSON.parse(JSON.stringify(baseTheme.accessibility))
        };

        setThemes(prev => ({ ...prev, [key]: newTheme }));
        setActiveThemeName(key);
    };

    const handleDuplicateTheme = () => {
        const name = prompt(`Enter a name for the duplicate of "${themes[activeThemeName].name}":`);
        if (!name) return;

        const key = name.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (themes[key]) {
            alert("Theme already exists!");
            return;
        }

        const baseTheme = themes[activeThemeName];
        const newTheme: NamedTheme = {
            name: name,
            light: JSON.parse(JSON.stringify(baseTheme.light)),
            dark: JSON.parse(JSON.stringify(baseTheme.dark)),
            accessibility: JSON.parse(JSON.stringify(baseTheme.accessibility))
        };

        setThemes(prev => ({ ...prev, [key]: newTheme }));
        setActiveThemeName(key);
    };

    const handleDeleteTheme = () => {
        if (Object.keys(themes).length <= 1) {
            alert("Cannot delete the last theme!");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the theme "${themes[activeThemeName].name}"?`)) return;

        const newThemes = { ...themes };
        delete newThemes[activeThemeName];
        setThemes(newThemes);
        setActiveThemeName(Object.keys(newThemes)[0]);
    };

    const handleRenameTheme = () => {
        const newName = prompt("Enter new theme name:", themes[activeThemeName].name);
        if (!newName || newName === themes[activeThemeName].name) return;

        const newKey = newName.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (themes[newKey]) {
            alert("Theme name already exists!");
            return;
        }

        const updatedTheme = { ...themes[activeThemeName], name: newName };
        const newThemes = { ...themes };
        delete newThemes[activeThemeName];
        newThemes[newKey] = updatedTheme;

        setThemes(newThemes);
        setActiveThemeName(newKey);
    };

    const handleSave = () => {
        const theme = themes[activeThemeName];
        if (!theme) return;

        // Determine text colors based on typography settings
        const textColors = {
            light: {
                text: styles.h1.color,
                textSecondary: styles.p.color
            },
            dark: {
                text: styles.h1.color,
                textSecondary: styles.p.color
            },
            accessibility: {
                text: styles.h1.color,
                textSecondary: styles.p.color
            }
        };

        const updatedTheme: NamedTheme = {
            ...theme,
            [activeMode]: {
                ...theme[activeMode],
                colors: {
                    ...theme[activeMode].colors,
                    ...colors,
                    text: textColors[activeMode].text,
                    textSecondary: textColors[activeMode].textSecondary
                },
                typography: {
                    ...theme[activeMode].typography,
                    h1: { fontFamily: styles.h1.fontFamily, fontSize: `${styles.h1.size}rem`, color: styles.h1.color },
                    h2: { fontFamily: styles.h2.fontFamily, fontSize: `${styles.h2.size}rem`, color: styles.h2.color },
                    h3: { fontFamily: styles.h3.fontFamily, fontSize: `${styles.h3.size}rem`, color: styles.h3.color },
                    h4: { fontFamily: styles.h4.fontFamily, fontSize: `${styles.h4.size}rem`, color: styles.h4.color },
                    h5: { fontFamily: styles.h5.fontFamily, fontSize: `${styles.h5.size}rem`, color: styles.h5.color },
                    h6: { fontFamily: styles.h6.fontFamily, fontSize: `${styles.h6.size}rem`, color: styles.h6.color },
                    title: { fontFamily: styles.h1.fontFamily, fontSize: `${styles.h1.size}rem`, color: styles.h1.color },
                    subtitle: { fontFamily: styles.h2.fontFamily, fontSize: `${styles.h2.size}rem`, color: styles.h2.color },
                    paragraph: { fontFamily: styles.p.fontFamily, fontSize: `${styles.p.size}rem`, color: styles.p.color }
                }
            }
        };

        const currentCustom = getCustomTheme() || {};
        saveCustomTheme({
            ...currentCustom,
            themes: { ...themes, [activeThemeName]: updatedTheme },
            activeThemeName: activeThemeName as any,
            activeMode: activeMode as any
        });

        // Also update the global theme mode if needed
        updateTheme({ mode: activeMode });

        alert(`Theme "${theme.name}" saved successfully!`);
    };

    const handleDiscard = () => {
        // Reload from saved state
        const theme = themes[activeThemeName];
        if (!theme) return;

        const modeData = theme[activeMode];
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
        });

        const typo = modeData.typography;
        setStyles({
            h1: { fontFamily: typo.h1?.fontFamily || typo.title?.fontFamily || 'Manrope', size: parseFloat(typo.h1?.fontSize || '2.5'), color: typo.h1?.color || modeData.colors.text },
            h2: { fontFamily: typo.h2?.fontFamily || typo.title?.fontFamily || 'Manrope', size: parseFloat(typo.h2?.fontSize || '2.0'), color: typo.h2?.color || modeData.colors.text },
            h3: { fontFamily: typo.h3?.fontFamily || typo.title?.fontFamily || 'Manrope', size: parseFloat(typo.h3?.fontSize || '1.75'), color: typo.h3?.color || modeData.colors.text },
            h4: { fontFamily: typo.h4?.fontFamily || typo.title?.fontFamily || 'Manrope', size: parseFloat(typo.h4?.fontSize || '1.5'), color: typo.h4?.color || modeData.colors.text },
            h5: { fontFamily: typo.h5?.fontFamily || typo.title?.fontFamily || 'Manrope', size: parseFloat(typo.h5?.fontSize || '1.25'), color: typo.h5?.color || modeData.colors.text },
            h6: { fontFamily: typo.h6?.fontFamily || typo.title?.fontFamily || 'Manrope', size: parseFloat(typo.h6?.fontSize || '1.0'), color: typo.h6?.color || modeData.colors.text },
            p: { fontFamily: typo.paragraph?.fontFamily || 'Manrope', size: parseFloat(typo.paragraph?.fontSize || '1.0'), color: typo.paragraph?.color || modeData.colors.textSecondary }
        });
    };

    const renderColorInput = (label: string, key: keyof typeof colors) => (
        <div className="space-y-2">
            <div className="text-sm font-semibold theme-text-secondary">{label}</div>
            <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer shrink-0">
                    <input
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                        type="color"
                        value={colors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                    />
                    <div
                        className="w-12 h-12 rounded border-2 border-slate-200 shadow-sm"
                        style={{ backgroundColor: colors[key] }}
                    ></div>
                </div>
                <div className="flex-1 relative">
                    <input
                        className="w-full rounded-lg border-slate-200 theme-text-base py-2 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 uppercase text-sm font-mono theme-surface"
                        type="text"
                        value={colors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 theme-text-secondary">
                        <Palette className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStyleBlock = (key: string, label: string, shortLabel: string) => (
        <div key={key} className="rounded-xl border theme-border shadow-sm overflow-hidden mb-4" style={{ backgroundColor: '#fffafb' }}>
            <div
                className="p-5 flex items-center justify-between border-b theme-border cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => toggleBlock(key)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-slate-700" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>{shortLabel}</div>
                    <h4 className="font-semibold text-slate-900">{label}</h4>
                </div>
                {expandedBlocks[key] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>

            {expandedBlocks[key] && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">Font Family</span>
                        <div className="relative">
                            <select
                                value={styles[key].fontFamily}
                                onChange={(e) => updateStyle(key, 'fontFamily', e.target.value)}
                                className="w-full appearance-none rounded-lg border-slate-200 text-slate-900 py-2.5 pl-4 pr-10 focus:border-blue-500 focus:ring-blue-500" style={{ backgroundColor: '#fffafb' }}>
                                <option>Manrope</option>
                                <option>Inter</option>
                                <option>System Default</option>
                                {installedFonts.map(f => (
                                    <option key={f.id} value={f.name}>{f.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">Size (rem)</span>
                        <div className="relative flex items-center">
                            <input
                                className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500"
                                type="number"
                                step="0.1"
                                value={styles[key].size}
                                onChange={(e) => updateStyle(key, 'size', parseFloat(e.target.value) || 1)}
                                style={{ backgroundColor: '#fffafb' }}
                            />
                            <span className="absolute right-4 text-sm text-slate-500 font-medium">rem</span>
                        </div>
                    </label>

                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">Color</span>
                        <div className="flex items-center gap-3">
                            <div className="relative group cursor-pointer shrink-0">
                                <input
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                    type="color"
                                    value={styles[key].color}
                                    onChange={(e) => updateStyle(key, 'color', e.target.value)}
                                />
                                <div className="w-10 h-10 rounded border-2 border-slate-200 shadow-sm" style={{ backgroundColor: styles[key].color }}></div>
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    className="w-full rounded-lg border-slate-200 text-slate-900 py-2 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 uppercase text-sm font-mono"
                                    type="text"
                                    value={styles[key].color}
                                    onChange={(e) => updateStyle(key, 'color', e.target.value)}
                                    style={{ backgroundColor: '#fffafb' }}
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                    <Palette className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const injectedStyles = installedFonts.map(font => `
        @font-face {
            font-family: '${font.name}';
            src: url('${API_URL}${font.url}');
            font-display: swap;
        }
    `).join('\n');

    const activeTheme = themes[activeThemeName];
    const activeModeData = activeTheme?.[activeMode];

    if (!activeTheme || !activeModeData) {
        return <div className="p-8 theme-text-secondary">Loading theme configuration...</div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <style>{injectedStyles}</style>

            {/* Header */}
            <header className="h-16 theme-surface border-b theme-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold theme-text-base">Theme Configuration</h2>
                <div className="flex gap-3">
                    <button
                        onClick={handleDiscard}
                        className="px-4 py-2 text-sm font-medium theme-text-secondary rounded-lg border theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Discard
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

                    {/* Theme Selector Section */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black tracking-tight theme-text-base">Theme Manager</h1>
                        <p className="theme-text-secondary">Create and manage themes. Each theme contains light, dark, and accessibility mode palettes plus typography settings.</p>
                    </div>

                    {/* Theme Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b theme-border">
                        {Object.entries(themes).map(([key, theme]) => (
                            <button
                                key={key}
                                onClick={() => setActiveThemeName(key)}
                                className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors capitalize whitespace-nowrap ${
                                    activeThemeName === key
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                        : 'border-transparent theme-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                {theme.name}
                            </button>
                        ))}
                        <button
                            onClick={handleCreateTheme}
                            className="px-4 py-2 text-sm font-bold theme-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            New Theme
                        </button>
                        <button
                            onClick={handleDuplicateTheme}
                            className="px-4 py-2 text-sm font-bold theme-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
                            title="Duplicate current theme"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDeleteTheme}
                            className="px-4 py-2 text-sm font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                            title="Delete current theme"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRenameTheme}
                            className="px-4 py-2 text-sm font-bold theme-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Rename current theme"
                        >
                            Rename
                        </button>
                    </div>

                    {/* Mode Tabs (Light/Dark/Accessibility) */}
                    <div className="flex items-center gap-2">
                        {(['light', 'dark', 'accessibility'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setActiveMode(mode)}
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

                    {/* Editor Tabs (Colors/Typography) */}
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

                    {/* Colors Tab */}
                    {activeTab === 'colors' && (
                        <div className="theme-surface rounded-xl border theme-border overflow-hidden shadow-sm">
                            <div className="p-6 border-b theme-border flex items-center gap-3">
                                <Palette className="w-6 h-6 text-blue-500" />
                                <h3 className="text-xl font-bold theme-text-base">Color Palette - {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}</h3>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {renderColorInput("Primary Color (Buttons, Links)", "primary")}
                                {renderColorInput("Secondary Color", "secondary")}
                                {renderColorInput("Accent Color", "accent")}
                                {renderColorInput("General Background Color", "background")}
                                {renderColorInput("Surfaces (Cards, Panels)", "surface")}
                                {renderColorInput("Boxes and Borders", "border")}
                            </div>

                            {/* Live Preview Box */}
                            <div className="p-8 border-t theme-border" style={{ background: colors.background }}>
                                <h2 className="text-2xl font-bold mb-4" style={{ color: styles.h1.color }}>
                                    Real-Time Preview
                                </h2>
                                <p className="mb-6" style={{ color: styles.p.color, fontFamily: styles.p.fontFamily, fontSize: `${styles.p.size}rem` }}>
                                    This is an example of how text appears on the site. Colors and typography work together.
                                </p>

                                <div className="flex gap-4 p-6 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <h4 className="font-bold" style={{ color: styles.h4.color, fontFamily: styles.h4.fontFamily, fontSize: `${styles.h4.size}rem` }}>Surface Card</h4>
                                        <p className="text-sm" style={{ color: styles.p.color, fontFamily: styles.p.fontFamily, fontSize: `${styles.p.size}rem` }}>
                                            Example card content with configured colors and typography.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button className="px-5 py-2 rounded-lg font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: colors.primary, color: '#FFFFFF', fontFamily: styles.p.fontFamily, fontSize: `${styles.p.size}rem` }}>
                                            Primary
                                        </button>
                                        <button className="px-5 py-2 rounded-lg font-bold border transition-all hover:opacity-90" style={{ color: colors.primary, borderColor: colors.primary, backgroundColor: 'transparent', fontFamily: styles.p.fontFamily, fontSize: `${styles.p.size}rem` }}>
                                            Secondary
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Typography Tab */}
                    {activeTab === 'typography' && (
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column: Controls */}
                            <div className="lg:col-span-7 flex flex-col gap-8">
                                {/* Font Manager */}
                                <div className="rounded-xl border theme-border shadow-sm overflow-hidden" style={{ backgroundColor: '#fffafb' }}>
                                    <div className="p-6 border-b theme-border">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <UploadCloud className="w-5 h-5 text-blue-500" />
                                            Upload Fonts
                                        </h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-4">
                                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px]" style={{ backgroundColor: '#fffafb' }}>
                                                <p className="text-sm font-medium text-slate-700">Drag and drop your font (.ttf, .otf)</p>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    accept=".ttf,.otf,.woff,.woff2"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                                                    style={{ backgroundColor: '#fffafb' }}
                                                >
                                                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Select file'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <h4 className="text-sm font-semibold text-slate-700">Installed Fonts</h4>
                                            <ul className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2">
                                                {installedFonts.map((font) => (
                                                    <li key={font.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200" style={{ backgroundColor: '#fffafb' }}>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg font-bold font-display text-slate-900" style={{ fontFamily: font.name }}>Ag</span>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">{font.name}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteFont(font)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                                {installedFonts.length === 0 && (
                                                    <li className="p-4 text-center text-sm theme-text-secondary border border-dashed rounded-lg">
                                                        No fonts installed.
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Typography Sizes */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-xl font-bold theme-text-base mt-2 flex items-center gap-2">
                                        <Type className="w-5 h-5 text-slate-700" /> Font Sizes & Colors
                                    </h3>
                                    {renderStyleBlock('h1', 'Heading 1 (H1)', 'H1')}
                                    {renderStyleBlock('h2', 'Heading 2 (H2)', 'H2')}
                                    {renderStyleBlock('h3', 'Heading 3 (H3)', 'H3')}
                                    {renderStyleBlock('h4', 'Heading 4 (H4)', 'H4')}
                                    {renderStyleBlock('h5', 'Heading 5 (H5)', 'H5')}
                                    {renderStyleBlock('h6', 'Heading 6 (H6)', 'H6')}
                                    {renderStyleBlock('p', 'Paragraph (p)', 'P')}
                                </div>
                            </div>

                            {/* Right Column: Live Preview */}
                            <div className="lg:col-span-5">
                                <div className="sticky top-24 flex flex-col gap-4">
                                    <h3 className="text-xl font-bold theme-text-base flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-slate-700" /> Preview
                                    </h3>

                                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm flex flex-col gap-6" style={{ minHeight: '500px' }}>
                                        <div style={{
                                            fontFamily: styles.h1.fontFamily,
                                            fontSize: `${styles.h1.size}rem`,
                                            color: styles.h1.color,
                                            fontWeight: 800,
                                            lineHeight: 1.2
                                        }}>
                                            Example Heading (H1)
                                        </div>

                                        <div style={{
                                            fontFamily: styles.h2.fontFamily,
                                            fontSize: `${styles.h2.size}rem`,
                                            color: styles.h2.color,
                                            fontWeight: 700,
                                            lineHeight: 1.2
                                        }}>
                                            Example Subheading (H2)
                                        </div>

                                        <div style={{
                                            fontFamily: styles.h3.fontFamily,
                                            fontSize: `${styles.h3.size}rem`,
                                            color: styles.h3.color,
                                            fontWeight: 600,
                                            lineHeight: 1.3
                                        }}>
                                            Section Header (H3)
                                        </div>

                                        <div style={{
                                            fontFamily: styles.h4.fontFamily,
                                            fontSize: `${styles.h4.size}rem`,
                                            color: styles.h4.color,
                                            fontWeight: 600,
                                            lineHeight: 1.4
                                        }}>
                                            Minor Header (H4)
                                        </div>

                                        <div style={{
                                            fontFamily: styles.h5.fontFamily,
                                            fontSize: `${styles.h5.size}rem`,
                                            color: styles.h5.color,
                                            fontWeight: 600,
                                            lineHeight: 1.4
                                        }}>
                                            Card Title (H5)
                                        </div>

                                        <div style={{
                                            fontFamily: styles.h6.fontFamily,
                                            fontSize: `${styles.h6.size}rem`,
                                            color: styles.h6.color,
                                            fontWeight: 600,
                                            lineHeight: 1.5
                                        }}>
                                            Highlight Tag (H6)
                                        </div>

                                        <div style={{
                                            fontFamily: styles.p.fontFamily,
                                            fontSize: `${styles.p.size}rem`,
                                            color: styles.p.color,
                                            lineHeight: 1.6,
                                            marginTop: '1rem'
                                        }}>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                className="px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                                                style={{
                                                    backgroundColor: colors.primary,
                                                    fontFamily: styles.p.fontFamily,
                                                    fontSize: `${styles.p.size}rem`
                                                }}
                                            >
                                                Example Button
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
