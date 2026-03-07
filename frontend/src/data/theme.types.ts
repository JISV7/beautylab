export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
}

export interface ThemeTypographyItem {
  fontFamily: string;
  fontSize: string;
  color?: string;
}

export interface ThemeTypography {
  h1: ThemeTypographyItem;
  h2: ThemeTypographyItem;
  h3: ThemeTypographyItem;
  h4: ThemeTypographyItem;
  h5: ThemeTypographyItem;
  h6: ThemeTypographyItem;
  title: ThemeTypographyItem; // Kept for backwards compatibility
  subtitle: ThemeTypographyItem; // Kept for backwards compatibility
  paragraph: ThemeTypographyItem;
}

export interface HeroComponentStyles {
  badge: {
    textColor: string;
    fontSize: string;
  };
  title: {
    color: string;
    fontSize: string;
    fontWeight: string | number;
  };
  description: {
    color: string;
    fontSize: string;
    lineHeight: string;
  };
  ctaPrimary: {
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontWeight: string | number;
    paddingX: string;
    paddingY: string;
    borderRadius: string;
  };
  ctaSecondary: {
    backgroundColor: string;
    color: string;
    borderColor: string;
    fontSize: string;
    fontWeight: string | number;
    paddingX: string;
    paddingY: string;
    borderRadius: string;
  };
  statValue: {
    color: string;
    fontSize: string;
    fontWeight: string | number;
  };
  statLabel: {
    color: string;
    fontSize: string;
  };
}

export interface CourseCarouselComponentStyles {
  title: {
    color: string;
    fontSize: string;
    fontWeight: string | number;
  };
  cardTitle: {
    color: string;
    fontSize: string;
    fontWeight: string | number;
  };
  cardDescription: {
    color: string;
    fontSize: string;
  };
  cardMeta: {
    color: string;
    fontSize: string;
  };
  cardButton: {
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontWeight: string | number;
  };
}

export interface DashboardComponentStyles {
  sidebar: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    textSecondary: string;
    hoverBackground: string;
    activeBackground: string;
    activeTextColor: string;
  };
  header: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  };
  welcomeHero: {
    backgroundColor: string;
    textColor: string;
    titleColor: string;
    descriptionColor: string;
    buttonBackgroundColor: string;
    buttonTextColor: string;
  };
  statCard: {
    backgroundColor: string;
    borderColor: string;
    titleColor: string;
    valueColor: string;
    iconBackgroundColor: string;
    iconColor: string;
  };
  courseCard: {
    backgroundColor: string;
    borderColor: string;
    titleColor: string;
    progressBarBackground: string;
    progressBarFill: string;
  };
  aiWidget: {
    backgroundColor: string;
    borderColor: string;
    titleColor: string;
    textColor: string;
  };
}

export interface ComponentStyles {
  hero: HeroComponentStyles;
  courseCarousel: CourseCarouselComponentStyles;
  dashboard?: DashboardComponentStyles;
}

export interface ThemeModeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  components?: ComponentStyles;
}

export interface ThemePresetColors {
  colors: ThemeColors;
}

export interface ThemePreset {
  name: string;
  light: ThemePresetColors;
  dark: ThemePresetColors;
}

export interface ThemePresets {
  [key: string]: ThemePreset;
}

// New types for named themes with light/dark/accessibility modes
export interface ThemeMode {
  colors: ThemeColors;
  typography: ThemeTypography;
  components?: ComponentStyles;
}

export interface NamedTheme {
  name: string;
  light: ThemeMode;
  dark: ThemeMode;
  accessibility: ThemeMode;
}

export interface NamedThemes {
  [key: string]: NamedTheme;
}

export interface ThemeData {
  light: ThemeModeConfig;
  dark: ThemeModeConfig;
  accessibility?: ThemeModeConfig;
  presets?: ThemePresets;
  themes?: NamedThemes;
  [key: string]: ThemeModeConfig | ThemePresets | NamedThemes | undefined;
}
