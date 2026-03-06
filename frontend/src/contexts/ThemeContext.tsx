import React, { createContext, useContext, useState, useEffect } from 'react';
import themeData from '../data/theme.json';
import type { ThemeModeConfig, ThemePreset, ThemePresets, ThemeData } from '../data/theme.types';

export type ThemeMode = string;

interface ThemeConfig {
    mode: ThemeMode;
    preset?: string;
    customTheme?: Partial<ThemeData>;
}

interface ThemeContextType {
    config: ThemeConfig;
    updateTheme: (config: Partial<ThemeConfig>) => void;
    loadPreset: (presetName: string) => void;
    saveCustomTheme: (customTheme: Partial<ThemeData>) => void;
    getCustomTheme: () => Partial<ThemeData> | null;
    resetToPreset: (presetName: string) => void;
    availablePresets: string[];
    themeData: typeof themeData;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<ThemeConfig>({ mode: 'light' });
    const [customTheme, setCustomTheme] = useState<Partial<ThemeData> | null>(null);

    useEffect(() => {
        // Check local storage for saved theme on initial load
        const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
        const savedPreset = localStorage.getItem('themePreset');
        const savedCustomTheme = localStorage.getItem('customTheme');

        if (savedCustomTheme) {
            try {
                const parsed = JSON.parse(savedCustomTheme);
                setCustomTheme(parsed);
            } catch (e) {
                console.error('Failed to parse custom theme from localStorage');
            }
        }

        if (savedTheme) {
            setConfig({ mode: savedTheme, preset: savedPreset || undefined });
        }
    }, []);

    const applyComponentStyles = (currentTheme: ThemeModeConfig) => {
        const root = document.documentElement;
        const components = currentTheme.components;

        if (!components) return;

        // Hero component styles
        if (components.hero) {
            // Badge
            root.style.setProperty('--hero-badge-text-color', components.hero.badge.textColor);
            root.style.setProperty('--hero-badge-font-size', components.hero.badge.fontSize);

            // Title
            root.style.setProperty('--hero-title-color', components.hero.title.color);
            root.style.setProperty('--hero-title-font-size', components.hero.title.fontSize);
            root.style.setProperty('--hero-title-font-weight', String(components.hero.title.fontWeight));

            // Description
            root.style.setProperty('--hero-description-color', components.hero.description.color);
            root.style.setProperty('--hero-description-font-size', components.hero.description.fontSize);
            root.style.setProperty('--hero-description-line-height', components.hero.description.lineHeight);

            // CTA Primary
            root.style.setProperty('--hero-cta-primary-bg', components.hero.ctaPrimary.backgroundColor);
            root.style.setProperty('--hero-cta-primary-color', components.hero.ctaPrimary.color);
            root.style.setProperty('--hero-cta-primary-font-size', components.hero.ctaPrimary.fontSize);
            root.style.setProperty('--hero-cta-primary-font-weight', String(components.hero.ctaPrimary.fontWeight));
            root.style.setProperty('--hero-cta-primary-padding-x', components.hero.ctaPrimary.paddingX);
            root.style.setProperty('--hero-cta-primary-padding-y', components.hero.ctaPrimary.paddingY);
            root.style.setProperty('--hero-cta-primary-border-radius', components.hero.ctaPrimary.borderRadius);

            // CTA Secondary
            root.style.setProperty('--hero-cta-secondary-bg', components.hero.ctaSecondary.backgroundColor);
            root.style.setProperty('--hero-cta-secondary-color', components.hero.ctaSecondary.color);
            root.style.setProperty('--hero-cta-secondary-border-color', components.hero.ctaSecondary.borderColor);
            root.style.setProperty('--hero-cta-secondary-font-size', components.hero.ctaSecondary.fontSize);
            root.style.setProperty('--hero-cta-secondary-font-weight', String(components.hero.ctaSecondary.fontWeight));
            root.style.setProperty('--hero-cta-secondary-padding-x', components.hero.ctaSecondary.paddingX);
            root.style.setProperty('--hero-cta-secondary-padding-y', components.hero.ctaSecondary.paddingY);
            root.style.setProperty('--hero-cta-secondary-border-radius', components.hero.ctaSecondary.borderRadius);

            // Stat Value
            root.style.setProperty('--hero-stat-value-color', components.hero.statValue.color);
            root.style.setProperty('--hero-stat-value-font-size', components.hero.statValue.fontSize);
            root.style.setProperty('--hero-stat-value-font-weight', String(components.hero.statValue.fontWeight));

            // Stat Label
            root.style.setProperty('--hero-stat-label-color', components.hero.statLabel.color);
            root.style.setProperty('--hero-stat-label-font-size', components.hero.statLabel.fontSize);
        }

        // Course Carousel component styles
        if (components.courseCarousel) {
            // Title
            root.style.setProperty('--course-carousel-title-color', components.courseCarousel.title.color);
            root.style.setProperty('--course-carousel-title-font-size', components.courseCarousel.title.fontSize);
            root.style.setProperty('--course-carousel-title-font-weight', String(components.courseCarousel.title.fontWeight));

            // Card Title
            root.style.setProperty('--course-card-title-color', components.courseCarousel.cardTitle.color);
            root.style.setProperty('--course-card-title-font-size', components.courseCarousel.cardTitle.fontSize);
            root.style.setProperty('--course-card-title-font-weight', String(components.courseCarousel.cardTitle.fontWeight));

            // Card Description
            root.style.setProperty('--course-card-description-color', components.courseCarousel.cardDescription.color);
            root.style.setProperty('--course-card-description-font-size', components.courseCarousel.cardDescription.fontSize);

            // Card Meta
            root.style.setProperty('--course-card-meta-color', components.courseCarousel.cardMeta.color);
            root.style.setProperty('--course-card-meta-font-size', components.courseCarousel.cardMeta.fontSize);

            // Card Button
            root.style.setProperty('--course-card-button-bg', components.courseCarousel.cardButton.backgroundColor);
            root.style.setProperty('--course-card-button-color', components.courseCarousel.cardButton.color);
            root.style.setProperty('--course-card-button-font-size', components.courseCarousel.cardButton.fontSize);
            root.style.setProperty('--course-card-button-font-weight', String(components.courseCarousel.cardButton.fontWeight));
        }

        // Dashboard component styles
        if (components.dashboard) {
            // Sidebar
            root.style.setProperty('--dashboard-sidebar-bg', components.dashboard.sidebar.backgroundColor);
            root.style.setProperty('--dashboard-sidebar-border', components.dashboard.sidebar.borderColor);
            root.style.setProperty('--dashboard-sidebar-text', components.dashboard.sidebar.textColor);
            root.style.setProperty('--dashboard-sidebar-text-secondary', components.dashboard.sidebar.textSecondary);
            root.style.setProperty('--dashboard-sidebar-hover-bg', components.dashboard.sidebar.hoverBackground);
            root.style.setProperty('--dashboard-sidebar-active-bg', components.dashboard.sidebar.activeBackground);
            root.style.setProperty('--dashboard-sidebar-active-text', components.dashboard.sidebar.activeTextColor);

            // Header
            root.style.setProperty('--dashboard-header-bg', components.dashboard.header.backgroundColor);
            root.style.setProperty('--dashboard-header-border', components.dashboard.header.borderColor);
            root.style.setProperty('--dashboard-header-text', components.dashboard.header.textColor);

            // Welcome Hero
            root.style.setProperty('--dashboard-welcome-bg', components.dashboard.welcomeHero.backgroundColor);
            root.style.setProperty('--dashboard-welcome-text', components.dashboard.welcomeHero.textColor);
            root.style.setProperty('--dashboard-welcome-title-color', components.dashboard.welcomeHero.titleColor);
            root.style.setProperty('--dashboard-welcome-description-color', components.dashboard.welcomeHero.descriptionColor);
            root.style.setProperty('--dashboard-welcome-button-bg', components.dashboard.welcomeHero.buttonBackgroundColor);
            root.style.setProperty('--dashboard-welcome-button-text', components.dashboard.welcomeHero.buttonTextColor);

            // Stat Card
            root.style.setProperty('--dashboard-stat-card-bg', components.dashboard.statCard.backgroundColor);
            root.style.setProperty('--dashboard-stat-card-border', components.dashboard.statCard.borderColor);
            root.style.setProperty('--dashboard-stat-title-color', components.dashboard.statCard.titleColor);
            root.style.setProperty('--dashboard-stat-value-color', components.dashboard.statCard.valueColor);
            root.style.setProperty('--dashboard-stat-icon-bg', components.dashboard.statCard.iconBackgroundColor);
            root.style.setProperty('--dashboard-stat-icon-color', components.dashboard.statCard.iconColor);

            // Course Card
            root.style.setProperty('--dashboard-course-card-bg', components.dashboard.courseCard.backgroundColor);
            root.style.setProperty('--dashboard-course-card-border', components.dashboard.courseCard.borderColor);
            root.style.setProperty('--dashboard-course-title-color', components.dashboard.courseCard.titleColor);
            root.style.setProperty('--dashboard-progress-bg', components.dashboard.courseCard.progressBarBackground);
            root.style.setProperty('--dashboard-progress-fill', components.dashboard.courseCard.progressBarFill);

            // AI Widget
            root.style.setProperty('--dashboard-ai-widget-bg', components.dashboard.aiWidget.backgroundColor);
            root.style.setProperty('--dashboard-ai-widget-border', components.dashboard.aiWidget.borderColor);
            root.style.setProperty('--dashboard-ai-widget-title-color', components.dashboard.aiWidget.titleColor);
            root.style.setProperty('--dashboard-ai-widget-text-color', components.dashboard.aiWidget.textColor);
        }
    };

    useEffect(() => {
        // Apply theme mode to document element
        document.documentElement.classList.remove('light', 'dark', 'accessibility');
        document.documentElement.classList.add(config.mode);
        localStorage.setItem('themeMode', config.mode);

        // Get current theme data (either from custom, preset, or default mode)
        let currentTheme: ThemeModeConfig;

        if (customTheme) {
            // Use custom theme if available
            const modeData = customTheme[config.mode];
            const defaultMode = themeData[config.mode as keyof typeof themeData] || themeData['light'];
            currentTheme = modeData ? { ...defaultMode, ...modeData } as ThemeModeConfig : defaultMode as ThemeModeConfig;
        } else if (config.preset && themeData.presets) {
            const presets = themeData.presets as ThemePresets;
            const preset: ThemePreset = presets[config.preset];
            // For presets, we only have colors, so we merge with default typography and components
            const defaultMode = themeData[config.mode as keyof typeof themeData] || themeData['light'];
            currentTheme = {
                ...(defaultMode as ThemeModeConfig),
                colors: (preset as any)[config.mode]?.colors || preset['light'].colors,
            };
        } else {
            currentTheme = (themeData[config.mode as keyof typeof themeData] || themeData['light']) as ThemeModeConfig;
        }

        const root = document.documentElement;

        // Apply base colors
        root.style.setProperty('--theme-primary-value', currentTheme.colors.primary);
        root.style.setProperty('--theme-secondary-value', currentTheme.colors.secondary);
        root.style.setProperty('--theme-accent-value', currentTheme.colors.accent);
        root.style.setProperty('--theme-surface-value', currentTheme.colors.surface);
        root.style.setProperty('--theme-background-value', currentTheme.colors.background);
        root.style.setProperty('--theme-border-value', currentTheme.colors.border);
        root.style.setProperty('--theme-text-base-value', currentTheme.colors.text);
        root.style.setProperty('--theme-text-secondary-value', currentTheme.colors.textSecondary);

        // Apply typography fonts
        root.style.setProperty('--theme-font-h1', currentTheme.typography.h1?.fontFamily || currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-h2', currentTheme.typography.h2?.fontFamily || currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-h3', currentTheme.typography.h3?.fontFamily || currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-h4', currentTheme.typography.h4?.fontFamily || currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-h5', currentTheme.typography.h5?.fontFamily || currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-h6', currentTheme.typography.h6?.fontFamily || currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-title', currentTheme.typography.title.fontFamily);
        root.style.setProperty('--theme-font-subtitle', currentTheme.typography.subtitle.fontFamily);
        root.style.setProperty('--theme-font-paragraph', currentTheme.typography.paragraph.fontFamily);

        // Apply typography sizes
        root.style.setProperty('--theme-size-h1', currentTheme.typography.h1?.fontSize || '2.5rem');
        root.style.setProperty('--theme-size-h2', currentTheme.typography.h2?.fontSize || '2rem');
        root.style.setProperty('--theme-size-h3', currentTheme.typography.h3?.fontSize || '1.75rem');
        root.style.setProperty('--theme-size-h4', currentTheme.typography.h4?.fontSize || '1.5rem');
        root.style.setProperty('--theme-size-h5', currentTheme.typography.h5?.fontSize || '1.25rem');
        root.style.setProperty('--theme-size-h6', currentTheme.typography.h6?.fontSize || '1rem');
        root.style.setProperty('--theme-size-title', currentTheme.typography.title.fontSize);
        root.style.setProperty('--theme-size-subtitle', currentTheme.typography.subtitle.fontSize);
        root.style.setProperty('--theme-size-paragraph', currentTheme.typography.paragraph.fontSize);

        // Apply typography custom colors (fallback to text base)
        if (currentTheme.typography.title.color) {
            root.style.setProperty('--theme-color-title', currentTheme.typography.title.color);
        } else {
            root.style.removeProperty('--theme-color-title');
        }
        if (currentTheme.typography.subtitle.color) {
            root.style.setProperty('--theme-color-subtitle', currentTheme.typography.subtitle.color);
        } else {
            root.style.removeProperty('--theme-color-subtitle');
        }
        if (currentTheme.typography.paragraph.color) {
            root.style.setProperty('--theme-color-paragraph', currentTheme.typography.paragraph.color);
        } else {
            root.style.removeProperty('--theme-color-paragraph');
        }

        // Apply component-specific styles
        applyComponentStyles(currentTheme);
    }, [config.mode, config.preset]);

    const updateTheme = (newConfig: Partial<ThemeConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
        if (newConfig.mode) {
            localStorage.setItem('themeMode', newConfig.mode);
        }
        if (newConfig.preset !== undefined) {
            localStorage.setItem('themePreset', newConfig.preset || '');
        }
    };

    const loadPreset = (presetName: string) => {
        if (themeData.presets) {
            const presets = themeData.presets as ThemePresets;
            if (presets[presetName]) {
                updateTheme({ preset: presetName });
                setCustomTheme(null);
                localStorage.removeItem('customTheme');
            }
        }
    };

    const saveCustomTheme = (newCustomTheme: Partial<ThemeData>) => {
        setCustomTheme(newCustomTheme);
        localStorage.setItem('customTheme', JSON.stringify(newCustomTheme));
        updateTheme({ preset: undefined });
    };

    const getCustomTheme = () => {
        return customTheme;
    };

    const resetToPreset = (presetName: string) => {
        loadPreset(presetName);
    };

    const availablePresets = themeData.presets ? Object.keys(themeData.presets as ThemePresets) : [];

    return (
        <ThemeContext.Provider value={{ config, updateTheme, loadPreset, saveCustomTheme, getCustomTheme, resetToPreset, availablePresets, themeData }}>
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
