import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Theme, ThemeConfig, ThemePalette, TypographyElement, Font } from '../../data/theme.types';
import type { ColorPalette, TypographyStyle } from './types';
import { ThemeTable } from './ThemeTable';
import { ThemeEditor } from './ThemeEditor';
import { ThemePreview } from './ThemePreview';
import { CreateThemeModal } from './CreateThemeModal';
import { MessageModal } from './MessageModal';
import { ConfirmModal } from './ConfirmModal';

// Helper to create a complete default theme config with all required fields
function createDefaultThemeConfig(defaultFontId: string, defaultFontName: string = 'Roboto'): ThemeConfig {
    const defaultTypography: TypographyElement = {
        fontId: defaultFontId,
        fontName: defaultFontName,
        fontSize: '1.0',
        fontWeight: 400,
        color: '#1a1a2e',
        lineHeight: '1.6'
    };

    const defaultPalette: ThemePalette = {
        colors: {
            primary: '#2f27ce',
            secondary: '#dedcff',
            accent: '#433bff',
            background: '#fbfbfe',
            surface: '#eeeef0',
            border: '#dddddd',
            decorator: '#ffffff'
        },
        typography: {
            h1: { ...defaultTypography, fontSize: '2.5', fontWeight: 400, color: '#2f27ce' },
            h2: { ...defaultTypography, fontSize: '2.0', fontWeight: 400, color: '#2f27ce' },
            h3: { ...defaultTypography, fontSize: '1.75', fontWeight: 400, color: '#433bff' },
            h4: { ...defaultTypography, fontSize: '1.5', fontWeight: 400, color: '#1a1675' },
            h5: { ...defaultTypography, fontSize: '1.25', fontWeight: 400, color: '#1a1675' },
            h6: { ...defaultTypography, fontSize: '1.0', fontWeight: 400, color: '#1a1675' },
            title: { ...defaultTypography, fontSize: '1.5', fontWeight: 700, color: '#1a1675' },
            subtitle: { ...defaultTypography, fontSize: '1.25', fontWeight: 600, color: '#1a1675' },
            paragraph: { ...defaultTypography, fontSize: '1.0', fontWeight: 400, color: '#1a1a2e' },
            decorator: { ...defaultTypography, fontSize: '1.0', fontWeight: 500, color: '#ffffff' }
        }
    };

    return {
        light: JSON.parse(JSON.stringify(defaultPalette)),
        dark: JSON.parse(JSON.stringify(defaultPalette)),
        accessibility: JSON.parse(JSON.stringify(defaultPalette))
    };
}

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
            fontId: currentPalette.typography.h1?.fontId || styles.h1.fontId || '',
            fontName: styles.h1.fontFamily,
            fontSize: String(styles.h1.size),
            fontWeight: styles.h1.fontWeight ?? currentPalette.typography.h1?.fontWeight ?? 400,
            lineHeight: styles.h1.lineHeight ?? currentPalette.typography.h1?.lineHeight,
            color: styles.h1.color
        },
        h2: {
            fontId: currentPalette.typography.h2?.fontId || styles.h2.fontId || '',
            fontName: styles.h2.fontFamily,
            fontSize: String(styles.h2.size),
            fontWeight: styles.h2.fontWeight ?? currentPalette.typography.h2?.fontWeight ?? 400,
            lineHeight: styles.h2.lineHeight ?? currentPalette.typography.h2?.lineHeight,
            color: styles.h2.color
        },
        h3: {
            fontId: currentPalette.typography.h3?.fontId || styles.h3.fontId || '',
            fontName: styles.h3.fontFamily,
            fontSize: String(styles.h3.size),
            fontWeight: styles.h3.fontWeight ?? currentPalette.typography.h3?.fontWeight ?? 400,
            lineHeight: styles.h3.lineHeight ?? currentPalette.typography.h3?.lineHeight,
            color: styles.h3.color
        },
        h4: {
            fontId: currentPalette.typography.h4?.fontId || styles.h4.fontId || '',
            fontName: styles.h4.fontFamily,
            fontSize: String(styles.h4.size),
            fontWeight: styles.h4.fontWeight ?? currentPalette.typography.h4?.fontWeight ?? 400,
            lineHeight: styles.h4.lineHeight ?? currentPalette.typography.h4?.lineHeight,
            color: styles.h4.color
        },
        h5: {
            fontId: currentPalette.typography.h5?.fontId || styles.h5.fontId || '',
            fontName: styles.h5.fontFamily,
            fontSize: String(styles.h5.size),
            fontWeight: styles.h5.fontWeight ?? currentPalette.typography.h5?.fontWeight ?? 400,
            lineHeight: styles.h5.lineHeight ?? currentPalette.typography.h5?.lineHeight,
            color: styles.h5.color
        },
        h6: {
            fontId: currentPalette.typography.h6?.fontId || styles.h6.fontId || '',
            fontName: styles.h6.fontFamily,
            fontSize: String(styles.h6.size),
            fontWeight: styles.h6.fontWeight ?? currentPalette.typography.h6?.fontWeight ?? 400,
            lineHeight: styles.h6.lineHeight ?? currentPalette.typography.h6?.lineHeight,
            color: styles.h6.color
        },
        title: {
            fontId: currentPalette.typography.title?.fontId || styles.h1.fontId || '',
            fontName: styles.h1.fontFamily,
            fontSize: String(styles.h1.size),
            fontWeight: styles.h1.fontWeight ?? currentPalette.typography.title?.fontWeight ?? 700,
            lineHeight: styles.h1.lineHeight ?? currentPalette.typography.title?.lineHeight,
            color: styles.h1.color
        },
        subtitle: {
            fontId: currentPalette.typography.subtitle?.fontId || styles.h2.fontId || '',
            fontName: styles.h2.fontFamily,
            fontSize: String(styles.h2.size),
            fontWeight: styles.h2.fontWeight ?? currentPalette.typography.subtitle?.fontWeight ?? 600,
            lineHeight: styles.h2.lineHeight ?? currentPalette.typography.subtitle?.lineHeight,
            color: styles.h2.color
        },
        paragraph: {
            fontId: currentPalette.typography.paragraph?.fontId || styles.p.fontId || '',
            fontName: styles.p.fontFamily,
            fontSize: String(styles.p.size),
            fontWeight: styles.p.fontWeight ?? currentPalette.typography.paragraph?.fontWeight ?? 400,
            lineHeight: styles.p.lineHeight ?? currentPalette.typography.paragraph?.lineHeight,
            color: styles.p.color
        },
        decorator: {
            fontId: currentPalette.typography.decorator?.fontId || styles.p.fontId || '',
            fontName: styles.p.fontFamily,
            fontSize: String(styles.p.size),
            fontWeight: styles.p.fontWeight ?? currentPalette.typography.decorator?.fontWeight ?? 500,
            lineHeight: styles.p.lineHeight ?? currentPalette.typography.decorator?.lineHeight,
            color: colors.decorator ?? currentPalette.typography.decorator?.color ?? '#ffffff'
        },
    }
});

export const UnifiedThemeConfig: React.FC = () => {
    const { fetchAllThemes, activateTheme, createTheme, updateTheme, deleteTheme, fetchFonts } = useTheme();

    // View mode: 'list' | 'edit' | 'preview'
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list');

    // Theme management state
    const [themes, setThemes] = useState<Theme[]>([]);
    const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<'light' | 'dark' | 'accessibility'>('light');

    // Font state
    const [fonts, setFonts] = useState<Font[]>([]);
    const [defaultFontId, setDefaultFontId] = useState<string>('');

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [messageModal, setMessageModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        message: string;
    }>({ isOpen: false, type: 'success', message: '' });

    // Confirm modal state (for delete, duplicate, publish)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'danger' | 'primary' | 'success';
        title: string;
        message: string | React.ReactNode;
        confirmText: string;
        action: ((value?: string) => void) | null;
        showInput: boolean;
        inputValue: string;
        inputPlaceholder: string;
    }>({
        isOpen: false,
        type: 'primary',
        title: '',
        message: '',
        confirmText: 'Confirm',
        action: null,
        showInput: false,
        inputValue: '',
        inputPlaceholder: '',
    });

    // DataTables state
    const [currentPage, setCurrentPage] = useState(0);
    const [sortColumn, setSortColumn] = useState<'name' | 'isActive' | 'isDefault'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const rowsPerPage = 10;

    // Filter themes based on search query
    const filteredThemes = themes.filter(theme =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Load themes and fonts from API
    useEffect(() => {
        const loadData = async () => {
            const [loadedThemes, loadedFonts] = await Promise.all([
                fetchAllThemes(),
                fetchFonts()
            ]);
            setThemes(loadedThemes);
            setFonts(loadedFonts);

            // Find active theme
            const active = loadedThemes.find(t => t.isActive);
            if (active) {
                setActiveThemeId(active.id);
            } else if (loadedThemes.length > 0) {
                setActiveThemeId(loadedThemes[0].id);
            }

            // Find default font (Roboto or first available)
            const robotoFont = loadedFonts.find(f => f.name === 'Roboto');
            const firstFont = robotoFont || loadedFonts[0];
            if (firstFont) {
                setDefaultFontId(firstFont.id);
            }
        };

        loadData();
    }, [fetchAllThemes, fetchFonts]);

    // Get active theme object
    const activeTheme = themes.find(t => t.id === activeThemeId) || null;

    // Theme CRUD operations
    const handleCreateTheme = async (name: string, description: string) => {
        try {
            // Create a new theme with a complete default config using the default font
            const newThemeData: Partial<Theme> = {
                name,
                description,
                type: 'custom' as const,
                config: createDefaultThemeConfig(defaultFontId, fonts.find(f => f.id === defaultFontId)?.name || 'Roboto'),
                isActive: false,
                isDefault: false,
            };

            const created = await createTheme(newThemeData);
            setThemes(prev => [...prev, created]);
            setActiveThemeId(created.id);
            setViewMode('edit');
            setIsCreateModalOpen(false);
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: `Theme "${name}" created successfully!`
            });
        } catch (error: any) {
            console.error('Failed to create theme:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to create theme. Please check the backend logs.'
            });
        }
    };

    const handleShowCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleDuplicateTheme = (themeId: string) => {
        const sourceTheme = themes.find(t => t.id === themeId);
        if (!sourceTheme) return;

        setConfirmModal({
            isOpen: true,
            type: 'primary',
            title: 'Duplicate Theme',
            message: 'Enter a name for the duplicated theme:',
            confirmText: 'Duplicate',
            action: (newName?: string) => {
                duplicateThemeAction(sourceTheme, newName);
            },
            showInput: true,
            inputValue: `${sourceTheme.name} Copy`,
            inputPlaceholder: 'Theme name',
        });
    };

    const duplicateThemeAction = async (sourceTheme: Theme, newName: string | undefined) => {
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
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: `Theme "${newName}" duplicated successfully!`
            });
        } catch (error: any) {
            console.error('Failed to duplicate theme:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to duplicate theme.'
            });
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
            // Refresh fonts to update usage counts
            await fetchFonts();
            setMessageModal({
                isOpen: true,
                type: 'success',
                message: `Theme "${activeTheme.name}" saved successfully!`
            });
        } catch (error: any) {
            console.error('Failed to save theme:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to save theme.'
            });
        }
    };

    const handleDeleteTheme = (themeId: string) => {
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        if (theme.isDefault) {
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: `Cannot delete "${theme.name}" because it is the default theme.`
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Delete Theme',
            message: (
                <>
                    Are you sure you want to delete <strong>"{theme.name}"</strong>?
                    <br />
                    <span className="text-red-600 dark:text-red-400 mt-2 block">
                        This action cannot be undone.
                    </span>
                </>
            ),
            confirmText: 'Delete',
            action: () => {
                deleteThemeAction(themeId, theme.name);
            },
            showInput: false,
            inputValue: '',
            inputPlaceholder: '',
        });
    };

    const deleteThemeAction = (themeId: string, themeName: string) => {
        deleteTheme(themeId);
        setThemes(prev => prev.filter(t => t.id !== themeId));
        if (activeThemeId === themeId) {
            setActiveThemeId(null);
        }
        setViewMode('list');
        setMessageModal({
            isOpen: true,
            type: 'success',
            message: `Theme "${themeName}" deleted successfully!`
        });
    };

    const handlePublishTheme = () => {
        if (!activeTheme) return;

        setConfirmModal({
            isOpen: true,
            type: 'success',
            title: 'Activate Theme',
            message: (
                <>
                    Activate <strong>"{activeTheme.name}"</strong> as the active theme?
                    <br />
                    <span className="text-[var(--text-p-color)] mt-2 block">
                        This will make it the active theme for all users.
                    </span>
                </>
            ),
            confirmText: 'Activate',
            action: () => {
                publishThemeAction();
            },
            showInput: false,
            inputValue: '',
            inputPlaceholder: '',
        });
    };

    const publishThemeAction = () => {
        if (!activeTheme) return;
        activateTheme(activeTheme.id);
        setThemes(prev => prev.map(t => ({
            ...t,
            isActive: t.id === activeTheme.id
        })));
        setMessageModal({
            isOpen: true,
            type: 'success',
            message: `Theme "${activeTheme.name}" has been activated!`
        });
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
            <>
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b palette-border flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-h1-size font-bold mb-1">Theme Management</h1>
                            <p className="text-p-font text-p-size text-p-color">Create, edit, and publish themes for your site.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-p-color" />
                                <input
                                    type="text"
                                    placeholder="Search themes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color placeholder-[var(--palette-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleShowCreateModal}
                                className="theme-button theme-button-primary"
                            >
                                + Create Theme
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <ThemeTable
                            themes={filteredThemes}
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

                {/* Modals */}
                <CreateThemeModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={handleCreateTheme}
                />
                <MessageModal
                    isOpen={messageModal.isOpen}
                    onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                    type={messageModal.type}
                    message={messageModal.message}
                />
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={() => {
                        if (confirmModal.action) {
                            confirmModal.action(confirmModal.showInput ? confirmModal.inputValue : undefined);
                        }
                    }}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    type={confirmModal.type}
                    showInput={confirmModal.showInput}
                    inputValue={confirmModal.inputValue}
                    onInputChange={(value) => setConfirmModal({ ...confirmModal, inputValue: value })}
                    inputPlaceholder={confirmModal.inputPlaceholder}
                />
            </>
        );
    }

    if (viewMode === 'preview' && activeTheme) {
        return (
            <>
                <ThemePreview
                    theme={activeTheme}
                    onEdit={(mode) => {
                        setActiveMode(mode);
                        setViewMode('edit');
                    }}
                    onClose={() => {
                        setViewMode('list');
                        setActiveThemeId(null);
                    }}
                    onPublish={handlePublishTheme}
                />
                <MessageModal
                    isOpen={messageModal.isOpen}
                    onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                    type={messageModal.type}
                    message={messageModal.message}
                />
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={() => {
                        if (confirmModal.action) {
                            confirmModal.action(confirmModal.showInput ? confirmModal.inputValue : undefined);
                        }
                    }}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    type={confirmModal.type}
                    showInput={confirmModal.showInput}
                    inputValue={confirmModal.inputValue}
                    onInputChange={(value) => setConfirmModal({ ...confirmModal, inputValue: value })}
                    inputPlaceholder={confirmModal.inputPlaceholder}
                />
            </>
        );
    }

    if (viewMode === 'edit' && activeTheme) {
        return (
            <>
                <ThemeEditor
                    theme={activeTheme}
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                    onSave={handleSaveTheme}
                    onPublish={handlePublishTheme}
                    onPreview={() => setViewMode('preview')}
                    onBack={() => {
                        setViewMode('list');
                        setActiveThemeId(null);
                    }}
                />
                <MessageModal
                    isOpen={messageModal.isOpen}
                    onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                    type={messageModal.type}
                    message={messageModal.message}
                />
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={() => {
                        if (confirmModal.action) {
                            confirmModal.action(confirmModal.showInput ? confirmModal.inputValue : undefined);
                        }
                    }}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    type={confirmModal.type}
                    showInput={confirmModal.showInput}
                    inputValue={confirmModal.inputValue}
                    onInputChange={(value) => setConfirmModal({ ...confirmModal, inputValue: value })}
                    inputPlaceholder={confirmModal.inputPlaceholder}
                />
            </>
        );
    }

    return null;
};
