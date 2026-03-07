import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import type { NamedTheme } from '../../data/theme.types';
import type { ColorPalette, TypographyStyle } from './types';
import { ThemeList } from './ThemeList';
import { ThemeEditor } from './ThemeEditor';
import { ThemePreview } from './ThemePreview';

const API_URL = 'http://localhost:8000';

export const UnifiedThemeConfig: React.FC = () => {
    const { themeData, getCustomTheme, saveCustomTheme, updateTheme, applyTheme, getPublishedThemeName } = useTheme();

    // View mode: 'list' | 'edit' | 'preview'
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list');

    // Theme management state
    const [themes, setThemes] = useState<Record<string, NamedTheme>>({});
    const [activeThemeName, setActiveThemeName] = useState<string>('default');
    const [activeMode, setActiveMode] = useState<'light' | 'dark' | 'accessibility'>('light');
    const [publishedThemeName, setPublishedThemeName] = useState<string | null>(null);

    // DataTables state
    const [currentPage, setCurrentPage] = useState(0);
    const [sortColumn, setSortColumn] = useState<'name' | 'isActive' | 'isPublished'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const rowsPerPage = 10;

    // Initialize themes from themeData
    useEffect(() => {
        const customTheme = getCustomTheme();
        const loadedThemes: Record<string, NamedTheme> = {};

        if (customTheme?.themes) {
            Object.assign(loadedThemes, customTheme.themes);
        }

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

        if ((customTheme as any)?.activeThemeName) {
            setActiveThemeName((customTheme as any).activeThemeName);
        } else {
            setActiveThemeName(Object.keys(loadedThemes)[0] || 'default');
        }

        const pubTheme = getPublishedThemeName();
        if (pubTheme) {
            setPublishedThemeName(pubTheme);
        }
    }, []);

    // Theme CRUD operations
    const handleCreateTheme = () => {
        const name = prompt("Enter a name for the new theme (e.g., 'brand2025'):");
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
        setViewMode('edit');
    };

    const handleDeleteTheme = (themeKey: string) => {
        const theme = themes[themeKey];
        if (!theme) return;

        if (publishedThemeName === themeKey) {
            alert(`Cannot delete "${theme.name}" because it is currently published (active on the site). Please publish a different theme first.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the theme "${theme.name}"?`)) return;

        const newThemes = { ...themes };
        delete newThemes[themeKey];
        setThemes(newThemes);

        if (activeThemeName === themeKey) {
            setActiveThemeName(Object.keys(newThemes)[0]);
        }
    };

    const handlePublishTheme = () => {
        const theme = themes[activeThemeName];
        if (!theme) return;

        if (!window.confirm(`Publish "${theme.name}" to the public site?\n\nThis will make this theme (with its light, dark, and accessibility palettes) available to all users.`)) {
            return;
        }

        applyTheme(activeThemeName);
        setPublishedThemeName(activeThemeName);

        const currentCustom = getCustomTheme() || {};
        saveCustomTheme({
            ...currentCustom,
            themes,
            publishedThemeName: activeThemeName as any
        });

        alert(`Theme "${theme.name}" has been published! Users will now see this theme.`);
    };

    const handleSaveTheme = (colors: ColorPalette, styles: Record<string, TypographyStyle>) => {
        const theme = themes[activeThemeName];
        if (!theme) return;

        const updatedTheme: NamedTheme = {
            ...theme,
            [activeMode]: {
                ...theme[activeMode],
                colors: {
                    ...theme[activeMode].colors,
                    ...colors,
                    text: styles.h1.color,
                    textSecondary: styles.p.color
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

        updateTheme({ mode: activeMode });

        alert(`Theme "${theme.name}" saved successfully!`);
    };

    const handleDiscardTheme = () => {
        // Will be handled by the ThemeEditor component re-syncing
    };

    // Table handlers
    const handleSort = (column: 'name' | 'isActive' | 'isPublished') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Render based on view mode
    if (viewMode === 'list') {
        return (
            <ThemeList
                themes={themes}
                activeThemeName={activeThemeName}
                publishedThemeName={publishedThemeName}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onCreateTheme={handleCreateTheme}
                onEdit={(key) => {
                    setActiveThemeName(key);
                    setViewMode('edit');
                }}
                onPreview={(key) => {
                    setActiveThemeName(key);
                    setViewMode('preview');
                }}
                onDelete={handleDeleteTheme}
                onPageChange={setCurrentPage}
                onSort={handleSort}
            />
        );
    }

    if (viewMode === 'preview') {
        const theme = themes[activeThemeName];
        if (!theme) return null;

        return (
            <ThemePreview
                theme={theme}
                themeKey={activeThemeName}
                onEdit={() => setViewMode('edit')}
                onClose={() => setViewMode('list')}
                onPublish={handlePublishTheme}
            />
        );
    }

    // Edit mode
    const theme = themes[activeThemeName];
    if (!theme) return null;

    return (
        <ThemeEditor
            theme={theme}
            themeKey={activeThemeName}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            onSave={(colors, styles) => handleSaveTheme(colors, styles)}
            onDiscard={handleDiscardTheme}
            onPublish={handlePublishTheme}
            onBack={() => setViewMode('list')}
        />
    );
};
