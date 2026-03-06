import React, { useState, useEffect } from 'react';
import { Save, Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeManager: React.FC = () => {
    const { config, themeData, getCustomTheme, saveCustomTheme, updateTheme } = useTheme();
    
    const [activeTab, setActiveTab] = useState(config.mode);

    const customTheme = getCustomTheme() || {};
    const defaultModes = Object.keys(themeData).filter(key => key !== 'presets');
    const customModes = Object.keys(customTheme);
    const allTabs = Array.from(new Set([...defaultModes, ...customModes]));

    // We grab the current theme data (either custom or default) based on active tab
    const activeTheme = (customTheme[activeTab] as any) || (themeData[activeTab as keyof typeof themeData] as any) || (themeData['light'] as any);
    
    // Local state for the colors being edited
    const [colors, setColors] = useState({
        primary: activeTheme.colors.primary,
        secondary: activeTheme.colors.secondary,
        accent: activeTheme.colors.accent,
        background: activeTheme.colors.background,
        surface: activeTheme.colors.surface,
        border: activeTheme.colors.border,
        text: activeTheme.colors.text,
        textSecondary: activeTheme.colors.textSecondary,
    });

    useEffect(() => {
        // Sync local state if activeTheme changes externally
        setColors({
            primary: activeTheme.colors.primary,
            secondary: activeTheme.colors.secondary,
            accent: activeTheme.colors.accent,
            background: activeTheme.colors.background,
            surface: activeTheme.colors.surface,
            border: activeTheme.colors.border,
            text: activeTheme.colors.text,
            textSecondary: activeTheme.colors.textSecondary,
        });
    }, [activeTheme.colors]);

    const handleColorChange = (key: keyof typeof colors, value: string) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        const currentCustom = getCustomTheme() || {};
        
        const updatedModeData = {
            ...activeTheme,
            colors: {
                ...activeTheme.colors,
                ...colors
            }
        };

        saveCustomTheme({
            ...currentCustom,
            [activeTab]: updatedModeData
        });

        alert("Colors saved successfully!");
    };

    const handleDiscard = () => {
        setColors({
            primary: activeTheme.colors.primary,
            secondary: activeTheme.colors.secondary,
            accent: activeTheme.colors.accent,
            background: activeTheme.colors.background,
            surface: activeTheme.colors.surface,
            border: activeTheme.colors.border,
            text: activeTheme.colors.text,
            textSecondary: activeTheme.colors.textSecondary,
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <header className="h-16 theme-surface border-b theme-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold theme-text-base">Color Settings</h2>
                <div className="flex gap-3">
                    {config.mode !== activeTab && (
                        <button 
                            onClick={() => updateTheme({ mode: activeTab })}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                        >
                            Set as Active Mode
                        </button>
                    )}
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
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black tracking-tight theme-text-base">Global Web Palette</h1>
                        <p className="theme-text-secondary">Create or select a palette below and start editing. Use the 'Save Changes' button to store your customized styles for that specific palette mode.</p>
                    </div>

                    {/* Palette Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b theme-border">
                        {allTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors capitalize ${
                                    activeTab === tab 
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
                                        : 'border-transparent theme-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                {tab} Mode
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                const newName = prompt("Enter a name for the new palette (e.g., 'mint'):");
                                if (!newName) return;
                                const key = newName.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                if (allTabs.includes(key)) {
                                    alert("Palette already exists!");
                                    return;
                                }
                                setActiveTab(key);
                            }}
                            className="px-4 py-2 text-sm font-bold theme-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
                        >
                            + Add Palette
                        </button>
                    </div>

                    <div className="theme-surface rounded-xl border theme-border overflow-hidden shadow-sm">
                        <div className="p-6 border-b theme-border flex items-center gap-3">
                            <Palette className="w-6 h-6 text-blue-500" />
                            <h3 className="text-xl font-bold theme-text-base">Main Colors</h3>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {renderColorInput("Primary Color (Buttons, Links)", "primary")}
                            {renderColorInput("Secondary Color", "secondary")}
                            {renderColorInput("Accent Color", "accent")}
                            {renderColorInput("General Background Color", "background")}
                            {renderColorInput("Surfaces (Cards, Panels)", "surface")}
                            {renderColorInput("Boxes and Borders", "border")}
                            {renderColorInput("Main Text (Titles, Paragraphs)", "text")}
                            {renderColorInput("Secondary Text (Muted)", "textSecondary")}
                        </div>
                    </div>
                    
                    {/* Live Preview Box */}
                    <div className="theme-surface rounded-xl border theme-border overflow-hidden shadow-sm mt-8 p-8 flex flex-col gap-6" style={{ background: colors.background }}>
                        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                            Real-Time Preview
                        </h2>
                        <p style={{ color: colors.textSecondary }}>
                            This is an example of how the subtitles and paragraphs on the site would look. You'll notice they inherit the configuration regardless of where you place them.
                        </p>
                        
                        <div className="flex gap-4 p-6 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                            <div className="flex-1 flex flex-col gap-2">
                                <h4 className="font-bold" style={{ color: colors.text }}>Surface Card</h4>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    Ideal for displaying courses or statistics within a container on the home page.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button className="px-5 py-2 rounded-lg font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: colors.primary, color: colors.text }}>
                                    Primary
                                </button>
                                <button className="px-5 py-2 rounded-lg font-bold border transition-all hover:opacity-90" style={{ color: colors.text, borderColor: colors.primary, backgroundColor: 'transparent' }}>
                                    Secondary
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
