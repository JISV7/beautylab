import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Theme, ThemeConfig, ThemePalette, TypographyElement } from '../../data/theme.types';
import type { ColorPalette, TypographyStyle } from './types';
import { ThemeTable } from './ThemeTable';
import { ThemeEditor } from './ThemeEditor';
import { ThemePreview } from './ThemePreview';

// Helper to convert ColorPalette + TypographyStyle to ThemePalette
const toThemePalette = (colors: ColorPalette, styles: Record<string, TypographyStyle>): ThemePalette => ({
    colors,
    typography: {
        h1: { fontName: styles.h1.fontFamily, fontSize: String(styles.h1.size), fontWeight: 400, color: styles.h1.color },
        h2: { fontName: styles.h2.fontFamily, fontSize: String(styles.h2.size), fontWeight: 400, color: styles.h2.color },
        h3: { fontName: styles.h3.fontFamily, fontSize: String(styles.h3.size), fontWeight: 400, color: styles.h3.color },
        h4: { fontName: styles.h4.fontFamily, fontSize: String(styles.h4.size), fontWeight: 400, color: styles.h4.color },
        h5: { fontName: styles.h5.fontFamily, fontSize: String(styles.h5.size), fontWeight: 400, color: styles.h5.color },
        h6: { fontName: styles.h6.fontFamily, fontSize: String(styles.h6.size), fontWeight: 400, color: styles.h6.color },
        title: { fontName: styles.h1.fontFamily, fontSize: String(styles.h1.size), fontWeight: 700, color: styles.h1.color },
        subtitle: { fontName: styles.h2.fontFamily, fontSize: String(styles.h2.size), fontWeight: 600, color: styles.h2.color },
        paragraph: { fontName: styles.p.fontFamily, fontSize: String(styles.p.size), fontWeight: 400, color: styles.p.color },
    }
});

export const UnifiedThemeConfig: React.FC = () => {
    const { fetchAllThemes, activateTheme, createTheme, updateTheme, deleteTheme } = useTheme();

    // View mode: 'list' | 'edit' | 'preview'
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list');

    // Theme management state
    const [themes, setThemes] = useState<Theme[]>([]);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<'light' | 'dark' | 'accessibility'>('light');
    const [publishedThemeId, setPublishedThemeId] = useState<string | null>(null);

    // DataTables state
    const [currentPage, setCurrentPage] = useState(0);
    const [sortColumn, setSortColumn] = useState<'name' | 'isActive' | 'isDefault'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const rowsPerPage = 10;

    // Load themes from API
    useEffect(() => {
        const loadThemes = async () => {
            const loadedThemes = await fetchAllThemes();
            setThemes(loadedThemes);
            
            // Find active and default themes
            const active = loadedThemes.find(t => t.isActive);
            const defaultTheme = loadedThemes.find(t => t.isDefault);
            
            if (active) {
                setActiveThemeId(active.id);
            } else if (defaultTheme) {
                setActiveThemeId(defaultTheme.id);
            } else if (loadedThemes.length > 0) {
                setActiveThemeId(loadedThemes[0].id);
            }
            
            // Published theme is the active one
            if (active) {
                setPublishedThemeId(active.id);
            }
        };
        
        loadThemes();
    }, [fetchAllThemes]);

    // Get active theme object
    const activeTheme = themes.find(t => t.id === activeThemeId) || null;

    // Theme CRUD operations
    const handleCreateTheme = async () => {
        const name = prompt("Enter a name for the new theme:");
        if (!name) return;

        try {
            // Create a new theme based on the default fallback structure
            const baseTheme = activeTheme || themes[0];
            const newThemeData: Partial<Theme> = {
                name,
                description: '',
                type: 'custom' as const,
                config: baseTheme ? JSON.parse(JSON.stringify(baseTheme.config)) : createDefaultConfig(),
                isActive: false,
                isDefault: false,
            };

            const created = await createTheme(newThemeData);
            setThemes(prev => [...prev, created]);
            setActiveThemeId(created.id);
            setViewMode('edit');
        } catch (error) {
            console.error('Failed to create theme:', error);
            alert('Failed to create theme');
        }
    };

    const handleDuplicateTheme = async (themeId: string) => {
        const sourceTheme = themes.find(t => t.id === themeId);
        if (!sourceTheme) return;

        const newName = prompt("Enter a name for the duplicated theme:", `${sourceTheme.name} Copy`);
        if (!newName) return;

        try {
            const newThemeData: Partial<Theme> = {
                name: newName,
                description: sourceTheme.description,
                type: 'custom' as const,
                config: JSON.parse(JSON.stringify(sourceTheme.config)),
                isActive: false,
                isDefault: false,
            };

            const created = await createTheme(newThemeData);
            setThemes(prev => [...prev, created]);
            setActiveThemeId(created.id);
            setViewMode('edit');
        } catch (error) {
            console.error('Failed to duplicate theme:', error);
            alert('Failed to duplicate theme');
        }
    };

    const handleDeleteTheme = async (themeId: string) => {
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        if (theme.isDefault) {
            alert(`Cannot delete "${theme.name}" because it is the default theme.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete "${theme.name}"?`)) return;

        try {
            await deleteTheme(themeId);
            setThemes(prev => prev.filter(t => t.id !== themeId));
            if (activeThemeId === themeId) {
                setActiveThemeId(null);
            }
            if (publishedThemeId === themeId) {
                setPublishedThemeId(null);
            }
            setViewMode('list');
        } catch (error) {
            console.error('Failed to delete theme:', error);
            alert('Failed to delete theme');
        }
    };

    const handlePublishTheme = async () => {
        if (!activeTheme) return;

        if (!window.confirm(`Activate "${activeTheme.name}"? This will make it the active theme for all users.`)) {
            return;
        }

        try {
            await activateTheme(activeTheme.id);
            // Update local state
            setThemes(prev => prev.map(t => ({
                ...t,
                isActive: t.id === activeTheme.id
            })));
            setPublishedThemeId(activeTheme.id);
            alert(`Theme "${activeTheme.name}" has been activated!`);
        } catch (error) {
            console.error('Failed to activate theme:', error);
            alert('Failed to activate theme');
        }
    };

    const handleSaveTheme = async (colors: ColorPalette, styles: Record<string, TypographyStyle>) => {
        if (!activeTheme) return;

        const newPalette = toThemePalette(colors, styles);
        const newConfig: ThemeConfig = {
            ...activeTheme.config,
            [activeMode]: newPalette
        };

        try {
            const updated = await updateTheme(activeTheme.id, { config: newConfig });
            setThemes(prev => prev.map(t => t.id === updated.id ? updated : t));
            alert(`Theme "${activeTheme.name}" saved successfully!`);
        } catch (error) {
            console.error('Failed to save theme:', error);
            alert('Failed to save theme');
        }
    };

    const handleSort = (column: 'name' | 'isActive' | 'isDefault') => {
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
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b theme-border flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold theme-text-base mb-1">Theme Management</h1>
                        <p className="theme-text-secondary">Create, edit, and publish themes for your site.</p>
                    </div>
                    <button
                        onClick={handleCreateTheme}
                        className="px-4 py-2 text-p-font text-p-size text-p-color theme-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                    >
                        + Create Theme
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <ThemeTable
                        themes={themes}
                        _activeThemeId={activeThemeId}
                        _publishedThemeId={publishedThemeId}
                        currentPage={currentPage}
                        rowsPerPage={rowsPerPage}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onEdit={(id) => {
                            setActiveThemeId(id);
                            setViewMode('edit');
                        }}
                        onPreview={(id) => {
                            setActiveThemeId(id);
                            setViewMode('preview');
                        }}
                        onDelete={handleDeleteTheme}
                        onDuplicate={handleDuplicateTheme}
                        onPageChange={setCurrentPage}
                        onSort={handleSort}
                    />
                </div>
            </div>
        );
    }

    if (viewMode === 'preview' && activeTheme) {
        return (
            <ThemePreview
                theme={activeTheme}
                onEdit={() => setViewMode('edit')}
                onClose={() => {
                    setViewMode('list');
                    setActiveThemeId(null);
                }}
                onPublish={handlePublishTheme}
            />
        );
    }

    if (viewMode === 'edit' && activeTheme) {
        return (
            <ThemeEditor
                theme={activeTheme}
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onSave={handleSaveTheme}
                onPublish={handlePublishTheme}
                onBack={() => {
                    setViewMode('list');
                    setActiveThemeId(null);
                }}
            />
        );
    }

    return null;
};

// Helper to create default theme config
function createDefaultConfig(): ThemeConfig {
    const defaultElement: TypographyElement = {
        fontName: 'system-ui',
        fontSize: '1.0',
        fontWeight: 400,
        color: '#000000'
    };

    const defaultPalette: ThemePalette = {
        colors: {
            primary: '#2f27ce',
            secondary: '#dedcff',
            accent: '#433bff',
            background: '#fbfbfe',
            surface: '#eeeef0',
            border: '#dddddd'
        },
        typography: {
            h1: { ...defaultElement, fontSize: '2.5', fontWeight: 800 },
            h2: { ...defaultElement, fontSize: '2.0', fontWeight: 700 },
            h3: { ...defaultElement, fontSize: '1.75', fontWeight: 600 },
            h4: { ...defaultElement, fontSize: '1.5', fontWeight: 600 },
            h5: { ...defaultElement, fontSize: '1.25', fontWeight: 600 },
            h6: { ...defaultElement, fontSize: '1.0', fontWeight: 600 },
            title: { ...defaultElement, fontSize: '1.5', fontWeight: 700 },
            subtitle: { ...defaultElement, fontSize: '1.25', fontWeight: 600 },
            paragraph: { ...defaultElement, fontSize: '1.0', fontWeight: 400 }
        }
    };

    return {
        light: JSON.parse(JSON.stringify(defaultPalette)),
        dark: JSON.parse(JSON.stringify(defaultPalette)),
        accessibility: JSON.parse(JSON.stringify(defaultPalette))
    };
}
