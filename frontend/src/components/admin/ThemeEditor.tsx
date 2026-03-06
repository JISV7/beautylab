import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTheme } from '../../contexts/ThemeContext';
import { Save, Palette, Type, Layout, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

interface ThemeEditorProps {
    onSave?: () => void;
}

interface ColorField {
    key: string;
    label: string;
}

interface TypographyField {
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: string[];
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ onSave }) => {
    const { themeData, config, saveCustomTheme, getCustomTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components'>('colors');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [savingToLocal, setSavingToLocal] = useState(false);

    // Get custom theme or use default
    const customTheme = getCustomTheme();
    const currentModeData = customTheme?.[config.mode] || themeData[config.mode];

    // Base colors state - synced with current theme
    const [colors, setColors] = useState({
        primary: currentModeData.colors.primary,
        secondary: currentModeData.colors.secondary,
        accent: currentModeData.colors.accent,
        background: currentModeData.colors.background,
        surface: currentModeData.colors.surface,
        border: currentModeData.colors.border,
        text: currentModeData.colors.text,
        textSecondary: currentModeData.colors.textSecondary,
    });

    // Typography state
    const [typography, setTypography] = useState({
        titleFont: currentModeData.typography.title.fontFamily,
        titleSize: currentModeData.typography.title.fontSize,
        subtitleFont: currentModeData.typography.subtitle.fontFamily,
        subtitleSize: currentModeData.typography.subtitle.fontSize,
        paragraphFont: currentModeData.typography.paragraph.fontFamily,
        paragraphSize: currentModeData.typography.paragraph.fontSize,
    });

    // Dashboard component colors
    const [dashboardColors, setDashboardColors] = useState({
        sidebarBg: currentModeData.components?.dashboard?.sidebar.backgroundColor || '#FFFFFF',
        sidebarBorder: currentModeData.components?.dashboard?.sidebar.borderColor || '#E5E7EB',
        sidebarText: currentModeData.components?.dashboard?.sidebar.textColor || '#000000',
        sidebarActiveBg: currentModeData.components?.dashboard?.sidebar.activeBackground || '#F83A3A',
        welcomeBg: currentModeData.components?.dashboard?.welcomeHero.backgroundColor || '#F83A3A',
        statCardBg: currentModeData.components?.dashboard?.statCard.backgroundColor || '#FFFFFF',
        statValueColor: currentModeData.components?.dashboard?.statCard.valueColor || '#F83A3A',
        courseCardBg: currentModeData.components?.dashboard?.courseCard.backgroundColor || '#FFFFFF',
        progressFill: currentModeData.components?.dashboard?.courseCard.progressBarFill || '#F83A3A',
    });

    // Sync state when theme changes
    useEffect(() => {
        const modeData = customTheme?.[config.mode] || themeData[config.mode];
        setColors({
            primary: modeData.colors.primary,
            secondary: modeData.colors.secondary,
            accent: modeData.colors.accent,
            background: modeData.colors.background,
            surface: modeData.colors.surface,
            border: modeData.colors.border,
            text: modeData.colors.text,
            textSecondary: modeData.colors.textSecondary,
        });
        setTypography({
            titleFont: modeData.typography.title.fontFamily,
            titleSize: modeData.typography.title.fontSize,
            subtitleFont: modeData.typography.subtitle.fontFamily,
            subtitleSize: modeData.typography.subtitle.fontSize,
            paragraphFont: modeData.typography.paragraph.fontFamily,
            paragraphSize: modeData.typography.paragraph.fontSize,
        });
        setDashboardColors({
            sidebarBg: modeData.components?.dashboard?.sidebar.backgroundColor || '#FFFFFF',
            sidebarBorder: modeData.components?.dashboard?.sidebar.borderColor || '#E5E7EB',
            sidebarText: modeData.components?.dashboard?.sidebar.textColor || '#000000',
            sidebarActiveBg: modeData.components?.dashboard?.sidebar.activeBackground || '#F83A3A',
            welcomeBg: modeData.components?.dashboard?.welcomeHero.backgroundColor || '#F83A3A',
            statCardBg: modeData.components?.dashboard?.statCard.backgroundColor || '#FFFFFF',
            statValueColor: modeData.components?.dashboard?.statCard.valueColor || '#F83A3A',
            courseCardBg: modeData.components?.dashboard?.courseCard.backgroundColor || '#FFFFFF',
            progressFill: modeData.components?.dashboard?.courseCard.progressBarFill || '#F83A3A',
        });
    }, [customTheme, config.mode, themeData]);

    const handleColorChange = (key: string, value: string) => {
        setColors((prev) => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    const handleTypographyChange = (key: keyof typeof typography, value: string) => {
        setTypography((prev) => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    const handleDashboardColorChange = (key: string, value: string) => {
        setDashboardColors((prev) => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    // Save to local custom theme (localStorage)
    const handleSaveTheme = () => {
        setSavingToLocal(true);
        const customThemeData = {
            [config.mode]: {
                colors,
                typography: {
                    title: {
                        fontFamily: typography.titleFont,
                        fontSize: typography.titleSize,
                    },
                    subtitle: {
                        fontFamily: typography.subtitleFont,
                        fontSize: typography.subtitleSize,
                    },
                    paragraph: {
                        fontFamily: typography.paragraphFont,
                        fontSize: typography.paragraphSize,
                    },
                },
                components: {
                    dashboard: {
                        sidebar: {
                            backgroundColor: dashboardColors.sidebarBg,
                            borderColor: dashboardColors.sidebarBorder,
                            textColor: dashboardColors.sidebarText,
                            textSecondary: themeData[config.mode].colors.textSecondary,
                            hoverBackground: themeData[config.mode].components?.dashboard?.sidebar.hoverBackground || '#f3f4f6',
                            activeBackground: dashboardColors.sidebarActiveBg,
                            activeTextColor: '#FFFFFF',
                        },
                        header: {
                            backgroundColor: themeData[config.mode].components?.dashboard?.header.backgroundColor || '#FFFFFF',
                            borderColor: dashboardColors.sidebarBorder,
                            textColor: colors.text,
                        },
                        welcomeHero: {
                            backgroundColor: dashboardColors.welcomeBg,
                            textColor: '#FFFFFF',
                            titleColor: '#FFFFFF',
                            descriptionColor: '#ffffff',
                            buttonBackgroundColor: '#FFFFFF',
                            buttonTextColor: dashboardColors.welcomeBg,
                        },
                        statCard: {
                            backgroundColor: dashboardColors.statCardBg,
                            borderColor: dashboardColors.sidebarBorder,
                            titleColor: themeData[config.mode].colors.textSecondary,
                            valueColor: dashboardColors.statValueColor,
                            iconBackgroundColor: dashboardColors.statValueColor,
                            iconColor: '#FFFFFF',
                        },
                        courseCard: {
                            backgroundColor: dashboardColors.courseCardBg,
                            borderColor: dashboardColors.sidebarBorder,
                            titleColor: colors.text,
                            progressBarBackground: themeData[config.mode].components?.dashboard?.courseCard.progressBarBackground || '#e5e7eb',
                            progressBarFill: dashboardColors.progressFill,
                        },
                        aiWidget: {
                            backgroundColor: dashboardColors.courseCardBg,
                            borderColor: dashboardColors.sidebarBorder,
                            titleColor: colors.accent,
                            textColor: colors.text,
                        },
                    },
                },
            },
        };

        saveCustomTheme(customThemeData as any);
        setHasUnsavedChanges(false);
        setSavingToLocal(false);
        onSave?.();
    };

    // Save to backend database
    const handleSaveToBackend = async () => {
        setSaving(true);
        try {
            const themeConfig = {
                light: {
                    colors: {
                        primary: colors.primary,
                        secondary: colors.secondary,
                        accent: colors.accent,
                        background: colors.background,
                        surface: colors.surface,
                        border: colors.border,
                        text: colors.text,
                        textSecondary: colors.textSecondary,
                    },
                    typography: {
                        title: { fontFamily: typography.titleFont, fontSize: typography.titleSize },
                        subtitle: { fontFamily: typography.subtitleFont, fontSize: typography.subtitleSize },
                        paragraph: { fontFamily: typography.paragraphFont, fontSize: typography.paragraphSize },
                    },
                },
                dark: {
                    colors: {
                        primary: colors.primary,
                        secondary: colors.secondary,
                        accent: colors.accent,
                        background: colors.background,
                        surface: colors.surface,
                        border: colors.border,
                        text: colors.text,
                        textSecondary: colors.textSecondary,
                    },
                    typography: {
                        title: { fontFamily: typography.titleFont, fontSize: typography.titleSize },
                        subtitle: { fontFamily: typography.subtitleFont, fontSize: typography.subtitleSize },
                        paragraph: { fontFamily: typography.paragraphFont, fontSize: typography.paragraphSize },
                    },
                },
                components: {
                    dashboard: {
                        sidebar: {
                            backgroundColor: dashboardColors.sidebarBg,
                            borderColor: dashboardColors.sidebarBorder,
                            textColor: dashboardColors.sidebarText,
                            textSecondary: themeData[config.mode].colors.textSecondary,
                            hoverBackground: themeData[config.mode].components?.dashboard?.sidebar.hoverBackground || '#f3f4f6',
                            activeBackground: dashboardColors.sidebarActiveBg,
                            activeTextColor: '#FFFFFF',
                        },
                        header: {
                            backgroundColor: themeData[config.mode].components?.dashboard?.header.backgroundColor || '#FFFFFF',
                            borderColor: dashboardColors.sidebarBorder,
                            textColor: colors.text,
                        },
                        welcomeHero: {
                            backgroundColor: dashboardColors.welcomeBg,
                            textColor: '#FFFFFF',
                            titleColor: '#FFFFFF',
                            descriptionColor: '#ffffff',
                            buttonBackgroundColor: '#FFFFFF',
                            buttonTextColor: dashboardColors.welcomeBg,
                        },
                        statCard: {
                            backgroundColor: dashboardColors.statCardBg,
                            borderColor: dashboardColors.sidebarBorder,
                            titleColor: themeData[config.mode].colors.textSecondary,
                            valueColor: dashboardColors.statValueColor,
                            iconBackgroundColor: dashboardColors.statValueColor,
                            iconColor: '#FFFFFF',
                        },
                        courseCard: {
                            backgroundColor: dashboardColors.courseCardBg,
                            borderColor: dashboardColors.sidebarBorder,
                            titleColor: colors.text,
                            progressBarBackground: themeData[config.mode].components?.dashboard?.courseCard.progressBarBackground || '#e5e7eb',
                            progressBarFill: dashboardColors.progressFill,
                        },
                        aiWidget: {
                            backgroundColor: dashboardColors.courseCardBg,
                            borderColor: dashboardColors.sidebarBorder,
                            titleColor: colors.accent,
                            textColor: colors.text,
                        },
                    },
                },
            };

            // Create new theme in backend
            const newTheme = {
                name: `Custom ${config.mode.charAt(0).toUpperCase() + config.mode.slice(1)} Theme`,
                description: 'Custom theme created from Theme Editor',
                type: 'custom' as const,
                config: themeConfig,
                is_active: false,
                is_default: false,
            };

            await axios.post(`${API_URL}/themes/`, newTheme, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            alert('Theme saved to database successfully!');
            setHasUnsavedChanges(false);
        } catch (err: any) {
            console.error('Error saving theme to backend:', err);
            alert(err.response?.data?.detail || 'Failed to save theme to database');
        } finally {
            setSaving(false);
        }
    };

    const colorFields: ColorField[] = [
        { key: 'primary', label: 'Primary Color' },
        { key: 'secondary', label: 'Secondary Color' },
        { key: 'accent', label: 'Accent Color' },
        { key: 'background', label: 'Background' },
        { key: 'surface', label: 'Surface' },
        { key: 'border', label: 'Border' },
        { key: 'text', label: 'Text Color' },
        { key: 'textSecondary', label: 'Secondary Text' },
    ];

    const dashboardColorFields: ColorField[] = [
        { key: 'sidebarBg', label: 'Sidebar Background' },
        { key: 'sidebarBorder', label: 'Sidebar Border' },
        { key: 'sidebarText', label: 'Sidebar Text' },
        { key: 'sidebarActiveBg', label: 'Sidebar Active BG' },
        { key: 'welcomeBg', label: 'Welcome Hero BG' },
        { key: 'statCardBg', label: 'Stat Card BG' },
        { key: 'statValueColor', label: 'Stat Value Color' },
        { key: 'courseCardBg', label: 'Course Card BG' },
        { key: 'progressFill', label: 'Progress Bar Fill' },
    ];

    const typographyFields: TypographyField[] = [
        { key: 'titleFont', label: 'Title Font Family', type: 'text' },
        { key: 'titleSize', label: 'Title Font Size', type: 'text' },
        { key: 'subtitleFont', label: 'Subtitle Font Family', type: 'text' },
        { key: 'subtitleSize', label: 'Subtitle Font Size', type: 'text' },
        { key: 'paragraphFont', label: 'Paragraph Font', type: 'text' },
        { key: 'paragraphSize', label: 'Paragraph Size', type: 'text' },
    ];

    const renderColorPicker = (field: ColorField, value: string, onChange: (value: string) => void) => (
        <div className="flex items-center justify-between py-2">
            <label className="text-sm theme-text-secondary flex-1">{field.label}</label>
            <div className="flex items-center gap-2">
                <span className="text-xs theme-text-secondary font-mono w-20 text-right">{value}</span>
                <div className="relative">
                    <div
                        className="w-12 h-10 rounded border theme-border cursor-pointer"
                        style={{ backgroundColor: value }}
                        onClick={() => setActiveColorPicker(activeColorPicker === field.key ? null : field.key)}
                    />
                    {activeColorPicker === field.key && (
                        <div className="absolute z-10 bottom-full right-0 mb-1">
                            <HexColorPicker color={value} onChange={onChange} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex gap-6">
            {/* Editor Panel */}
            <div className="flex-1">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold theme-text-base mb-2">Theme Editor</h1>
                    <p className="theme-text-secondary">
                        Customize the appearance of your platform. Changes are previewed in real-time.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b theme-border">
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={`admin-tab pb-2 flex items-center gap-2 ${
                            activeTab === 'colors' ? 'admin-tab-active' : ''
                        }`}
                    >
                        <Palette className="w-4 h-4" />
                        Colors
                    </button>
                    <button
                        onClick={() => setActiveTab('typography')}
                        className={`admin-tab pb-2 flex items-center gap-2 ${
                            activeTab === 'typography' ? 'admin-tab-active' : ''
                        }`}
                    >
                        <Type className="w-4 h-4" />
                        Typography
                    </button>
                    <button
                        onClick={() => setActiveTab('components')}
                        className={`admin-tab pb-2 flex items-center gap-2 ${
                            activeTab === 'components' ? 'admin-tab-active' : ''
                        }`}
                    >
                        <Layout className="w-4 h-4" />
                        Components
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'colors' && (
                    <div className="admin-editor-panel mb-6">
                        <h3 className="text-lg font-semibold theme-text-base mb-4">Base Colors</h3>
                        <div className="space-y-1">
                            {colorFields.map((field) => (
                                <div key={field.key}>{renderColorPicker(field, colors[field.key], (v) => handleColorChange(field.key, v))}</div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'typography' && (
                    <div className="admin-editor-panel mb-6">
                        <h3 className="text-lg font-semibold theme-text-base mb-4">Typography</h3>
                        <div className="space-y-3">
                            {typographyFields.map((field) => (
                                <div key={field.key} className="flex items-center justify-between py-2">
                                    <label className="text-sm theme-text-secondary">{field.label}</label>
                                    <input
                                        type="text"
                                        value={typography[field.key as keyof typeof typography]}
                                        onChange={(e) => handleTypographyChange(field.key as keyof typeof typography, e.target.value)}
                                        className="text-sm theme-surface theme-border border rounded px-3 py-2 theme-text-base w-48"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'components' && (
                    <div>
                        <div className="admin-editor-panel mb-6">
                            <h3 className="text-lg font-semibold theme-text-base mb-4">Dashboard Colors</h3>
                            <div className="space-y-1">
                                {dashboardColorFields.map((field) => (
                                    <div key={field.key}>
                                        {renderColorPicker(field, dashboardColors[field.key], (v) => handleDashboardColorChange(field.key, v))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6 flex-wrap">
                    <button
                        onClick={handleSaveTheme}
                        disabled={!hasUnsavedChanges || savingToLocal}
                        className="theme-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {savingToLocal && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Save to Local
                    </button>
                    <button
                        onClick={handleSaveToBackend}
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Save to Database
                    </button>
                    {hasUnsavedChanges && (
                        <p className="text-sm theme-text-secondary flex items-center">
                            You have unsaved changes
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
