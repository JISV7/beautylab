import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { Theme, ThemePalette, ThemeConfig, Font } from '../data/theme.types';

const API_URL = 'http://localhost:8000';

interface ThemeContextType {
    // Current theme state
    activeTheme: Theme | null;
    currentPalette: ThemePalette | null;
    currentMode: 'light' | 'dark' | 'accessibility';
    
    // Available themes (for users to choose from)
    availableThemes: Theme[];
    
    // Theme actions
    loadActiveTheme: () => Promise<void>;
    setPaletteMode: (mode: 'light' | 'dark' | 'accessibility') => void;
    detectSystemPreference: () => void;
    
    // Admin actions
    createTheme: (themeData: Partial<Theme>) => Promise<Theme>;
    updateTheme: (themeId: string, themeData: Partial<Theme>) => Promise<Theme>;
    deleteTheme: (themeId: string) => Promise<void>;
    activateTheme: (themeId: string) => Promise<Theme>;
    fetchAllThemes: () => Promise<Theme[]>;
    
    // Font actions
    fetchFonts: () => Promise<Font[]>;
    uploadFont: (file: File) => Promise<Font>;
    deleteFont: (fontId: string) => Promise<void>;
    
    // Loading states
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
    const [currentPalette, setCurrentPalette] = useState<ThemePalette | null>(null);
    const [currentMode, setCurrentMode] = useState<'light' | 'dark' | 'accessibility'>('light');
    const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Apply CSS variables from palette
    const applyPalette = useCallback((palette: ThemePalette, mode: string) => {
        const root = document.documentElement;

        // Apply palette colors
        root.style.setProperty('--palette-primary', palette.colors.primary);
        root.style.setProperty('--palette-secondary', palette.colors.secondary);
        root.style.setProperty('--palette-accent', palette.colors.accent);
        root.style.setProperty('--palette-background', palette.colors.background);
        root.style.setProperty('--palette-surface', palette.colors.surface);
        root.style.setProperty('--palette-border', palette.colors.border);
        root.style.setProperty('--palette-text', palette.colors.text);
        root.style.setProperty('--palette-text-secondary', palette.colors.textSecondary);

        // Apply typography tokens
        const typography = palette.typography;
        
        // H1
        root.style.setProperty('--text-h1-font', typography.h1.fontName || 'system-ui');
        root.style.setProperty('--text-h1-size', typography.h1.fontSize);
        root.style.setProperty('--text-h1-color', typography.h1.color || palette.colors.text);
        root.style.setProperty('--text-h1-weight', String(typography.h1.fontWeight));
        root.style.setProperty('--text-h1-line-height', typography.h1.lineHeight || '1.2');

        // H2
        root.style.setProperty('--text-h2-font', typography.h2.fontName || 'system-ui');
        root.style.setProperty('--text-h2-size', typography.h2.fontSize);
        root.style.setProperty('--text-h2-color', typography.h2.color || palette.colors.text);
        root.style.setProperty('--text-h2-weight', String(typography.h2.fontWeight));
        root.style.setProperty('--text-h2-line-height', typography.h2.lineHeight || '1.2');

        // H3
        root.style.setProperty('--text-h3-font', typography.h3.fontName || 'system-ui');
        root.style.setProperty('--text-h3-size', typography.h3.fontSize);
        root.style.setProperty('--text-h3-color', typography.h3.color || palette.colors.text);
        root.style.setProperty('--text-h3-weight', String(typography.h3.fontWeight));
        root.style.setProperty('--text-h3-line-height', typography.h3.lineHeight || '1.3');

        // H4
        root.style.setProperty('--text-h4-font', typography.h4.fontName || 'system-ui');
        root.style.setProperty('--text-h4-size', typography.h4.fontSize);
        root.style.setProperty('--text-h4-color', typography.h4.color || palette.colors.text);
        root.style.setProperty('--text-h4-weight', String(typography.h4.fontWeight));
        root.style.setProperty('--text-h4-line-height', typography.h4.lineHeight || '1.4');

        // H5
        root.style.setProperty('--text-h5-font', typography.h5.fontName || 'system-ui');
        root.style.setProperty('--text-h5-size', typography.h5.fontSize);
        root.style.setProperty('--text-h5-color', typography.h5.color || palette.colors.text);
        root.style.setProperty('--text-h5-weight', String(typography.h5.fontWeight));
        root.style.setProperty('--text-h5-line-height', typography.h5.lineHeight || '1.4');

        // H6
        root.style.setProperty('--text-h6-font', typography.h6.fontName || 'system-ui');
        root.style.setProperty('--text-h6-size', typography.h6.fontSize);
        root.style.setProperty('--text-h6-color', typography.h6.color || palette.colors.text);
        root.style.setProperty('--text-h6-weight', String(typography.h6.fontWeight));
        root.style.setProperty('--text-h6-line-height', typography.h6.lineHeight || '1.5');

        // Title
        root.style.setProperty('--text-title-font', typography.title.fontName || 'system-ui');
        root.style.setProperty('--text-title-size', typography.title.fontSize);
        root.style.setProperty('--text-title-color', typography.title.color || palette.colors.text);
        root.style.setProperty('--text-title-weight', String(typography.title.fontWeight));
        root.style.setProperty('--text-title-line-height', typography.title.lineHeight || '1.2');

        // Subtitle
        root.style.setProperty('--text-subtitle-font', typography.subtitle.fontName || 'system-ui');
        root.style.setProperty('--text-subtitle-size', typography.subtitle.fontSize);
        root.style.setProperty('--text-subtitle-color', typography.subtitle.color || palette.colors.text);
        root.style.setProperty('--text-subtitle-weight', String(typography.subtitle.fontWeight));
        root.style.setProperty('--text-subtitle-line-height', typography.subtitle.lineHeight || '1.3');

        // Paragraph
        root.style.setProperty('--text-p-font', typography.paragraph.fontName || 'system-ui');
        root.style.setProperty('--text-p-size', typography.paragraph.fontSize);
        root.style.setProperty('--text-p-color', typography.paragraph.color || palette.colors.textSecondary);
        root.style.setProperty('--text-p-weight', String(typography.paragraph.fontWeight));
        root.style.setProperty('--text-p-line-height', typography.paragraph.lineHeight || '1.6');

        // Apply mode class to document
        document.documentElement.classList.remove('light', 'dark', 'accessibility');
        document.documentElement.classList.add(mode);
    }, []);

    // Load active theme from backend
    const loadActiveTheme = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch active themes
            const response = await api.get('/themes/');
            const themes: Theme[] = response.data.themes || response.data;

            if (themes.length === 0) {
                // No active themes, try to get default
                try {
                    const defaultResponse = await api.get('/themes/default');
                    themes.push(defaultResponse.data);
                } catch {
                    // No default theme either
                    setIsLoading(false);
                    return;
                }
            }

            // Use first active theme (in future, could be more sophisticated)
            const theme = themes[0];
            setActiveTheme(theme);

            // Check user's preferred mode
            let mode: 'light' | 'dark' | 'accessibility' = 'light';
            
            // Check localStorage first
            const savedMode = localStorage.getItem('paletteMode') as 'light' | 'dark' | 'accessibility' | null;
            if (savedMode && ['light', 'dark', 'accessibility'].includes(savedMode)) {
                mode = savedMode;
            } else {
                // Detect system preference
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    mode = 'dark';
                }
            }

            setCurrentMode(mode);
            setCurrentPalette(theme.config[mode]);
            applyPalette(theme.config[mode], mode);

            setAvailableThemes(themes);
        } catch (err: any) {
            console.error('Failed to load theme:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to load theme');
        } finally {
            setIsLoading(false);
        }
    }, [applyPalette]);

    // Set palette mode
    const setPaletteMode = useCallback((mode: 'light' | 'dark' | 'accessibility') => {
        if (!activeTheme) return;

        setCurrentMode(mode);
        setCurrentPalette(activeTheme.config[mode]);
        applyPalette(activeTheme.config[mode], mode);
        localStorage.setItem('paletteMode', mode);
    }, [activeTheme, applyPalette]);

    // Detect system preference
    const detectSystemPreference = useCallback(() => {
        if (localStorage.getItem('paletteMode')) return; // User has manual preference

        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemChange = (e: MediaQueryListEvent) => {
            const newMode = e.matches ? 'dark' : 'light';
            setCurrentMode(newMode);
            if (activeTheme) {
                setCurrentPalette(activeTheme.config[newMode]);
                applyPalette(activeTheme.config[newMode], newMode);
            }
        };

        darkModeMediaQuery.addEventListener('change', handleSystemChange);
        return () => darkModeMediaQuery.removeEventListener('change', handleSystemChange);
    }, [activeTheme, applyPalette]);

    // Fetch all themes (admin)
    const fetchAllThemes = useCallback(async (): Promise<Theme[]> => {
        try {
            const response = await api.get('/themes/admin');
            const themes: Theme[] = response.data.themes || response.data;
            setAvailableThemes(themes);
            return themes;
        } catch (err: any) {
            console.error('Failed to fetch themes:', err);
            throw err;
        }
    }, []);

    // Create theme (admin)
    const createTheme = useCallback(async (themeData: Partial<Theme>): Promise<Theme> => {
        try {
            const response = await api.post('/themes/', themeData);
            return response.data;
        } catch (err: any) {
            console.error('Failed to create theme:', err);
            throw err;
        }
    }, []);

    // Update theme (admin)
    const updateTheme = useCallback(async (themeId: string, themeData: Partial<Theme>): Promise<Theme> => {
        try {
            const response = await api.patch(`/themes/${themeId}`, themeData);
            
            // If this is the active theme, update local state
            if (activeTheme && activeTheme.id === themeId) {
                setActiveTheme(response.data);
                setCurrentPalette(response.data.config[currentMode]);
                applyPalette(response.data.config[currentMode], currentMode);
            }
            
            return response.data;
        } catch (err: any) {
            console.error('Failed to update theme:', err);
            throw err;
        }
    }, [activeTheme, currentMode, applyPalette]);

    // Delete theme (admin)
    const deleteTheme = useCallback(async (themeId: string): Promise<void> => {
        try {
            await api.delete(`/themes/${themeId}`);
            
            // Refresh themes list
            await fetchAllThemes();
        } catch (err: any) {
            console.error('Failed to delete theme:', err);
            throw err;
        }
    }, [fetchAllThemes]);

    // Activate theme (admin)
    const activateTheme = useCallback(async (themeId: string): Promise<Theme> => {
        try {
            const response = await api.post(`/themes/activate/${themeId}`);
            await fetchAllThemes();
            return response.data;
        } catch (err: any) {
            console.error('Failed to activate theme:', err);
            throw err;
        }
    }, [fetchAllThemes]);

    // Fetch fonts
    const fetchFonts = useCallback(async (): Promise<Font[]> => {
        try {
            const response = await api.get('/fonts');
            return response.data;
        } catch (err: any) {
            console.error('Failed to fetch fonts:', err);
            return [];
        }
    }, []);

    // Upload font
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

    // Delete font
    const deleteFont = useCallback(async (fontId: string): Promise<void> => {
        try {
            await api.delete(`/fonts/${fontId}`);
        } catch (err: any) {
            console.error('Failed to delete font:', err);
            throw err;
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadActiveTheme();
    }, [loadActiveTheme]);

    // Listen for system preference changes
    useEffect(() => {
        return detectSystemPreference();
    }, [detectSystemPreference]);

    return (
        <ThemeContext.Provider
            value={{
                activeTheme,
                currentPalette,
                currentMode,
                availableThemes,
                loadActiveTheme,
                setPaletteMode,
                detectSystemPreference,
                createTheme,
                updateTheme,
                deleteTheme,
                activateTheme,
                fetchAllThemes,
                fetchFonts,
                uploadFont,
                deleteFont,
                isLoading,
                error,
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
