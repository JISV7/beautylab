import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Theme, ThemeConfig, ThemePalette } from '../../data/theme.types';
import type { ColorPalette, TypographyStyle } from './types';
import { ThemeTable } from './ThemeTable';
import { ThemeEditor } from './ThemeEditor';
import { ThemePreview } from './ThemePreview';

// Helper to convert ColorPalette + TypographyStyle to ThemePalette
// Preserves existing fontWeight, lineHeight, and fontId from the current palette
const toThemePalette = (
    colors: ColorPalette,
    styles: Record<string, TypographyStyle>,
    currentPalette: ThemePalette
): ThemePalette => ({
    colors,
    typography: {
        h1: {
            fontName: styles.h1.fontFamily,
            fontSize: String(styles.h1.size),
            fontWeight: styles.h1.fontWeight ?? currentPalette.typography.h1?.fontWeight ?? 400,
            lineHeight: styles.h1.lineHeight ?? currentPalette.typography.h1?.lineHeight,
            color: styles.h1.color
        },
        h2: {
            fontName: styles.h2.fontFamily,
            fontSize: String(styles.h2.size),
            fontWeight: styles.h2.fontWeight ?? currentPalette.typography.h2?.fontWeight ?? 400,
            lineHeight: styles.h2.lineHeight ?? currentPalette.typography.h2?.lineHeight,
            color: styles.h2.color
        },
        h3: {
            fontName: styles.h3.fontFamily,
            fontSize: String(styles.h3.size),
            fontWeight: styles.h3.fontWeight ?? currentPalette.typography.h3?.fontWeight ?? 400,
            lineHeight: styles.h3.lineHeight ?? currentPalette.typography.h3?.lineHeight,
            color: styles.h3.color
        },
        h4: {
            fontName: styles.h4.fontFamily,
            fontSize: String(styles.h4.size),
            fontWeight: styles.h4.fontWeight ?? currentPalette.typography.h4?.fontWeight ?? 400,
            lineHeight: styles.h4.lineHeight ?? currentPalette.typography.h4?.lineHeight,
            color: styles.h4.color
        },
        h5: {
            fontName: styles.h5.fontFamily,
            fontSize: String(styles.h5.size),
            fontWeight: styles.h5.fontWeight ?? currentPalette.typography.h5?.fontWeight ?? 400,
            lineHeight: styles.h5.lineHeight ?? currentPalette.typography.h5?.lineHeight,
            color: styles.h5.color
        },
        h6: {
            fontName: styles.h6.fontFamily,
            fontSize: String(styles.h6.size),
            fontWeight: styles.h6.fontWeight ?? currentPalette.typography.h6?.fontWeight ?? 400,
            lineHeight: styles.h6.lineHeight ?? currentPalette.typography.h6?.lineHeight,
            color: styles.h6.color
        },
        title: {
            fontName: styles.h1.fontFamily,
            fontSize: String(styles.h1.size),
            fontWeight: styles.h1.fontWeight ?? currentPalette.typography.title?.fontWeight ?? 700,
            lineHeight: styles.h1.lineHeight ?? currentPalette.typography.title?.lineHeight,
            color: styles.h1.color
        },
        subtitle: {
            fontName: styles.h2.fontFamily,
            fontSize: String(styles.h2.size),
            fontWeight: styles.h2.fontWeight ?? currentPalette.typography.subtitle?.fontWeight ?? 600,
            lineHeight: styles.h2.lineHeight ?? currentPalette.typography.subtitle?.lineHeight,
            color: styles.h2.color
        },
        paragraph: {
            fontName: styles.p.fontFamily,
            fontSize: String(styles.p.size),
            fontWeight: styles.p.fontWeight ?? currentPalette.typography.paragraph?.fontWeight ?? 400,
            lineHeight: styles.p.lineHeight ?? currentPalette.typography.paragraph?.lineHeight,
            color: styles.p.color
        },
        decorator: {
            fontName: styles.p.fontFamily,
            fontSize: String(styles.p.size),
            fontWeight: styles.p.fontWeight ?? currentPalette.typography.decorator?.fontWeight ?? 500,
            lineHeight: styles.p.lineHeight ?? currentPalette.typography.decorator?.lineHeight,
            color: colors.decorator ?? currentPalette.typography.decorator?.color ?? '#ffffff'
        },
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

            // Find active theme
            const active = loadedThemes.find(t => t.isActive);
            if (active) {
                setActiveThemeId(active.id);
            } else if (loadedThemes.length > 0) {
                setActiveThemeId(loadedThemes[0].id);
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
            // Create a new theme based on the first available theme as template
            const baseTheme = themes[0];
            if (!baseTheme) {
                alert('No themes available to use as template');
                return;
            }

            const newThemeData: Partial<Theme> = {
                name,
                description: '',
                type: 'custom' as const,
                config: JSON.parse(JSON.stringify(baseTheme.config)),
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
            alert(`Theme "${activeTheme.name}" has been activated!`);
        } catch (error) {
            console.error('Failed to activate theme:', error);
            alert('Failed to activate theme');
        }
    };

    const handleSaveTheme = async (colors: ColorPalette, styles: Record<string, TypographyStyle>) => {
        if (!activeTheme) return;

        const currentPalette = activeTheme.config[activeMode];
        const newPalette = toThemePalette(colors, styles, currentPalette);
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
                <div className="p-6 border-b theme-border flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-h1-size font-bold mb-1">Theme Management</h1>
                        <p className="theme-text-secondary">Create, edit, and publish themes for your site.</p>
                    </div>
                    <button
                        onClick={handleCreateTheme}
                        className="theme-button theme-button-primary"
                    >
                        + Create Theme
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <ThemeTable
                        themes={themes}
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
