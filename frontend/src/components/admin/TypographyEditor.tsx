import React, { useRef } from 'react';
import { Type, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import axios from 'axios';
import type { TypographyEditorProps, TypographyStyle } from './types';
import type { Font } from '../../data/theme.types';
import { FontManager } from './FontManager';

const API_URL = 'http://localhost:8000';

interface StyleBlockProps {
    label: string;
    shortLabel: string;
    expanded: boolean;
    style: { fontFamily: string; size: number; color: string; fontWeight?: number; lineHeight?: string };
    fonts: Font[];
    onToggle: () => void;
    onStyleChange: (field: keyof TypographyStyle, value: string | number) => void;
}

const StyleBlock: React.FC<StyleBlockProps> = ({
    label,
    shortLabel,
    expanded,
    style,
    fonts,
    onToggle,
    onStyleChange,
}) => (
    <div className="theme-card mb-4">
        <div
            className="p-5 flex items-center justify-between border-b theme-border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-slate-700" style={{ backgroundColor: 'var(--palette-surface)' }}>
                    {shortLabel}
                </div>
                <h4 className="font-semibold text-slate-900">{label}</h4>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>

        {expanded && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Font Family */}
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Font Family</span>
                    <div className="relative">
                        <select
                            value={style.fontFamily}
                            onChange={(e) => onStyleChange('fontFamily', e.target.value)}
                            className="theme-input appearance-none cursor-pointer"
                        >
                            <option>Manrope</option>
                            <option>Inter</option>
                            <option>System Default</option>
                            {fonts.map(f => (
                                <option key={f.id} value={f.name}>{f.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </label>

                {/* Size */}
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Size (rem)</span>
                    <div className="relative flex items-center">
                        <input
                            className="theme-input pr-12"
                            type="number"
                            step="0.1"
                            value={style.size}
                            onChange={(e) => onStyleChange('size', parseFloat(e.target.value) || 1)}
                        />
                        <span className="absolute right-4 text-sm text-slate-500 font-medium">rem</span>
                    </div>
                </label>

                {/* Font Weight */}
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Font Weight</span>
                    <div className="relative flex items-center">
                        <input
                            className="theme-input pr-12"
                            type="number"
                            min="100"
                            max="900"
                            step="100"
                            value={style.fontWeight || 400}
                            onChange={(e) => onStyleChange('fontWeight', parseInt(e.target.value) || 400)}
                        />
                        <span className="absolute right-4 text-sm text-slate-500 font-medium">wght</span>
                    </div>
                </label>

                {/* Line Height */}
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Line Height</span>
                    <div className="relative flex items-center">
                        <input
                            className="theme-input pr-12"
                            type="number"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={style.lineHeight || '1.5'}
                            onChange={(e) => onStyleChange('lineHeight', e.target.value)}
                        />
                        <span className="absolute right-4 text-sm text-slate-500 font-medium">lh</span>
                    </div>
                </label>

                {/* Color */}
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Color</span>
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer shrink-0">
                            <input
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                type="color"
                                value={style.color}
                                onChange={(e) => onStyleChange('color', e.target.value)}
                            />
                            <div className="w-10 h-10 rounded border-2 theme-border shadow-sm" style={{ backgroundColor: style.color }}></div>
                        </div>
                        <div className="flex-1 relative">
                            <input
                                className="theme-input uppercase text-sm font-mono pr-10"
                                type="text"
                                value={style.color}
                                onChange={(e) => onStyleChange('color', e.target.value)}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <Palette className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);

export const TypographyEditor: React.FC<TypographyEditorProps> = ({
    styles,
    onStyleChange,
    onFontUploaded,
    onFontDeleted,
}) => {
    const [expandedBlocks, setExpandedBlocks] = React.useState<Record<string, boolean>>({
        h1: true,
        h2: false,
        h3: false,
        h4: false,
        h5: false,
        h6: false,
        p: false
    });

    const [installedFonts, setInstalledFonts] = React.useState<Font[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        fetchFonts();
    }, []);

    const fetchFonts = async () => {
        try {
            const response = await axios.get(`${API_URL}/fonts`);
            setInstalledFonts(response.data);
        } catch (error) {
            console.error("Error fetching fonts:", error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await axios.post(`${API_URL}/fonts/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            fetchFonts();
            onFontUploaded();
        } catch (error) {
            console.error("Error uploading font:", error);
            alert("Error uploading font. Ensure it's a valid font file.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteFont = async (font: Font) => {
        try {
            await axios.delete(`${API_URL}/fonts/${font.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            fetchFonts();
            onFontDeleted(font.id);
        } catch (error) {
            console.error("Error deleting font:", error);
            alert("Failed to delete font.");
        }
    };

    const toggleBlock = (block: string) => {
        setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
    };

    const injectedStyles = installedFonts.map(font => `
        @font-face {
            font-family: '${font.name}';
            src: url('${API_URL}${font.url}');
            font-display: swap;
        }
    `).join('\n');

    return (
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <style>{injectedStyles}</style>

            {/* Left Column: Controls */}
            <div className="lg:col-span-7 flex flex-col gap-8">
                {/* Font Manager */}
                <FontManager
                    installedFonts={installedFonts}
                    uploading={uploading}
                    fileInputRef={fileInputRef}
                    onFileUpload={handleFileUpload}
                    onFontDelete={handleDeleteFont}
                    getFontUsage={() => []}
                />

                {/* Typography Blocks */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Type className="w-5 h-5" /> Font Sizes & Colors
                    </h3>
                    <StyleBlock
                        label="Heading 1 (H1)"
                        shortLabel="H1"
                        expanded={expandedBlocks.h1}
                        style={styles.h1}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('h1')}
                        onStyleChange={(f, v) => onStyleChange('h1', f, v)}
                    />
                    <StyleBlock
                        label="Heading 2 (H2)"
                        shortLabel="H2"
                        expanded={expandedBlocks.h2}
                        style={styles.h2}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('h2')}
                        onStyleChange={(f, v) => onStyleChange('h2', f, v)}
                    />
                    <StyleBlock
                        label="Heading 3 (H3)"
                        shortLabel="H3"
                        expanded={expandedBlocks.h3}
                        style={styles.h3}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('h3')}
                        onStyleChange={(f, v) => onStyleChange('h3', f, v)}
                    />
                    <StyleBlock
                        label="Heading 4 (H4)"
                        shortLabel="H4"
                        expanded={expandedBlocks.h4}
                        style={styles.h4}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('h4')}
                        onStyleChange={(f, v) => onStyleChange('h4', f, v)}
                    />
                    <StyleBlock
                        label="Heading 5 (H5)"
                        shortLabel="H5"
                        expanded={expandedBlocks.h5}
                        style={styles.h5}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('h5')}
                        onStyleChange={(f, v) => onStyleChange('h5', f, v)}
                    />
                    <StyleBlock
                        label="Heading 6 (H6)"
                        shortLabel="H6"
                        expanded={expandedBlocks.h6}
                        style={styles.h6}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('h6')}
                        onStyleChange={(f, v) => onStyleChange('h6', f, v)}
                    />
                    <StyleBlock
                        label="Paragraph (p)"
                        shortLabel="P"
                        expanded={expandedBlocks.p}
                        style={styles.p}
                        fonts={installedFonts}
                        onToggle={() => toggleBlock('p')}
                        onStyleChange={(f, v) => onStyleChange('p', f, v)}
                    />
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="lg:col-span-5">
                <div className="sticky top-24 flex flex-col gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Type className="w-5 h-5" /> Preview
                    </h3>

                    <div className="theme-card flex flex-col gap-6" style={{ minHeight: '500px' }}>
                        <div style={{
                            fontFamily: styles.h1.fontFamily,
                            fontSize: `${styles.h1.size}rem`,
                            color: styles.h1.color,
                            fontWeight: styles.h1.fontWeight || 400,
                            lineHeight: styles.h1.lineHeight || 1.2
                        }}>
                            Example Heading (H1)
                        </div>

                        <div style={{
                            fontFamily: styles.h2.fontFamily,
                            fontSize: `${styles.h2.size}rem`,
                            color: styles.h2.color,
                            fontWeight: styles.h2.fontWeight || 400,
                            lineHeight: styles.h2.lineHeight || 1.2
                        }}>
                            Example Subheading (H2)
                        </div>

                        <div style={{
                            fontFamily: styles.h3.fontFamily,
                            fontSize: `${styles.h3.size}rem`,
                            color: styles.h3.color,
                            fontWeight: styles.h3.fontWeight || 400,
                            lineHeight: styles.h3.lineHeight || 1.3
                        }}>
                            Section Header (H3)
                        </div>

                        <div style={{
                            fontFamily: styles.h4.fontFamily,
                            fontSize: `${styles.h4.size}rem`,
                            color: styles.h4.color,
                            fontWeight: styles.h4.fontWeight || 400,
                            lineHeight: styles.h4.lineHeight || 1.4
                        }}>
                            Minor Header (H4)
                        </div>

                        <div style={{
                            fontFamily: styles.h5.fontFamily,
                            fontSize: `${styles.h5.size}rem`,
                            color: styles.h5.color,
                            fontWeight: styles.h5.fontWeight || 400,
                            lineHeight: styles.h5.lineHeight || 1.4
                        }}>
                            Card Title (H5)
                        </div>

                        <div style={{
                            fontFamily: styles.h6.fontFamily,
                            fontSize: `${styles.h6.size}rem`,
                            color: styles.h6.color,
                            fontWeight: styles.h6.fontWeight || 400,
                            lineHeight: styles.h6.lineHeight || 1.5
                        }}>
                            Highlight Tag (H6)
                        </div>

                        <div style={{
                            fontFamily: styles.p.fontFamily,
                            fontSize: `${styles.p.size}rem`,
                            color: styles.p.color,
                            fontWeight: styles.p.fontWeight || 400,
                            lineHeight: styles.p.lineHeight || 1.6,
                            marginTop: '1rem'
                        }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </div>

                        <div className="mt-4">
                            <button
                                className="theme-button theme-button-primary"
                            >
                                Example Button
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
