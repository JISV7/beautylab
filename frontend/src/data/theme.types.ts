/**
 * Theme types for the new palette-based system.
 * 
 * Structure:
 * - 1 Theme = 3 Palettes (light, dark, accessibility)
 * - 1 Palette = Colors + Typography
 */

// ==================== Color Types ====================

export interface PaletteColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  decorator?: string;
  loader?: LoaderConfig;
  // Note: text colors are defined in typography config, not here
}

// ==================== Typography Types ====================

export interface TypographyElement {
  fontId: string;        // UUID of the font (mandatory, references fonts.id)
  fontName: string;      // Font display name (mandatory)
  fontSize: string;       // Font size in rem (e.g., "2.5")
  fontWeight: number;     // Font weight 100-900
  color: string;          // Text color for this element
  lineHeight?: string;    // Optional line height (e.g., "1.2")
}

export interface TypographyConfig {
  h1: TypographyElement;
  h2: TypographyElement;
  h3: TypographyElement;
  h4: TypographyElement;
  h5: TypographyElement;
  h6: TypographyElement;
  title: TypographyElement;
  subtitle: TypographyElement;
  paragraph: TypographyElement;
  decorator: TypographyElement;
}

// ==================== Palette Types ====================

export interface ThemePalette {
  colors: PaletteColors;
  typography: TypographyConfig;
}

export interface LoaderConfig {
  enabled: boolean;
  selectedTangram: number; // 1, 2, or 3
}

// ==================== Theme Config Types ====================

export interface ThemeConfig {
  light: ThemePalette;
  dark: ThemePalette;
  accessibility: ThemePalette;
}

// ==================== Theme Types ====================

export interface Theme {
  id: string;
  name: string;
  description?: string;
  type: 'preset' | 'custom';
  config: ThemeConfig;
  isActive: boolean;
  isDefault: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Font Types ====================

export interface Font {
  id: string;
  name: string;
  filename: string;
  url: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  fontUsage?: FontUsageEntry[];
  usageCount?: number;
}

export interface FontUsageEntry {
  themeId: string;
  themeName: string;
  palette: 'light' | 'dark' | 'accessibility';
  element: string;  // h1, h2, ..., p
}

// ==================== Legacy Types (for backwards compatibility) ====================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  // Note: text colors are defined in typography config, not here
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
  title: ThemeTypographyItem;
  subtitle: ThemeTypographyItem;
  paragraph: ThemeTypographyItem;
  decorator: ThemeTypographyItem;
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

// ==================== Admin Editor Types ====================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  decorator: string;
}

export interface TypographyStyle {
  fontFamily: string;
  size: number;
  color: string;
}

export interface ThemeEditorProps {
  theme: NamedTheme;
  activeMode: 'light' | 'dark' | 'accessibility';
  onModeChange: (mode: 'light' | 'dark' | 'accessibility') => void;
  onSave: (colors: ColorPalette, styles: Record<string, TypographyStyle>) => void;
  onPublish: () => void;
  onBack: () => void;
}

export interface ColorEditorProps {
  colors: ColorPalette;
  activeMode: 'light' | 'dark' | 'accessibility';
  styles: Record<string, TypographyStyle>;
  onColorChange: (key: keyof ColorPalette, value: string) => void;
}

export interface TypographyEditorProps {
  styles: Record<string, TypographyStyle>;
  activeMode: 'light' | 'dark' | 'accessibility';
  colors: ColorPalette;
  onStyleChange: (key: string, field: keyof TypographyStyle, value: string | number) => void;
  onFontUploaded: () => void;
  onFontDeleted: (fontId: string) => void;
}

export interface ThemePreviewProps {
  theme: NamedTheme;
  onEdit: () => void;
  onClose: () => void;
  onPublish: () => void;
}

export interface ThemeTableRow {
  key: string;
  name: string;
  isActive: boolean;
  isPublished: boolean;
}

export interface ThemeTableProps {
  themes: Record<string, NamedTheme>;
  activeThemeName: string;
  publishedThemeName: string | null;
  currentPage: number;
  rowsPerPage: number;
  sortColumn: 'name' | 'isActive' | 'isPublished';
  sortDirection: 'asc' | 'desc';
  onEdit: (themeKey: string) => void;
  onPreview: (themeKey: string) => void;
  onDelete: (themeKey: string) => void;
  onPageChange: (page: number) => void;
  onSort: (column: 'name' | 'isActive' | 'isPublished') => void;
}

export interface FontManagerProps {
  installedFonts: Font[];
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFontDelete: (font: Font) => void;
  getFontUsage: (fontName: string) => { theme: string; elements: string[] }[];
}
