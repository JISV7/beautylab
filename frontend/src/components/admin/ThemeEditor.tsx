import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PresetSelector } from './PresetSelector';
import { ComponentStyleEditor } from './ComponentStyleEditor';
import { ThemePreview } from './ThemePreview';
import { Save, Palette, Type, Layout } from 'lucide-react';

interface ThemeEditorProps {
    onSave?: () => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ onSave }) => {
    const { themeData, config, saveCustomTheme, resetToPreset } = useTheme();
    const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components'>('colors');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Base colors state
    const [colors, setColors] = useState({
        primary: themeData[config.mode].colors.primary,
        secondary: themeData[config.mode].colors.secondary,
        accent: themeData[config.mode].colors.accent,
        background: themeData[config.mode].colors.background,
        surface: themeData[config.mode].colors.surface,
        border: themeData[config.mode].colors.border,
        text: themeData[config.mode].colors.text,
        textSecondary: themeData[config.mode].colors.textSecondary,
    });

    // Typography state
    const [typography, setTypography] = useState({
        titleFont: themeData[config.mode].typography.title.fontFamily,
        titleSize: themeData[config.mode].typography.title.fontSize,
        subtitleFont: themeData[config.mode].typography.subtitle.fontFamily,
        subtitleSize: themeData[config.mode].typography.subtitle.fontSize,
        paragraphFont: themeData[config.mode].typography.paragraph.fontFamily,
        paragraphSize: themeData[config.mode].typography.paragraph.fontSize,
    });

    // Dashboard component colors
    const [dashboardColors, setDashboardColors] = useState({
        sidebarBg: themeData[config.mode].components?.dashboard?.sidebar.backgroundColor || '#FFFFFF',
        sidebarBorder: themeData[config.mode].components?.dashboard?.sidebar.borderColor || '#E5E7EB',
        sidebarText: themeData[config.mode].components?.dashboard?.sidebar.textColor || '#000000',
        sidebarActiveBg: themeData[config.mode].components?.dashboard?.sidebar.activeBackground || '#F83A3A',
        welcomeBg: themeData[config.mode].components?.dashboard?.welcomeHero.backgroundColor || '#F83A3A',
        statCardBg: themeData[config.mode].components?.dashboard?.statCard.backgroundColor || '#FFFFFF',
        statValueColor: themeData[config.mode].components?.dashboard?.statCard.valueColor || '#F83A3A',
        courseCardBg: themeData[config.mode].components?.dashboard?.courseCard.backgroundColor || '#FFFFFF',
        progressFill: themeData[config.mode].components?.dashboard?.courseCard.progressBarFill || '#F83A3A',
    });

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

    const handleSaveTheme = () => {
        const customTheme = {
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

        saveCustomTheme(customTheme as any);
        setHasUnsavedChanges(false);
        onSave?.();
    };

    const handleResetToPreset = (presetName: string) => {
        resetToPreset(presetName);
        setHasUnsavedChanges(false);
    };

    const colorFields = [
        { key: 'primary', label: 'Primary Color' },
        { key: 'secondary', label: 'Secondary Color' },
        { key: 'accent', label: 'Accent Color' },
        { key: 'background', label: 'Background' },
        { key: 'surface', label: 'Surface' },
        { key: 'border', label: 'Border' },
        { key: 'text', label: 'Text Color' },
        { key: 'textSecondary', label: 'Secondary Text' },
    ] as const;

    const dashboardColorFields = [
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

    const typographyFields = [
        { key: 'titleFont', label: 'Title Font Family', type: 'text' as const },
        { key: 'titleSize', label: 'Title Font Size', type: 'text' as const },
        { key: 'subtitleFont', label: 'Subtitle Font Family', type: 'text' as const },
        { key: 'subtitleSize', label: 'Subtitle Font Size', type: 'text' as const },
        { key: 'paragraphFont', label: 'Paragraph Font', type: 'text' as const },
        { key: 'paragraphSize', label: 'Paragraph Size', type: 'text' as const },
    ];

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

                {/* Preset Selector */}
                <PresetSelector
                    presets={themeData.presets || {}}
                    currentPreset={config.preset}
                    onSelectPreset={handleResetToPreset}
                />

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
                        <div className="space-y-3">
                            {colorFields.map((field) => (
                                <div key={field.key} className="admin-color-picker-wrapper">
                                    <label className="text-sm theme-text-secondary flex-1">{field.label}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs theme-text-secondary font-mono w-20">
                                            {colors[field.key]}
                                        </span>
                                        <input
                                            type="color"
                                            value={colors[field.key]}
                                            onChange={(e) => handleColorChange(field.key, e.target.value)}
                                            className="w-12 h-10 rounded border theme-border cursor-pointer"
                                        />
                                    </div>
                                </div>
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
                        <ComponentStyleEditor
                            title="Dashboard Colors"
                            fields={dashboardColorFields.map((f) => ({ ...f, type: 'color' }))}
                            values={dashboardColors}
                            onChange={handleDashboardColorChange}
                            defaultExpanded
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handleSaveTheme}
                        disabled={!hasUnsavedChanges}
                        className="theme-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Theme
                    </button>
                    {hasUnsavedChanges && (
                        <p className="text-sm theme-text-secondary flex items-center">
                            You have unsaved changes
                        </p>
                    )}
                </div>
            </div>

            {/* Preview Panel */}
            <div className="w-96 flex-shrink-0">
                <ThemePreview />
            </div>
        </div>
    );
};
