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

// Helper to convert HSL to HEX
function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper to convert HEX to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ============================================================
// Color Vision Deficiency (CVD) Simulation & Auto-Correction
// Based on Machado et al. (2009) transformation matrices for sRGB
// ============================================================

// CVD transformation matrices (Machado et al. 2009)
// Each matrix transforms [R, G, B] as a colorblind person would see it
const CVD_MATRICES: Record<string, number[][]> = {
    protanopia: [
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998],
    ],
    deuteranopia: [
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.011820, 0.042940, 0.968881],
    ],
    tritanopia: [
        [1.255528, -0.076749, -0.178779],
        [0.078212, 0.930766, -0.008979],
        [0.004733, 0.691367, 0.303900],
    ],
};

// Simulate a single hex color under a specific CVD type
function simulateCVD(hex: string, type: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const matrix = CVD_MATRICES[type];
    const sr = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
    const sg = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
    const sb = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    return `#${Math.round(clamp(sr) * 255).toString(16).padStart(2, '0')}${Math.round(clamp(sg) * 255).toString(16).padStart(2, '0')}${Math.round(clamp(sb) * 255).toString(16).padStart(2, '0')}`;
}

// Compute perceptual distance between two hex colors (Euclidean in RGB, 0-255 scale)
function colorDistance(a: string, b: string): number {
    const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

// Check if a palette is distinguishable under a given CVD type
// Returns true if all three pairs (p-s, p-a, s-a) have sufficient distance
function isCvdDistinguishable(
    primary: string,
    secondary: string,
    accent: string,
    type: string,
    minDistance = 40
): boolean {
    const sp = simulateCVD(primary, type);
    const ss = simulateCVD(secondary, type);
    const sa = simulateCVD(accent, type);

    return (
        colorDistance(sp, ss) >= minDistance &&
        colorDistance(sp, sa) >= minDistance &&
        colorDistance(ss, sa) >= minDistance
    );
}

// Check palette against all three CVD types
function isAccessiblePalette(
    primary: string,
    secondary: string,
    accent: string,
    minDistance = 40
): boolean {
    return (
        isCvdDistinguishable(primary, secondary, accent, 'protanopia', minDistance) &&
        isCvdDistinguishable(primary, secondary, accent, 'deuteranopia', minDistance) &&
        isCvdDistinguishable(primary, secondary, accent, 'tritanopia', minDistance)
    );
}

// Automatically adjust a palette to be CVD-safe
// Takes base hue, light/dark params, and incrementally nudges secondary/accent
// until all three colors are distinguishable under every CVD type
// Strategy: Keep secondary CLOSE to primary (analogous), only push apart if needed
function generateCvdSafePalette(
    baseH: number,
    baseS: number,
    lightParams: { pL: number; sL: number; aL: number },
    darkParams: { pL: number; sL: number; aL: number },
    minDistance = 40,
    maxIterations = 120
): {
    light: { primary: string; secondary: string; accent: string };
    dark: { primary: string; secondary: string; accent: string };
} {
    // Primary stays at base hue — it's the user's chosen color
    // Secondary starts close (+15°), accent further (-40°) for contrast
    // This creates an analogous palette where secondary is close to primary

    const getPalette = (hS: number, hA: number, pL: number, sL: number, aL: number) => ({
        primary: hslToHex(baseH, baseS, pL),
        secondary: hslToHex(hS, baseS, sL),
        accent: hslToHex(hA, baseS, aL),
    });

    let secOffset = 15; // secondary starts close to primary (+15°)
    let accOffset = -40; // accent is further away for contrast (-40°)

    let iter = 0;
    while (iter < maxIterations) {
        const light = getPalette(
            (baseH + secOffset + 360) % 360,
            (baseH + accOffset + 360) % 360,
            lightParams.pL, lightParams.sL, lightParams.aL
        );
        const dark = getPalette(
            (baseH + secOffset + 360) % 360,
            (baseH + accOffset + 360) % 360,
            darkParams.pL, darkParams.sL, darkParams.aL
        );

        const lightOK = isAccessiblePalette(light.primary, light.secondary, light.accent, minDistance);
        const darkOK = isAccessiblePalette(dark.primary, dark.secondary, dark.accent, minDistance);

        if (lightOK && darkOK) {
            return { light, dark };
        }

        // Incrementally push secondary and accent apart by ±5°
        // Secondary moves away from primary slowly, accent moves further
        secOffset += 5;
        accOffset -= 5;
        iter++;
    }

    // Fallback: return whatever we have after max iterations
    const light = getPalette(
        (baseH + secOffset + 360) % 360,
        (baseH + accOffset + 360) % 360,
        lightParams.pL, lightParams.sL, lightParams.aL
    );
    const dark = getPalette(
        (baseH + secOffset + 360) % 360,
        (baseH + accOffset + 360) % 360,
        darkParams.pL, darkParams.sL, darkParams.aL
    );
    return { light, dark };
}

// Helper to create a complete default theme config with all required fields
function createDefaultThemeConfig(
    defaultFontId: string,
    defaultFontName: string = 'Roboto',
    customColors?: {
        light: { primary: string; secondary: string; accent: string };
        dark: { primary: string; secondary: string; accent: string };
    }
): ThemeConfig {
    const defaultTypography: TypographyElement = {
        fontId: defaultFontId,
        fontName: defaultFontName,
        fontSize: '1.0',
        fontWeight: 400,
        color: '#1a1a2e',
        lineHeight: '1.6'
    };

    const lightPalette: ThemePalette = {
        colors: {
            primary: customColors?.light.primary || '#F83A3A',
            secondary: customColors?.light.secondary || '#FAA2B6',
            accent: customColors?.light.accent || '#D73359',
            background: '#FBFBFE',
            surface: '#EEEEF0',
            border: '#DDDDDD',
            decorator: '#FFFFFF',
            loader: { enabled: false, selectedTangram: 1 }
        },
        typography: {
            h1: { ...defaultTypography, fontSize: '2.492', fontWeight: 400, color: customColors?.light.primary || '#F83A3A' },
            h2: { ...defaultTypography, fontSize: '2.076', fontWeight: 400, color: customColors?.light.primary || '#F83A3A' },
            h3: { ...defaultTypography, fontSize: '1.73', fontWeight: 400, color: customColors?.light.accent || '#D73359' },
            h4: { ...defaultTypography, fontSize: '1.44', fontWeight: 400, color: '#1a1675' },
            h5: { ...defaultTypography, fontSize: '1.2', fontWeight: 400, color: '#1a1675' },
            h6: { ...defaultTypography, fontSize: '1.0', fontWeight: 400, color: '#1a1675' },
            title: { ...defaultTypography, fontSize: '1.5', fontWeight: 700, color: '#1a1675' },
            subtitle: { ...defaultTypography, fontSize: '1.0', fontWeight: 600, color: '#1a1675' },
            paragraph: { ...defaultTypography, fontSize: '1.0', fontWeight: 400, color: '#1a1a2e' },
            decorator: { ...defaultTypography, fontSize: '1.0', fontWeight: 500, color: '#ffffff' }
        }
    };

    const darkPalette: ThemePalette = {
        colors: {
            primary: customColors?.dark.primary || '#C50707',
            secondary: customColors?.dark.secondary || '#5C0519',
            accent: customColors?.dark.accent || '#CC284F',
            background: '#010104',
            surface: '#0e0e10',
            border: '#212121',
            decorator: '#FFFFFF',
            loader: { enabled: false, selectedTangram: 1 }
        },
        typography: {
            h1: { ...defaultTypography, fontSize: '2.492', fontWeight: 400, color: customColors?.dark.primary || '#C50707' },
            h2: { ...defaultTypography, fontSize: '2.076', fontWeight: 400, color: customColors?.dark.primary || '#C50707' },
            h3: { ...defaultTypography, fontSize: '1.73', fontWeight: 400, color: customColors?.dark.accent || '#CC284F' },
            h4: { ...defaultTypography, fontSize: '1.44', fontWeight: 400, color: '#e0e0e0' },
            h5: { ...defaultTypography, fontSize: '1.2', fontWeight: 400, color: '#e0e0e0' },
            h6: { ...defaultTypography, fontSize: '1.0', fontWeight: 400, color: '#e0e0e0' },
            title: { ...defaultTypography, fontSize: '1.5', fontWeight: 700, color: '#ffffff' },
            subtitle: { ...defaultTypography, fontSize: '1.0', fontWeight: 600, color: '#ffffff' },
            paragraph: { ...defaultTypography, fontSize: '1.0', fontWeight: 400, color: '#d1d1d1' },
            decorator: { ...defaultTypography, fontSize: '1.0', fontWeight: 500, color: '#ffffff' }
        }
    };

    return {
        light: lightPalette,
        dark: darkPalette,
        accessibility: JSON.parse(JSON.stringify(lightPalette))
    };
}

// Helper to convert ColorPalette + TypographyStyle to ThemePalette
// Preserves existing fontWeight, lineHeight, and fontId from the current palette
const toThemePalette = (
    colors: ColorPalette,
    styles: Record<string, TypographyStyle>,
    currentPalette: ThemePalette,
    loader: { enabled: boolean; selectedTangram: number }
): ThemePalette => ({
    colors: {
        ...colors,
        loader
    },
    typography: {
        h1: {
            fontId: styles.h1.fontId || currentPalette.typography.h1?.fontId || '',
            fontName: styles.h1.fontFamily,
            fontSize: String(styles.h1.size),
            fontWeight: styles.h1.fontWeight ?? currentPalette.typography.h1?.fontWeight ?? 400,
            lineHeight: styles.h1.lineHeight ?? currentPalette.typography.h1?.lineHeight,
            color: styles.h1.color
        },
        h2: {
            fontId: styles.h2.fontId || currentPalette.typography.h2?.fontId || '',
            fontName: styles.h2.fontFamily,
            fontSize: String(styles.h2.size),
            fontWeight: styles.h2.fontWeight ?? currentPalette.typography.h2?.fontWeight ?? 400,
            lineHeight: styles.h2.lineHeight ?? currentPalette.typography.h2?.lineHeight,
            color: styles.h2.color
        },
        h3: {
            fontId: styles.h3.fontId || currentPalette.typography.h3?.fontId || '',
            fontName: styles.h3.fontFamily,
            fontSize: String(styles.h3.size),
            fontWeight: styles.h3.fontWeight ?? currentPalette.typography.h3?.fontWeight ?? 400,
            lineHeight: styles.h3.lineHeight ?? currentPalette.typography.h3?.lineHeight,
            color: styles.h3.color
        },
        h4: {
            fontId: styles.h4.fontId || currentPalette.typography.h4?.fontId || '',
            fontName: styles.h4.fontFamily,
            fontSize: String(styles.h4.size),
            fontWeight: styles.h4.fontWeight ?? currentPalette.typography.h4?.fontWeight ?? 400,
            lineHeight: styles.h4.lineHeight ?? currentPalette.typography.h4?.lineHeight,
            color: styles.h4.color
        },
        h5: {
            fontId: styles.h5.fontId || currentPalette.typography.h5?.fontId || '',
            fontName: styles.h5.fontFamily,
            fontSize: String(styles.h5.size),
            fontWeight: styles.h5.fontWeight ?? currentPalette.typography.h5?.fontWeight ?? 400,
            lineHeight: styles.h5.lineHeight ?? currentPalette.typography.h5?.lineHeight,
            color: styles.h5.color
        },
        h6: {
            fontId: styles.h6.fontId || currentPalette.typography.h6?.fontId || '',
            fontName: styles.h6.fontFamily,
            fontSize: String(styles.h6.size),
            fontWeight: styles.h6.fontWeight ?? currentPalette.typography.h6?.fontWeight ?? 400,
            lineHeight: styles.h6.lineHeight ?? currentPalette.typography.h6?.lineHeight,
            color: styles.h6.color
        },
        title: {
            fontId: styles.h1.fontId || currentPalette.typography.title?.fontId || '',
            fontName: styles.h1.fontFamily,
            fontSize: String(styles.h1.size),
            fontWeight: styles.h1.fontWeight ?? currentPalette.typography.title?.fontWeight ?? 700,
            lineHeight: styles.h1.lineHeight ?? currentPalette.typography.title?.lineHeight,
            color: styles.h1.color
        },
        subtitle: {
            fontId: styles.h2.fontId || currentPalette.typography.subtitle?.fontId || '',
            fontName: styles.h2.fontFamily,
            fontSize: String(styles.h2.size),
            fontWeight: styles.h2.fontWeight ?? currentPalette.typography.subtitle?.fontWeight ?? 600,
            lineHeight: styles.h2.lineHeight ?? currentPalette.typography.subtitle?.lineHeight,
            color: styles.h2.color
        },
        paragraph: {
            fontId: styles.p.fontId || currentPalette.typography.paragraph?.fontId || '',
            fontName: styles.p.fontFamily,
            fontSize: String(styles.p.size),
            fontWeight: styles.p.fontWeight ?? currentPalette.typography.paragraph?.fontWeight ?? 400,
            lineHeight: styles.p.lineHeight ?? currentPalette.typography.paragraph?.lineHeight,
            color: styles.p.color
        },
        decorator: {
            fontId: styles.p.fontId || currentPalette.typography.decorator?.fontId || '',
            fontName: styles.p.fontFamily,
            fontSize: String(styles.p.size),
            fontWeight: styles.p.fontWeight ?? currentPalette.typography.decorator?.fontWeight ?? 500,
            lineHeight: styles.p.lineHeight ?? currentPalette.typography.decorator?.lineHeight,
            color: colors.decorator ?? currentPalette.typography.decorator?.color ?? '#ffffff'
        },
    }
});

export const UnifiedThemeConfig: React.FC = () => {
    // Helper for generating CVD-safe analogous colors from an optional base color
    const generateAnalogousColors = (baseColor: string) => {
        let h: number, s: number;
        if (baseColor && /^#[0-9A-Fa-f]{6}$/.test(baseColor)) {
            const hsl = hexToHsl(baseColor);
            h = hsl.h;
            s = Math.max(hsl.s, 75);
        } else {
            h = Math.floor(Math.random() * 360);
            s = 75 + Math.floor(Math.random() * 15);
        }

        // Use the CVD-safe palette generator which incrementally
        // pushes secondary/accent hues until all 3 colors are
        // distinguishable under protanopia, deuteranopia & tritanopia
        return generateCvdSafePalette(
            h,
            s,
            { pL: 60, sL: 80, aL: 50 },  // light mode lightness
            { pL: 40, sL: 20, aL: 45 },  // dark mode lightness
            40,    // minimum RGB distance under CVD simulation
            120    // max iterations (±5° per step)
        );
    };

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

    const handleCreateRandomTheme = async (baseColor: string) => {
        const dualModeColors = generateAnalogousColors(baseColor);
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const name = `Random ${date} ${time}`;
        const description = 'Quickly generated theme with analogous colors for light and dark modes.';

        try {
            const newThemeData: Partial<Theme> = {
                name,
                description,
                type: 'custom' as const,
                config: createDefaultThemeConfig(
                    defaultFontId,
                    fonts.find(f => f.id === defaultFontId)?.name || 'Roboto',
                    dualModeColors
                ),
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
                message: `Random theme "${name}" created!`
            });
        } catch (error: any) {
            console.error('Failed to create random theme:', error);
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || 'Failed to create random theme.'
            });
        }
    };

    const handleShowCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    /**
     * Generate a unique name for duplicated theme.
     * Handles "Copy" suffix intelligently to avoid "Copy Copy Copy..." issue.
     * Examples:
     * - "Theme" -> "Theme Copy"
     * - "Theme Copy" -> "Theme Copy 2"
     * - "Theme Copy 2" -> "Theme Copy 3"
     */
    const generateDuplicateName = (baseName: string): string => {
        // Check if name already ends with "Copy" or "Copy N"
        const copyMatch = baseName.match(/^(.*) Copy(?: (\d+))?$/);

        let originalName: string;
        let copyNumber: number;

        if (copyMatch) {
            // Name already has "Copy" suffix
            originalName = copyMatch[1] || baseName;
            copyNumber = copyMatch[2] ? parseInt(copyMatch[2], 10) + 1 : 2;
        } else {
            // First copy
            originalName = baseName;
            copyNumber = 1;
        }

        // Generate candidate name
        const candidateName = copyNumber === 1
            ? `${originalName} Copy`
            : `${originalName} Copy ${copyNumber}`;

        // Check if this name already exists and increment if needed
        const existingNames = new Set(themes.map(t => t.name.toLowerCase()));
        let finalName = candidateName;
        let counter = copyNumber;

        while (existingNames.has(finalName.toLowerCase())) {
            counter++;
            finalName = counter === 1
                ? `${originalName} Copy`
                : `${originalName} Copy ${counter}`;
        }

        return finalName;
    };

    const handleDuplicateTheme = (themeId: string) => {
        const sourceTheme = themes.find(t => t.id === themeId);
        if (!sourceTheme) return;

        // Generate unique name automatically
        const duplicateName = generateDuplicateName(sourceTheme.name);

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
            inputValue: duplicateName,
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

    const handleSaveTheme = async (
        buffers: Record<string, { colors: ColorPalette; styles: Record<string, TypographyStyle>; loader: { enabled: boolean; selectedTangram: number } }>,
        _activeMode: string
    ) => {
        if (!activeTheme) return;

        // Build the full config with ALL three modes from the editor buffers
        const modes = ['light', 'dark', 'accessibility'] as const;
        const newConfig: ThemeConfig = { 
            ...activeTheme.config
        };

        for (const mode of modes) {
            const buf = buffers[mode];
            if (buf) {
                newConfig[mode] = toThemePalette(buf.colors, buf.styles, activeTheme.config[mode], buf.loader);
            }
        }

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

        // Cannot delete active theme - must deactivate first
        // This applies to ALL themes including default - there must always be at least one active theme
        if (theme.isActive) {
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: `Cannot delete "${theme.name}" because it is currently active. Please activate a different theme first, then try deleting this one.`
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

    const deleteThemeAction = async (themeId: string, themeName: string) => {
        try {
            await deleteTheme(themeId);
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
        } catch (error: any) {
            console.error('Failed to delete theme:', error);
            // Show error from backend (e.g., theme in use by users)
            setMessageModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.detail || `Failed to delete theme "${themeName}". Please check if it's being used.`
            });
        }
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
                    <span className="text-[var(--text-paragraph)] mt-2 block">
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
                            <h1 className="text-h1 font-bold mb-1">Theme Management</h1>
                            <p className="text-paragraph">Create, edit, and publish themes for your site.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search Input */}
                            <div className="relative">
                                <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                                    <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                                    <input
                                        type="text"
                                        placeholder="Search themes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-paragraph placeholder:opacity-60 focus:outline-none"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-2 hover:bg-[var(--palette-border)] transition-colors"
                                        >
                                            <span className="text-paragraph opacity-60">×</span>
                                        </button>
                                    )}
                                </div>
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
                    onRandomSubmit={handleCreateRandomTheme}
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
