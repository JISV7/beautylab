import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Copy, Trash2, Check, X, Loader2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'http://localhost:8000';

// Types matching backend schema
interface ThemeConfig {
    light?: {
        colors: Record<string, string>;
        typography?: Record<string, unknown>;
    };
    dark?: {
        colors: Record<string, string>;
        typography?: Record<string, unknown>;
    };
    components?: Record<string, unknown>;
}

interface Theme {
    id: string;
    name: string;
    description?: string | null;
    type: 'preset' | 'custom';
    config: ThemeConfig;
    is_active: boolean;
    is_default: boolean;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    textMain: string;
    textMuted: string;
    textInvert: string;
}

type TabType = 'all' | 'active' | 'archived';

// Helper to extract colors from theme config for a given mode
const extractColorsFromConfig = (config: ThemeConfig, mode: 'light' | 'dark'): ThemeColors => {
    const modeData = config[mode] || {};
    const colors = modeData.colors || {};
    return {
        primary: colors.primary || '#13a4ec',
        secondary: colors.secondary || '#4b5563',
        accent: colors.accent || '#f59e0b',
        background: colors.background || '#f6f7f8',
        textMain: colors.text || '#0f172a',
        textMuted: colors.textSecondary || '#64748b',
        textInvert: colors.surface || '#ffffff',
    };
};

// Helper to create theme config from colors
const createThemeConfig = (
    name: string,
    lightColors: ThemeColors,
    darkColors: ThemeColors
): ThemeConfig => ({
    light: {
        colors: {
            primary: lightColors.primary,
            secondary: lightColors.secondary,
            accent: lightColors.accent,
            background: lightColors.background,
            surface: lightColors.textInvert,
            border: '#e5e7eb',
            text: lightColors.textMain,
            textSecondary: lightColors.textMuted,
        },
    },
    dark: {
        colors: {
            primary: darkColors.primary,
            secondary: darkColors.secondary,
            accent: darkColors.accent,
            background: darkColors.background,
            surface: darkColors.textInvert,
            border: '#374151',
            text: darkColors.textMain,
            textSecondary: darkColors.textMuted,
        },
    },
});

export const ThemeManager: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [themes, setThemes] = useState<Theme[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
    const [creatingNew, setCreatingNew] = useState(false);
    const [activeColorPicker, setActiveColorPicker] = useState<{
        themeId: string;
        colorKey: keyof ThemeColors;
        mode: 'light' | 'dark';
    } | null>(null);

    // Fetch themes from backend
    const fetchThemes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_URL}/themes/admin`, {
                params: { page: 1, page_size: 100 },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            setThemes(response.data.themes || []);
        } catch (err: any) {
            console.error('Error fetching themes:', err);
            setError(err.response?.data?.detail || 'Failed to fetch themes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThemes();
    }, [fetchThemes]);

    // Activate a theme
    const handleActivateTheme = async (themeId: string) => {
        try {
            await axios.patch(
                `${API_URL}/themes/${themeId}`,
                { is_active: true },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                }
            );
            fetchThemes();
        } catch (err: any) {
            console.error('Error activating theme:', err);
            alert(err.response?.data?.detail || 'Failed to activate theme');
        }
    };

    // Deactivate a theme
    const handleDeactivateTheme = async (themeId: string) => {
        try {
            await axios.patch(
                `${API_URL}/themes/${themeId}`,
                { is_active: false },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                }
            );
            fetchThemes();
        } catch (err: any) {
            console.error('Error deactivating theme:', err);
            alert(err.response?.data?.detail || 'Failed to deactivate theme');
        }
    };

    // Duplicate a theme
    const handleDuplicate = async (themeId: string) => {
        const themeToDuplicate = themes.find((t) => t.id === themeId);
        if (!themeToDuplicate) return;

        try {
            const newThemeData = {
                name: `${themeToDuplicate.name} (Copy)`,
                description: themeToDuplicate.description,
                type: 'custom' as const,
                config: themeToDuplicate.config,
                is_active: false,
                is_default: false,
            };

            await axios.post(`${API_URL}/themes/`, newThemeData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            fetchThemes();
        } catch (err: any) {
            console.error('Error duplicating theme:', err);
            alert(err.response?.data?.detail || 'Failed to duplicate theme');
        }
    };

    // Edit a theme (open editor)
    const handleEdit = (theme: Theme) => {
        setEditingTheme(theme);
        setCreatingNew(false);
    };

    // Delete a theme
    const handleDelete = async (themeId: string) => {
        if (!confirm('Are you sure you want to delete this theme? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/themes/${themeId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            fetchThemes();
        } catch (err: any) {
            console.error('Error deleting theme:', err);
            alert(err.response?.data?.detail || 'Failed to delete theme');
        }
    };

    // Update color in theme
    const handleColorChange = async (
        themeId: string,
        colorKey: keyof ThemeColors,
        value: string,
        mode: 'light' | 'dark'
    ) => {
        const theme = themes.find((t) => t.id === themeId);
        if (!theme) return;

        const currentColors = extractColorsFromConfig(theme.config, mode);
        const updatedColors = { ...currentColors, [colorKey]: value };

        // Determine the backend color key mapping
        const colorKeyMap: Record<keyof ThemeColors, string> = {
            primary: 'primary',
            secondary: 'secondary',
            accent: 'accent',
            background: 'background',
            textMain: 'text',
            textMuted: 'textSecondary',
            textInvert: 'surface',
        };

        const backendKey = colorKeyMap[colorKey];
        const updatedConfig = {
            ...theme.config,
            [mode]: {
                ...theme.config[mode],
                colors: {
                    ...(theme.config[mode]?.colors || {}),
                    [backendKey]: value,
                },
            },
        };

        try {
            await axios.patch(
                `${API_URL}/themes/${themeId}`,
                { config: updatedConfig },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                }
            );
            fetchThemes();
        } catch (err: any) {
            console.error('Error updating color:', err);
            alert(err.response?.data?.detail || 'Failed to update color');
        }
    };

    // Create new theme
    const handleCreateNew = () => {
        setCreatingNew(true);
        setEditingTheme(null);
    };

    // Save new theme
    const handleSaveNewTheme = async (name: string, lightColors: ThemeColors, darkColors: ThemeColors) => {
        try {
            const newThemeData = {
                name,
                description: 'Custom theme',
                type: 'custom' as const,
                config: createThemeConfig(name, lightColors, darkColors),
                is_active: false,
                is_default: false,
            };

            await axios.post(`${API_URL}/themes/`, newThemeData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            setCreatingNew(false);
            fetchThemes();
        } catch (err: any) {
            console.error('Error creating theme:', err);
            alert(err.response?.data?.detail || 'Failed to create theme');
        }
    };

    // Cancel create/edit
    const handleCancel = () => {
        setEditingTheme(null);
        setCreatingNew(false);
    };

    const renderThemes = () => {
        let filteredThemes = themes;

        if (activeTab === 'active') {
            filteredThemes = themes.filter((t) => t.is_active);
        } else if (activeTab === 'archived') {
            filteredThemes = themes.filter((t) => !t.is_active);
        }

        if (filteredThemes.length === 0) {
            return (
                <div className="p-8 text-center theme-text-secondary border border-dashed rounded-lg">
                    No themes found. Create a new palette to get started.
                </div>
            );
        }

        return filteredThemes.map((theme) => {
            const lightColors = extractColorsFromConfig(theme.config, 'light');
            const darkColors = extractColorsFromConfig(theme.config, 'dark');

            return (
                <div
                    key={theme.id}
                    className={`theme-surface rounded-xl border theme-border overflow-hidden shadow-sm transition-opacity ${
                        theme.is_active ? '' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                    <div className="p-5 border-b theme-border flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold theme-text-base">{theme.name}</h3>
                            <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                    theme.is_active
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {theme.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {theme.is_active ? (
                                <button
                                    onClick={() => handleDeactivateTheme(theme.id)}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 transition-colors flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" />
                                    Deactivate
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleActivateTheme(theme.id)}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-4 h-4" />
                                    Activate
                                </button>
                            )}
                            <button
                                onClick={() => handleDuplicate(theme.id)}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                            >
                                <Copy className="w-4 h-4" />
                                Duplicate
                            </button>
                            <button
                                onClick={() => handleEdit(theme)}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(theme.id)}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 transition-colors flex items-center gap-1"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {/* Light Mode Colors */}
                            {(['primary', 'secondary', 'accent', 'background', 'textMain', 'textMuted', 'textInvert'] as const).map(
                                (colorKey) => (
                                    <div key={`light-${colorKey}`} className="space-y-2">
                                        <div className="text-sm font-medium theme-text-secondary flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-white border border-slate-300"></span>
                                            Light {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                                        </div>
                                        <div className="relative">
                                            <div
                                                className="h-12 w-full rounded-lg shadow-inner border theme-border cursor-pointer"
                                                style={{ backgroundColor: lightColors[colorKey] }}
                                                onClick={() =>
                                                    setActiveColorPicker(
                                                        activeColorPicker?.themeId === theme.id &&
                                                            activeColorPicker?.colorKey === colorKey &&
                                                            activeColorPicker?.mode === 'light'
                                                            ? null
                                                            : { themeId: theme.id, colorKey, mode: 'light' }
                                                    )
                                                }
                                            ></div>
                                            {activeColorPicker?.themeId === theme.id &&
                                                activeColorPicker?.colorKey === colorKey &&
                                                activeColorPicker?.mode === 'light' && (
                                                    <div className="absolute z-10 top-full left-0 mt-1">
                                                        <HexColorPicker
                                                            color={lightColors[colorKey]}
                                                            onChange={(value) =>
                                                                handleColorChange(theme.id, colorKey, value, 'light')
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            <input
                                                className="w-full text-xs font-mono py-1.5 px-2 rounded theme-surface border theme-border theme-text-base"
                                                type="text"
                                                value={lightColors[colorKey]}
                                                onChange={(e) =>
                                                    handleColorChange(theme.id, colorKey, e.target.value, 'light')
                                                }
                                            />
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Dark Mode Colors - Second Row */}
                        <div className="mt-6 pt-6 border-t theme-border">
                            <h4 className="text-sm font-semibold theme-text-secondary mb-4">Dark Mode Colors</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {(['primary', 'secondary', 'accent', 'background', 'textMain', 'textMuted', 'textInvert'] as const).map(
                                    (colorKey) => (
                                        <div key={`dark-${colorKey}`} className="space-y-2">
                                            <div className="text-sm font-medium theme-text-secondary flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-600"></span>
                                                Dark {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                                            </div>
                                            <div className="relative">
                                                <div
                                                    className="h-12 w-full rounded-lg shadow-inner border theme-border cursor-pointer"
                                                    style={{ backgroundColor: darkColors[colorKey] }}
                                                    onClick={() =>
                                                        setActiveColorPicker(
                                                            activeColorPicker?.themeId === theme.id &&
                                                                activeColorPicker?.colorKey === colorKey &&
                                                                activeColorPicker?.mode === 'dark'
                                                                ? null
                                                                : { themeId: theme.id, colorKey, mode: 'dark' }
                                                        )
                                                    }
                                                ></div>
                                                {activeColorPicker?.themeId === theme.id &&
                                                    activeColorPicker?.colorKey === colorKey &&
                                                    activeColorPicker?.mode === 'dark' && (
                                                        <div className="absolute z-10 top-full left-0 mt-1">
                                                            <HexColorPicker
                                                                color={darkColors[colorKey]}
                                                                onChange={(value) =>
                                                                    handleColorChange(theme.id, colorKey, value, 'dark')
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                <input
                                                    className="w-full text-xs font-mono py-1.5 px-2 rounded theme-surface border theme-border theme-text-base"
                                                    type="text"
                                                    value={darkColors[colorKey]}
                                                    onChange={(e) =>
                                                        handleColorChange(theme.id, colorKey, e.target.value, 'dark')
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    // Create New Theme Form
    if (creatingNew) {
        return <CreateThemeForm onSave={handleSaveNewTheme} onCancel={handleCancel} />;
    }

    // Edit Theme - could be expanded to full editor
    if (editingTheme) {
        return (
            <EditThemeForm
                theme={editingTheme}
                onSave={(updatedTheme) => {
                    setEditingTheme(updatedTheme);
                    fetchThemes();
                }}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold theme-text-base">Color Palettes</h1>
                            <p className="theme-text-secondary mt-1">
                                Manage and configure theme colors across the system.
                            </p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-5 py-2.5 theme-primary text-white rounded-lg font-semibold hover:opacity-90 transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create New Palette</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b theme-border gap-8">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`pb-3 border-b-2 font-bold transition-colors ${
                                activeTab === 'all'
                                    ? 'border-[var(--theme-primary-value)] text-[var(--theme-primary-value)]'
                                    : 'border-transparent theme-text-secondary hover:text-[var(--theme-text-base)]'
                            }`}
                        >
                            All Palettes
                        </button>
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-3 border-b-2 font-bold transition-colors ${
                                activeTab === 'active'
                                    ? 'border-[var(--theme-primary-value)] text-[var(--theme-primary-value)]'
                                    : 'border-transparent theme-text-secondary hover:text-[var(--theme-text-base)]'
                            }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`pb-3 border-b-2 font-bold transition-colors ${
                                activeTab === 'archived'
                                    ? 'border-[var(--theme-primary-value)] text-[var(--theme-primary-value)]'
                                    : 'border-transparent theme-text-secondary hover:text-[var(--theme-text-base)]'
                            }`}
                        >
                            Archived
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Palette Cards List */}
                    {!loading && !error && <div className="grid grid-cols-1 gap-6">{renderThemes()}</div>}
                </div>
            </div>
        </div>
    );
};

// Create Theme Form Component
interface CreateThemeFormProps {
    onSave: (name: string, lightColors: ThemeColors, darkColors: ThemeColors) => Promise<void>;
    onCancel: () => void;
}

const CreateThemeForm: React.FC<CreateThemeFormProps> = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [lightColors, setLightColors] = useState<ThemeColors>({
        primary: '#13a4ec',
        secondary: '#4b5563',
        accent: '#f59e0b',
        background: '#f6f7f8',
        textMain: '#0f172a',
        textMuted: '#64748b',
        textInvert: '#ffffff',
    });
    const [darkColors, setDarkColors] = useState<ThemeColors>({
        primary: '#38bdf8',
        secondary: '#94a3b8',
        accent: '#fbbf24',
        background: '#101c22',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
        textInvert: '#1e293b',
    });
    const [activePicker, setActivePicker] = useState<{
        mode: 'light' | 'dark';
        key: keyof ThemeColors;
    } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Please enter a theme name');
            return;
        }
        setSaving(true);
        await onSave(name, lightColors, darkColors);
        setSaving(false);
    };

    const renderColorPicker = (
        mode: 'light' | 'dark',
        key: keyof ThemeColors,
        label: string,
        colors: ThemeColors,
        setColors: React.Dispatch<React.SetStateAction<ThemeColors>>
    ) => (
        <div className="space-y-2">
            <label className="text-sm font-medium theme-text-secondary">{label}</label>
            <div className="relative">
                <div
                    className="h-12 w-full rounded-lg border theme-border cursor-pointer"
                    style={{ backgroundColor: colors[key] }}
                    onClick={() => setActivePicker(activePicker?.mode === mode && activePicker?.key === key ? null : { mode, key })}
                />
                {activePicker?.mode === mode && activePicker?.key === key && (
                    <div className="absolute z-10 top-full left-0 mt-1">
                        <HexColorPicker
                            color={colors[key]}
                            onChange={(value) => setColors({ ...colors, [key]: value })}
                        />
                    </div>
                )}
                <input
                    type="text"
                    value={colors[key]}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    className="w-full text-xs font-mono py-1.5 px-2 rounded theme-surface border theme-border theme-text-base mt-1"
                />
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold theme-text-base">Create New Theme</h2>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 theme-text-secondary" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Theme Name */}
                        <div>
                            <label className="block text-sm font-semibold theme-text-base mb-2">Theme Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Ocean Blue, Sunset, Custom"
                                className="w-full px-4 py-2.5 rounded-lg border theme-border theme-surface theme-text-base focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                        </div>

                        {/* Light Mode Colors */}
                        <div className="p-6 rounded-xl border theme-border bg-white/50 dark:bg-slate-800/50">
                            <h3 className="text-lg font-semibold theme-text-base mb-4 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                                Light Mode Colors
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderColorPicker('light', 'primary', 'Primary', lightColors, setLightColors)}
                                {renderColorPicker('light', 'secondary', 'Secondary', lightColors, setLightColors)}
                                {renderColorPicker('light', 'accent', 'Accent', lightColors, setLightColors)}
                                {renderColorPicker('light', 'background', 'Background', lightColors, setLightColors)}
                                {renderColorPicker('light', 'textMain', 'Text Main', lightColors, setLightColors)}
                                {renderColorPicker('light', 'textMuted', 'Text Muted', lightColors, setLightColors)}
                                {renderColorPicker('light', 'textInvert', 'Text Invert', lightColors, setLightColors)}
                            </div>
                        </div>

                        {/* Dark Mode Colors */}
                        <div className="p-6 rounded-xl border theme-border bg-slate-100/50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-semibold theme-text-base mb-4 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600"></span>
                                Dark Mode Colors
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderColorPicker('dark', 'primary', 'Primary', darkColors, setDarkColors)}
                                {renderColorPicker('dark', 'secondary', 'Secondary', darkColors, setDarkColors)}
                                {renderColorPicker('dark', 'accent', 'Accent', darkColors, setDarkColors)}
                                {renderColorPicker('dark', 'background', 'Background', darkColors, setDarkColors)}
                                {renderColorPicker('dark', 'textMain', 'Text Main', darkColors, setDarkColors)}
                                {renderColorPicker('dark', 'textMuted', 'Text Muted', darkColors, setDarkColors)}
                                {renderColorPicker('dark', 'textInvert', 'Text Invert', darkColors, setDarkColors)}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t theme-border">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                                Save Theme
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-3 border theme-border theme-text-base rounded-lg font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Edit Theme Form Component
interface EditThemeFormProps {
    theme: Theme;
    onSave: (theme: Theme) => void;
    onCancel: () => void;
}

const EditThemeForm: React.FC<EditThemeFormProps> = ({ theme, onSave, onCancel }) => {
    const [name, setName] = useState(theme.name);
    const [description, setDescription] = useState(theme.description || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.patch(
                `${API_URL}/themes/${theme.id}`,
                { name, description },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                }
            );
            onSave({ ...theme, name, description });
        } catch (err: any) {
            console.error('Error updating theme:', err);
            alert(err.response?.data?.detail || 'Failed to update theme');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold theme-text-base">Edit Theme</h2>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 theme-text-secondary" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold theme-text-base mb-2">Theme Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border theme-border theme-surface theme-text-base focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold theme-text-base mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-lg border theme-border theme-surface theme-text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>

                        <div className="flex gap-4 pt-4 border-t theme-border">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-6 py-3 border theme-border theme-text-base rounded-lg font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
