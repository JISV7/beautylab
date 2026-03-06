import React, { useState } from 'react';
import { Plus } from 'lucide-react';

type PaletteType = 'light' | 'dark' | 'event';

interface CustomTheme {
    id: string;
    name: string;
    type: PaletteType;
    isActive: boolean;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        textMain: string;
        textMuted: string;
        textInvert: string;
    }
}

// Temporary mock data for UI creation
const MOCK_THEMES: CustomTheme[] = [
    {
        id: '1',
        name: 'LightDefault',
        type: 'light',
        isActive: true,
        colors: {
            primary: '#13a4ec',
            secondary: '#4b5563',
            accent: '#f59e0b',
            background: '#f6f7f8',
            textMain: '#0f172a',
            textMuted: '#64748b',
            textInvert: '#ffffff'
        }
    },
    {
        id: '2',
        name: 'DarkDefault',
        type: 'dark',
        isActive: false,
        colors: {
            primary: '#38bdf8',
            secondary: '#94a3b8',
            accent: '#fbbf24',
            background: '#101c22',
            textMain: '#f8fafc',
            textMuted: '#94a3b8',
            textInvert: '#0f172a'
        }
    },
    {
        id: '3',
        name: 'Navidad1',
        type: 'event',
        isActive: false,
        colors: {
            primary: '#dc2626',
            secondary: '#166534',
            accent: '#fbbf24',
            background: '#fef2f2',
            textMain: '#450a0a',
            textMuted: '#991b1b',
            textInvert: '#ffffff'
        }
    }
];

export const ThemeManager: React.FC = () => {
    const [themes, setThemes] = useState<CustomTheme[]>(MOCK_THEMES);
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');

    const handleActivateTheme = (themeId: string) => {
        setThemes(prevThemes => {
            const targetTheme = prevThemes.find(t => t.id === themeId);
            if (!targetTheme) return prevThemes;

            return prevThemes.map(theme => {
                // If it's the exact theme we want to activate
                if (theme.id === themeId) {
                    return { ...theme, isActive: true };
                }

                // If this is a different theme but of the same 'type' (light/dark), deactivate it
                // To enforce: only ONE active Light and ONE active Dark
                if (theme.type === targetTheme.type) {
                    return { ...theme, isActive: false };
                }

                // If it's a different type, leave its state alone
                return theme;
            });
        });
    };

    const handleDuplicate = (themeId: string) => {
        // Mock Implementation
        alert(`Duplicate Theme ID: ${themeId}`);
    };

    const handleEdit = (themeId: string) => {
        // Mock Implementation
        alert(`Edit Theme ID: ${themeId}`);
    };

    const renderThemes = () => {
        let filteredThemes = themes;

        if (activeTab === 'active') {
            filteredThemes = themes.filter(t => t.isActive);
        } else if (activeTab === 'archived') {
            filteredThemes = themes.filter(t => !t.isActive);
        }

        return filteredThemes.map(theme => (
            <div
                key={theme.id}
                className={`theme-surface rounded-xl border theme-border overflow-hidden shadow-sm transition-opacity ${theme.isActive ? '' : 'opacity-80 hover:opacity-100'}`}
            >
                <div className="p-5 border-b theme-border flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold theme-text-base">{theme.name}</h3>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${theme.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {theme.isActive ? `Active - ${theme.type.charAt(0).toUpperCase() + theme.type.slice(1)}` : `Inactive - ${theme.type.charAt(0).toUpperCase() + theme.type.slice(1)}`}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {!theme.isActive && (
                            <button
                                onClick={() => handleActivateTheme(theme.id)}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors"
                            >
                                Activate
                            </button>
                        )}
                        <button onClick={() => handleDuplicate(theme.id)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Duplicate</button>
                        <button onClick={() => handleEdit(theme.id)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">Edit</button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">

                        {/* Primary Color */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Primary Color</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.primary }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.primary}
                                readOnly={!theme.isActive}
                            />
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Secondary Color</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.secondary }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.secondary}
                                readOnly={!theme.isActive}
                            />
                        </div>

                        {/* Accent Color */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Accent Color</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.accent }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.accent}
                                readOnly={!theme.isActive}
                            />
                        </div>

                        {/* Background */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Background</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.background }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.background}
                                readOnly={!theme.isActive}
                            />
                        </div>

                        {/* Text Main */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Text 1 (Main)</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.textMain }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.textMain}
                                readOnly={!theme.isActive}
                            />
                        </div>

                        {/* Text Muted */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Text 2 (Muted)</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.textMuted }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.textMuted}
                                readOnly={!theme.isActive}
                            />
                        </div>

                        {/* Text Invert */}
                        <div className="space-y-2">
                            <div className="text-sm font-medium theme-text-secondary">Text 3 (Invert)</div>
                            <div className="h-12 w-full rounded-lg shadow-inner border theme-border" style={{ backgroundColor: theme.colors.textInvert }}></div>
                            <input
                                className={`w-full text-xs font-mono py-1.5 px-2 rounded ${theme.isActive ? 'theme-surface border theme-border theme-text-base' : 'bg-transparent border-none theme-text-secondary'}`}
                                type="text"
                                value={theme.colors.textInvert}
                                readOnly={!theme.isActive}
                            />
                        </div>

                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold theme-text-base">Color Palettes</h1>
                            <p className="theme-text-secondary mt-1">Manage and configure theme colors across the system.</p>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 theme-primary text-white rounded-lg font-semibold hover:opacity-90 transition-colors shadow-sm">
                            <Plus className="w-5 h-5" />
                            <span>Create New Palette</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b theme-border gap-8">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'all' ? 'border-[var(--theme-primary-value)] text-[var(--theme-primary-value)]' : 'border-transparent theme-text-secondary hover:text-[var(--theme-text-base)]'}`}
                        >
                            All Palettes
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'active' ? 'border-[var(--theme-primary-value)] text-[var(--theme-primary-value)]' : 'border-transparent theme-text-secondary hover:text-[var(--theme-text-base)]'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`pb-3 border-b-2 font-bold transition-colors ${activeTab === 'archived' ? 'border-[var(--theme-primary-value)] text-[var(--theme-primary-value)]' : 'border-transparent theme-text-secondary hover:text-[var(--theme-text-base)]'}`}
                        >
                            Archived
                        </button>
                    </div>

                    {/* Palette Cards List */}
                    <div className="grid grid-cols-1 gap-6">
                        {renderThemes()}
                    </div>

                </div>
            </div>
        </div>
    );
};
