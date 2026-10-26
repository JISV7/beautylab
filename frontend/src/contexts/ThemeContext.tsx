import React, { createContext, useContext, useEffect, useCallback, useReducer } from 'react';
import axios from 'axios';
import type { Theme, ThemePalette, Font } from '../data/theme.types';
import { DEFAULT_THEME } from '../data/defaultTheme';

const API_URL = 'http://localhost:8000';

// Helper functions for theme caching
const getCachedTheme = (): Theme | null => {
    try {
        const cached = localStorage.getItem('cachedActiveTheme');
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

const getCachedMode = (): 'light' | 'dark' | 'accessibility' => {
    try {
        const cached = localStorage.getItem('paletteMode');
        if (cached === 'light' || cached === 'dark' || cached === 'accessibility') {
            return cached;
        }
    } catch {
        // Ignore
    }
    return 'light';
};

const cacheTheme = (theme: Theme) => {
    try {
        localStorage.setItem('cachedActiveTheme', JSON.stringify(theme));
    } catch {
        // Ignore localStorage errors
    }
};

// Get cached theme and mode for initial state
const cachedTheme = getCachedTheme();
const cachedMode = getCachedMode();

// Theme state for useReducer
interface ThemeState {
    activeTheme: Theme | null;
    currentPalette: ThemePalette | null;
    currentMode: 'light' | 'dark' | 'accessibility';
    availableThemes: Theme[];
    isLoading: boolean;
    error: string | null;
}

// Action types
type ThemeAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_ACTIVE_THEME'; payload: Theme }
    | { type: 'SET_AVAILABLE_THEMES'; payload: Theme[] }
    | { type: 'SET_PALETTE_MODE'; payload: 'light' | 'dark' | 'accessibility' }
    | { type: 'UPDATE_THEME'; payload: Theme }
    | { type: 'REMOVE_THEME'; payload: string }
    | { type: 'INITIALIZE'; payload: { theme: Theme; mode: 'light' | 'dark' | 'accessibility' } };

// Initial state
const initialState: ThemeState = {
    activeTheme: cachedTheme || DEFAULT_THEME,
    currentPalette: (cachedTheme || DEFAULT_THEME).config[cachedMode] || (cachedTheme || DEFAULT_THEME).config.light,
    currentMode: cachedMode,
    availableThemes: [cachedTheme || DEFAULT_THEME],
    isLoading: false,
    error: null,
};

// Reducer function
function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_ACTIVE_THEME':
            return {
                ...state,
                activeTheme: action.payload,
                currentPalette: action.payload.config[state.currentMode],
            };
        case 'SET_AVAILABLE_THEMES':
            return { ...state, availableThemes: action.payload };
        case 'SET_PALETTE_MODE': {
            const mode = action.payload;
            const palette = state.activeTheme?.config[mode] || null;
            return {
                ...state,
                currentMode: mode,
                currentPalette: palette,
            };
        }
        case 'UPDATE_THEME': {
            const updated = action.payload;
            const isCurrentTheme = state.activeTheme?.id === updated.id;
            return {
                ...state,
                activeTheme: isCurrentTheme ? updated : state.activeTheme,
                currentPalette: isCurrentTheme ? updated.config[state.currentMode] : state.currentPalette,
                availableThemes: state.availableThemes.map(t => t.id === updated.id ? updated : t),
            };
        }
        case 'REMOVE_THEME':
            return {
                ...state,
                availableThemes: state.availableThemes.filter(t => t.id !== action.payload),
            };
        case 'INITIALIZE': {
            const { theme, mode } = action.payload;
            return {
                ...state,
                activeTheme: theme,
                currentPalette: theme.config[mode],
                currentMode: mode,
                availableThemes: [theme],
            };
        }
        default:
            return state;
    }
}

interface ThemeContextType {
    activeTheme: Theme | null;
    currentPalette: ThemePalette | null;
    currentMode: 'light' | 'dark' | 'accessibility';
    availableThemes: Theme[];
    loadActiveTheme: () => Promise<void>;
    setPaletteMode: (mode: 'light' | 'dark' | 'accessibility') => void;
    detectSystemPreference: () => void;
    createTheme: (themeData: Partial<Theme>) => Promise<Theme>;
    updateTheme: (themeId: string, themeData: Partial<Theme>) => Promise<Theme>;
    deleteTheme: (themeId: string) => Promise<void>;
    activateTheme: (themeId: string) => Promise<Theme>;
    fetchAllThemes: () => Promise<Theme[]>;
    fetchFonts: () => Promise<Font[]>;
    uploadFont: (file: File) => Promise<Font>;
    deleteFont: (fontId: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

// Axios instance with auth
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors - logout and redirect to home
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.setItem('currentPage', 'home');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// ---------------------------------------------------------------------------
// Color helpers used to derive accessible semantic tokens from the active theme
// ---------------------------------------------------------------------------

type Rgb = { r: number; g: number; b: number };

const WHITE = '#FFFFFF';
const INK = '#071A2E';

const parseHexColor = (value: string | undefined): Rgb | null => {
    if (!value) return null;
    const raw = value.trim().replace('#', '');
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
    const expanded = raw.length === 3
        ? raw.split('').map((char) => char + char).join('')
        : raw;
    return {
        r: parseInt(expanded.slice(0, 2), 16),
        g: parseInt(expanded.slice(2, 4), 16),
        b: parseInt(expanded.slice(4, 6), 16),
    };
};

const toHex = ({ r, g, b }: Rgb): string =>
    `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const relativeLuminance = (color: Rgb): number => {
    const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
};

const contrastRatio = (foreground: string, background: string): number => {
    const fg = parseHexColor(foreground);
    const bg = parseHexColor(background);
    if (!fg || !bg) return 0;
    const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
    const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
    return (lighter + 0.05) / (darker + 0.05);
};

const mixColors = (foreground: string, background: string, amount: number): string => {
    const fg = parseHexColor(foreground);
    const bg = parseHexColor(background);
    if (!fg || !bg) return foreground;
    return toHex({
        r: fg.r + (bg.r - fg.r) * amount,
        g: fg.g + (bg.g - fg.g) * amount,
        b: fg.b + (bg.b - fg.b) * amount,
    });
};

const pickReadableText = (background: string): string => {
    const whiteContrast = contrastRatio(WHITE, background);
    const inkContrast = contrastRatio(INK, background);
    return whiteContrast >= inkContrast ? WHITE : INK;
};

const ensureContrast = (candidate: string, backgrounds: string[], minimum = 4.5): string => {
    if (backgrounds.every((background) => contrastRatio(candidate, background) >= minimum)) {
        return candidate;
    }
    return pickReadableText(backgrounds[0]);
};

const deriveLinkColor = (palette: ThemePalette, mode: string): string => {
    const backgrounds = [palette.colors.background, palette.colors.surface];
    const candidates = [
        palette.colors.primary,
        palette.colors.secondary,
        palette.colors.accent,
        mode === 'dark' ? '#BAE6FD' : '#0D2B4D',
        mode === 'dark' ? '#E2E8F0' : '#1E293B',
    ].filter(Boolean);

    let best = candidates[0];
    let bestScore = 0;
    for (const candidate of candidates) {
        const score = Math.min(
            ...backgrounds.map((background) => contrastRatio(candidate, background))
        );
        if (score > bestScore) {
            best = candidate;
            bestScore = score;
        }
    }

    return bestScore >= 4.5 ? best : pickReadableText(backgrounds[0]);
};

const deriveMutedColor = (palette: ThemePalette): string => {
    const backgrounds = [palette.colors.background, palette.colors.surface];
    const paragraph = palette.typography.paragraph.color;

    if (backgrounds.every((background) => contrastRatio(paragraph, background) >= 4.5)) {
        let candidate = paragraph;
        for (let amount = 0.1; amount <= 0.55; amount += 0.05) {
            const mixed = mixColors(paragraph, palette.colors.background, amount);
            if (backgrounds.every((background) => contrastRatio(mixed, background) >= 4.5)) {
                candidate = mixed;
            } else {
                break;
            }
        }
        return candidate;
    }

    return pickReadableText(backgrounds[0]);
};

const deriveStatusColors = (palette: ThemePalette, mode: string) => {
    const backgrounds = [palette.colors.background, palette.colors.surface];
    const sets: Record<string, { success: string; warning: string; danger: string; info: string }> = {
        light: {
            success: '#166534',
            warning: '#92400E',
            danger: '#B91C1C',
            info: '#1D4ED8',
        },
        dark: {
            success: '#86EFAC',
            warning: '#FCD34D',
            danger: '#FCA5A5',
            info: '#93C5FD',
        },
        accessibility: {
            success: '#14532D',
            warning: '#78350F',
            danger: '#991B1B',
            info: '#1E3A8A',
        },
    };
    const set = sets[mode] || sets.light;

    return {
        success: ensureContrast(set.success, backgrounds),
        warning: ensureContrast(set.warning, backgrounds),
        danger: ensureContrast(set.danger, backgrounds),
        info: ensureContrast(set.info, backgrounds),
    };
};

// Apply CSS variables from palette
const applyPalette = (palette: ThemePalette, mode: string): void => {
    const root = document.documentElement;

    root.style.setProperty('--palette-primary', palette.colors.primary);
    root.style.setProperty('--palette-secondary', palette.colors.secondary);
    root.style.setProperty('--palette-accent', palette.colors.accent);
    root.style.setProperty('--palette-background', palette.colors.background);
    root.style.setProperty('--palette-surface', palette.colors.surface);
    root.style.setProperty('--palette-border', palette.colors.border);

    // Semantic tokens guarantee readable text no matter which palette is active.
    const linkColor = deriveLinkColor(palette, mode);
    const mutedColor = deriveMutedColor(palette);
    const status = deriveStatusColors(palette, mode);

    root.style.setProperty('--on-primary', pickReadableText(palette.colors.primary));
    root.style.setProperty('--on-secondary', pickReadableText(palette.colors.secondary));
    root.style.setProperty('--on-accent', pickReadableText(palette.colors.accent));
    root.style.setProperty('--link-color', linkColor);
    root.style.setProperty('--text-muted-color', mutedColor);
    root.style.setProperty('--status-success', status.success);
    root.style.setProperty('--status-warning', status.warning);
    root.style.setProperty('--status-danger', status.danger);
    root.style.setProperty('--status-info', status.info);
    root.style.setProperty('--focus-ring-color', linkColor);

    const typography = palette.typography;

    root.style.setProperty('--text-h1-font', typography.h1.fontName || 'system-ui');
    root.style.setProperty('--text-h1-size', `${typography.h1.fontSize}rem`);
    root.style.setProperty('--text-h1-color', typography.h1.color);
    root.style.setProperty('--text-h1-weight', String(typography.h1.fontWeight));
    root.style.setProperty('--text-h1-line-height', typography.h1.lineHeight || '1.2');

    root.style.setProperty('--text-h2-font', typography.h2.fontName || 'system-ui');
    root.style.setProperty('--text-h2-size', `${typography.h2.fontSize}rem`);
    root.style.setProperty('--text-h2-color', typography.h2.color);
    root.style.setProperty('--text-h2-weight', String(typography.h2.fontWeight));
    root.style.setProperty('--text-h2-line-height', typography.h2.lineHeight || '1.2');

    root.style.setProperty('--text-h3-font', typography.h3.fontName || 'system-ui');
    root.style.setProperty('--text-h3-size', `${typography.h3.fontSize}rem`);
    root.style.setProperty('--text-h3-color', typography.h3.color);
    root.style.setProperty('--text-h3-weight', String(typography.h3.fontWeight));
    root.style.setProperty('--text-h3-line-height', typography.h3.lineHeight || '1.3');

    root.style.setProperty('--text-h4-font', typography.h4.fontName || 'system-ui');
    root.style.setProperty('--text-h4-size', `${typography.h4.fontSize}rem`);
    root.style.setProperty('--text-h4-color', typography.h4.color);
    root.style.setProperty('--text-h4-weight', String(typography.h4.fontWeight));
    root.style.setProperty('--text-h4-line-height', typography.h4.lineHeight || '1.4');

    root.style.setProperty('--text-h5-font', typography.h5.fontName || 'system-ui');
    root.style.setProperty('--text-h5-size', `${typography.h5.fontSize}rem`);
    root.style.setProperty('--text-h5-color', typography.h5.color);
    root.style.setProperty('--text-h5-weight', String(typography.h5.fontWeight));
    root.style.setProperty('--text-h5-line-height', typography.h5.lineHeight || '1.4');

    root.style.setProperty('--text-h6-font', typography.h6.fontName || 'system-ui');
    root.style.setProperty('--text-h6-size', `${typography.h6.fontSize}rem`);
    root.style.setProperty('--text-h6-color', typography.h6.color);
    root.style.setProperty('--text-h6-weight', String(typography.h6.fontWeight));
    root.style.setProperty('--text-h6-line-height', typography.h6.lineHeight || '1.5');

    root.style.setProperty('--text-title-font', typography.title.fontName || 'system-ui');
    root.style.setProperty('--text-title-size', `${typography.title.fontSize}rem`);
    root.style.setProperty('--text-title-color', typography.title.color);
    root.style.setProperty('--text-title-weight', String(typography.title.fontWeight));
    root.style.setProperty('--text-title-line-height', typography.title.lineHeight || '1.2');

    root.style.setProperty('--text-subtitle-font', typography.subtitle.fontName || 'system-ui');
    root.style.setProperty('--text-subtitle-size', `${typography.subtitle.fontSize}rem`);
    root.style.setProperty('--text-subtitle-color', typography.subtitle.color);
    root.style.setProperty('--text-subtitle-weight', String(typography.subtitle.fontWeight));
    root.style.setProperty('--text-subtitle-line-height', typography.subtitle.lineHeight || '1.3');

    root.style.setProperty('--text-p-font', typography.paragraph.fontName || 'system-ui');
    root.style.setProperty('--text-p-size', `${typography.paragraph.fontSize}rem`);
    root.style.setProperty('--text-p-color', typography.paragraph.color);
    root.style.setProperty('--text-p-weight', String(typography.paragraph.fontWeight));
    root.style.setProperty('--text-p-line-height', typography.paragraph.lineHeight || '1.6');

    // Decorator (icons and decorative elements)
    root.style.setProperty('--decorator-color', typography.decorator.color);
    root.style.setProperty('--decorator-size', `${typography.decorator.fontSize}rem`);

    document.documentElement.classList.remove('light', 'dark', 'accessibility');
    document.documentElement.classList.add(mode);
};

// Hook: Theme actions (API calls)
const useThemeActions = (dispatch: React.Dispatch<ThemeAction>) => {
    const loadActiveTheme = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });

            const response = await api.get('/themes/');
            let themes: Theme[] = response.data.themes || response.data;

            if (themes.length === 0) {
                try {
                    const defaultResponse = await api.get('/themes/default');
                    themes = [defaultResponse.data];
                } catch {
                    console.log('No theme found in database');
                    themes = [];
                }
            }

            if (themes.length > 0) {
                const theme = themes[0];
                
                // Cache the theme for instant load on next visit
                cacheTheme(theme);
                
                dispatch({ type: 'SET_ACTIVE_THEME', payload: theme });
                dispatch({ type: 'SET_AVAILABLE_THEMES', payload: themes });

                let mode: 'light' | 'dark' | 'accessibility' = 'light';
                const savedMode = localStorage.getItem('paletteMode') as 'light' | 'dark' | 'accessibility' | null;
                if (savedMode && ['light', 'dark', 'accessibility'].includes(savedMode)) {
                    mode = savedMode;
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    mode = 'dark';
                }

                dispatch({ type: 'SET_PALETTE_MODE', payload: mode });
                applyPalette(theme.config[mode], mode);
            }
        } catch (err: any) {
            console.error('Failed to load theme:', err);
            dispatch({ type: 'SET_ERROR', payload: err.response?.data?.detail || err.message || 'Failed to load theme' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [dispatch]);

    const setPaletteMode = useCallback((mode: 'light' | 'dark' | 'accessibility') => {
        dispatch({ type: 'SET_PALETTE_MODE', payload: mode });
        localStorage.setItem('paletteMode', mode);
    }, [dispatch]);

    const fetchAllThemes = useCallback(async (): Promise<Theme[]> => {
        try {
            const response = await api.get('/themes/admin');
            const themes: Theme[] = response.data.themes || response.data;
            dispatch({ type: 'SET_AVAILABLE_THEMES', payload: themes });
            return themes;
        } catch (err: any) {
            console.error('Failed to fetch themes:', err);
            throw err;
        }
    }, [dispatch]);

    const createTheme = useCallback(async (themeData: Partial<Theme>): Promise<Theme> => {
        try {
            const response = await api.post('/themes/', themeData);
            const created = response.data;
            
            // Cache the newly created theme
            cacheTheme(created);
            
            return created;
        } catch (err: any) {
            console.error('Failed to create theme:', err);
            throw err;
        }
    }, []);

    const updateTheme = useCallback(async (themeId: string, themeData: Partial<Theme>): Promise<Theme> => {
        try {
            const response = await api.patch(`/themes/${themeId}`, themeData);
            const updated = response.data;
            dispatch({ type: 'UPDATE_THEME', payload: updated });
            
            // Cache the updated theme for instant load on next visit
            cacheTheme(updated);
            
            return updated;
        } catch (err: any) {
            console.error('Failed to update theme:', err);
            throw err;
        }
    }, [dispatch]);

    const deleteTheme = useCallback(async (themeId: string): Promise<void> => {
        try {
            await api.delete(`/themes/${themeId}`);
            dispatch({ type: 'REMOVE_THEME', payload: themeId });
            
            // If deleted theme was cached, clear cache
            const cached = getCachedTheme();
            if (cached?.id === themeId) {
                localStorage.removeItem('cachedActiveTheme');
            }
        } catch (err: any) {
            console.error('Failed to delete theme:', err);
            throw err;
        }
    }, [dispatch]);

    const activateTheme = useCallback(async (themeId: string): Promise<Theme> => {
        try {
            const response = await api.post(`/themes/activate/${themeId}`);
            const activated = response.data;
            await fetchAllThemes();

            // Cache the newly activated theme for instant load on next visit
            cacheTheme(activated);

            // Update the active theme in state - this will trigger the useEffect to apply the palette
            dispatch({ type: 'SET_ACTIVE_THEME', payload: activated });

            return activated;
        } catch (err: any) {
            console.error('Failed to activate theme:', err);
            throw err;
        }
    }, [dispatch, fetchAllThemes]);

    const fetchFonts = useCallback(async (): Promise<Font[]> => {
        try {
            const response = await api.get('/fonts');
            const fonts: Font[] = response.data;
            
            // Inject @font-face rules for all uploaded fonts
            injectFontFaces(fonts);
            
            return fonts;
        } catch (err: any) {
            console.error('Failed to fetch fonts:', err);
            return [];
        }
    }, []);

    const injectFontFaces = (fonts: Font[]): void => {
        // Remove existing dynamic font-face styles
        document.getElementById('dynamic-font-faces')?.remove();
        
        // Create style element with @font-face rules using full backend URL
        const style = document.createElement('style');
        style.id = 'dynamic-font-faces';
        style.textContent = fonts.map(font => `
            @font-face {
                font-family: '${font.name}';
                src: url('${API_URL}${font.url}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `).join('\n');
        
        document.head.appendChild(style);
    };

    const uploadFont = useCallback(async (file: File): Promise<Font> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/fonts/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (err: any) {
            console.error('Failed to upload font:', err);
            throw err;
        }
    }, []);

    const deleteFont = useCallback(async (fontId: string): Promise<void> => {
        try {
            await api.delete(`/fonts/${fontId}`);
        } catch (err: any) {
            console.error('Failed to delete font:', err);
            throw err;
        }
    }, []);

    return {
        loadActiveTheme,
        setPaletteMode,
        fetchAllThemes,
        createTheme,
        updateTheme,
        deleteTheme,
        activateTheme,
        fetchFonts,
        uploadFont,
        deleteFont,
    };
};

// Hook: System preference detection
const useSystemPreference = (activeTheme: Theme | null, dispatch: React.Dispatch<ThemeAction>) => {
    const detectSystemPreference = useCallback(() => {
        if (localStorage.getItem('paletteMode')) return;

        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemChange = (e: MediaQueryListEvent) => {
            const newMode = e.matches ? 'dark' : 'light';
            dispatch({ type: 'SET_PALETTE_MODE', payload: newMode });
            if (activeTheme) {
                applyPalette(activeTheme.config[newMode], newMode);
            }
        };

        darkModeMediaQuery.addEventListener('change', handleSystemChange);
        return () => darkModeMediaQuery.removeEventListener('change', handleSystemChange);
    }, [activeTheme, dispatch]);

    return { detectSystemPreference };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(themeReducer, initialState);
    const actions = useThemeActions(dispatch);
    const { detectSystemPreference } = useSystemPreference(state.activeTheme, dispatch);

    // Load active theme and fonts on mount
    useEffect(() => {
        actions.loadActiveTheme();
        actions.fetchFonts();
    }, [actions.loadActiveTheme, actions.fetchFonts]);

    // Listen for system preference changes
    useEffect(() => {
        return detectSystemPreference();
    }, [detectSystemPreference]);

    // Apply palette when mode or activeTheme changes
    useEffect(() => {
        if (state.activeTheme && state.currentPalette) {
            applyPalette(state.currentPalette, state.currentMode);
        }
    }, [state.activeTheme, state.currentPalette, state.currentMode]);

    return (
        <ThemeContext.Provider
            value={{
                activeTheme: state.activeTheme,
                currentPalette: state.currentPalette,
                currentMode: state.currentMode,
                availableThemes: state.availableThemes,
                loadActiveTheme: actions.loadActiveTheme,
                setPaletteMode: actions.setPaletteMode,
                detectSystemPreference,
                createTheme: actions.createTheme,
                updateTheme: actions.updateTheme,
                deleteTheme: actions.deleteTheme,
                activateTheme: actions.activateTheme,
                fetchAllThemes: actions.fetchAllThemes,
                fetchFonts: actions.fetchFonts,
                uploadFont: actions.uploadFont,
                deleteFont: actions.deleteFont,
                isLoading: state.isLoading,
                error: state.error,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const usePalette = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('usePalette must be used within a ThemeProvider');
    }
    return {
        palette: context.currentPalette,
        mode: context.currentMode,
        setMode: context.setPaletteMode,
    };
};
