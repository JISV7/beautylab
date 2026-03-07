import type { NamedTheme } from '../../data/theme.types';

export interface Font {
    id: string;
    name: string;
    filename: string;
    url: string;
    created_at: string;
}

export interface TypographyStyle {
    fontFamily: string;
    size: number;
    color: string;
}

export interface ThemeTableRow {
    key: string;
    name: string;
    isActive: boolean;
    isPublished: boolean;
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    border: string;
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
