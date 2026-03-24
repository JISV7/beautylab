import type { Theme, Font, ThemePalette } from '../../data/theme.types';

export interface TypographyStyle {
    fontFamily: string;
    fontId: string;  // UUID of the selected font
    size: number;
    color: string;
    fontWeight?: number;
    lineHeight?: string;
}

export interface ThemeTableRow {
    id: string;
    name: string;
    type: 'preset' | 'custom';
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    border: string;
    decorator: string;
}

export interface ThemeEditorProps {
    theme: Theme;
    activeMode: 'light' | 'dark' | 'accessibility';
    onModeChange: (mode: 'light' | 'dark' | 'accessibility') => void;
    onSave: (colors: ColorPalette, styles: Record<string, TypographyStyle>, currentPalette: ThemePalette) => void;
    onPublish: () => void;
    onPreview: () => void;
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
    colors: ColorPalette;
    fonts: Font[];
    onStyleChange: (key: string, field: keyof TypographyStyle, value: string | number) => void;
}

export interface ThemePreviewProps {
    theme: Theme;
    onEdit: (mode: 'light' | 'dark' | 'accessibility') => void;
    onClose: () => void;
    onPublish: () => void;
}

export interface ThemeTableProps {
    themes: Theme[];
    currentPage: number;
    rowsPerPage: number;
    sortColumn: 'name' | 'isActive' | 'isDefault';
    sortDirection: 'asc' | 'desc';
    onEdit: (themeId: string) => void;
    onPreview: (themeId: string) => void;
    onDelete: (themeId: string) => void;
    onDuplicate: (themeId: string) => void;
    onPageChange: (page: number) => void;
    onSort: (column: 'name' | 'isActive' | 'isDefault') => void;
}

export interface FontManagerProps {
    installedFonts: Font[];
    uploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFontDelete: (font: Font) => void;
}

// ==================== Course Management Types ====================

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    order: number;
}

export interface Level {
    id: number;
    name: string;
    slug: string;
    description?: string;
    order: number;
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description?: string;
    image_url?: string;
    duration_hours?: number;
    level_id?: number;
    category_id?: number;
    product_id: string;
    published: boolean;
    created_at: string;
    updated_at: string;
    level_name?: string;
    category_name?: string;
    product_name?: string;
    product_price?: string;
}

export interface CourseFormData {
    // Course fields
    title: string;
    slug: string;
    description: string;
    image_url: string;
    duration_hours: string;
    level_id: string;
    category_id: string;
    published: boolean;
    // Product fields
    product_name: string;
    sku: string;
    price: string;
    tax_rate: string;
    tax_type: 'taxed' | 'exempt' | 'exonerated';
}

export interface CourseListProps {
    onNavigateToCreate: () => void;
    onNavigateToEdit: (courseId: string) => void;
}

export interface CourseManagementProps {
    onBack?: () => void;
}
