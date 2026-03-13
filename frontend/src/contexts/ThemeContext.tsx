import React, { createContext, useContext, useEffect, useCallback, useReducer } from 'react';
import axios from 'axios';
import type { Theme, ThemePalette, Font } from '../data/theme.types';

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

const cacheTheme = (theme: Theme) => {
    try {
        localStorage.setItem('cachedActiveTheme', JSON.stringify(theme));
    } catch {
        // Ignore localStorage errors
    }
};

// Get cached theme for initial state
const cachedTheme = getCachedTheme();

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
    activeTheme: cachedTheme,
    currentPalette: cachedTheme?.config.light || null,
    currentMode: cachedTheme ? ('light' as const) : 'light',
    availableThemes: cachedTheme ? [cachedTheme] : [],
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

// Apply CSS variables from palette
const applyPalette = (palette: ThemePalette, mode: string): void => {
    const root = document.documentElement;

    root.style.setProperty('--palette-primary', palette.colors.primary);
    root.style.setProperty('--palette-secondary', palette.colors.secondary);
    root.style.setProperty('--palette-accent', palette.colors.accent);
    root.style.setProperty('--palette-background', palette.colors.background);
    root.style.setProperty('--palette-surface', palette.colors.surface);
    root.style.setProperty('--palette-border', palette.colors.border);

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
