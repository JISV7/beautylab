import React from 'react';
import { Type, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import type { TypographyEditorProps, TypographyStyle } from './types';
import type { Font } from '../../data/theme.types';

interface StyleBlockProps {
    label: string;
    shortLabel: string;
    expanded: boolean;
    style: { fontFamily: string; size: number; color: string; fontWeight?: number; lineHeight?: string };
    fonts: Font[];
    onToggle: () => void;
    onStyleChange: (field: keyof TypographyStyle, value: string | number) => void;
    validationErrors?: string[];
    currentElement?: string;
}

const StyleBlock: React.FC<StyleBlockProps> = ({
    label,
    shortLabel,
    expanded,
    style,
    fonts,
    onToggle,
    onStyleChange,
    validationErrors = [],
    currentElement = '',
}) => {
    // Check if current element has validation errors and extract minimum required size
    const elementError = validationErrors.find(err => err.startsWith(currentElement.toUpperCase()));
    const minSizeMatch = elementError?.match(/Minimum required: ([\d.]+)rem/);
    const minRequired = minSizeMatch ? parseFloat(minSizeMatch[1]) : null;
    const hasError = !!elementError;

    return (
    <div className="theme-card mb-4">
        <div
            className="p-5 flex items-center justify-between border-b palette-border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            onClick={onToggle}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded flex items-center justify-center text-h4-font text-h4-size text-h4-color text-h4-weight"
                    style={{ backgroundColor: 'var(--palette-surface)' }}
                >
                    {shortLabel}
                </div>
                <h4 className="text-h4-font text-h4-size text-h4-color text-h4-weight">
                    {label}
                </h4>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>

        {expanded && (
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Font Family */}
                <label className="flex flex-col gap-2 min-w-0">
                    <span className="text-p-font text-p-size text-p-color text-p-weight">
                        Font Family
                    </span>
                    <div className="relative">
                        <select
                            value={style.fontFamily}
                            onChange={(e) => {
                                // Find the selected font object to get its ID
                                const selectedFont = fonts.find(f => f.name === e.target.value);
                                if (selectedFont) {
                                    onStyleChange('fontFamily', e.target.value);
                                    onStyleChange('fontId', selectedFont.id);
                                }
                            }}
                            className="theme-input appearance-none cursor-pointer w-full"
                        >
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
                <label className="flex flex-col gap-2 min-w-0">
                    <span className="text-p-font text-p-size text-p-color text-p-weight">
                        Size (rem)
                    </span>
                    <div className="relative flex items-center">
                        <input
                            className={`pr-12 w-full theme-input ${
                                hasError ? 'border-red-500 focus:ring-red-500' : ''
                            }`}
                            type="number"
                            step="0.1"
                            value={style.size}
                            onChange={(e) => onStyleChange('size', parseFloat(e.target.value) || 1)}
                            min={minRequired || 0}
                        />
                        <span className={`absolute right-4 text-sm font-medium ${
                            hasError ? 'text-red-500' : 'text-slate-500'
                        }`}>rem</span>
                    </div>
                    {hasError && minRequired && (
                        <span className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Minimum required: {minRequired.toFixed(3)}rem
                        </span>
                    )}
                </label>

                {/* Font Weight */}
                <label className="flex flex-col gap-2 min-w-0">
                    <span className="text-p-font text-p-size text-p-color text-p-weight">
                        Font Weight
                    </span>
                    <div className="relative flex items-center">
                        <input
                            className="theme-input pr-12 w-full"
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
                <label className="flex flex-col gap-2 min-w-0">
                    <span className="text-p-font text-p-size text-p-color text-p-weight">
                        Line Height
                    </span>
                    <div className="relative flex items-center">
                        <input
                            className="theme-input pr-12 w-full"
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
                <div className="flex flex-col gap-2 min-w-0">
                    <span className="text-p-font text-p-size text-p-color text-p-weight">
                        Color
                    </span>
                    <div className="flex items-center gap-3 w-full">
                        <div className="relative group cursor-pointer shrink-0">
                            <input
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                type="color"
                                value={style.color}
                                onChange={(e) => onStyleChange('color', e.target.value)}
                            />
                            <div className="w-10 h-10 rounded border-2 palette-border shadow-sm" style={{ backgroundColor: style.color }}></div>
                        </div>
                        <div className="flex-1 relative min-w-0">
                            <input
                                className="theme-input uppercase text-sm font-mono pr-10 w-full"
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
};

const toggleBlock = (
    block: string,
    setExpandedBlocks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) => {
    setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
};

export const TypographyEditor: React.FC<TypographyEditorProps & {
    validationErrors?: string[];
}> = ({
    styles,
    colors,
    fonts,
    onStyleChange,
    validationErrors = [],
}) => {
    const [expandedBlocks, setExpandedBlocks] = React.useState<Record<string, boolean>>({
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true,
        p: true
    });

    return (
        <>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Typography Controls */}
            <div className="lg:col-span-8 flex flex-col gap-3">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Type className="w-5 h-5" /> Font Sizes & Colors
                </h3>
                <StyleBlock
                    label="Heading 1 (H1)"
                    shortLabel="H1"
                    expanded={expandedBlocks.h1}
                    style={styles.h1}
                    fonts={fonts}
                    onToggle={() => toggleBlock('h1', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('h1', f, v)}
                    validationErrors={validationErrors}
                    currentElement="h1"
                />
                <StyleBlock
                    label="Heading 2 (H2)"
                    shortLabel="H2"
                    expanded={expandedBlocks.h2}
                    style={styles.h2}
                    fonts={fonts}
                    onToggle={() => toggleBlock('h2', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('h2', f, v)}
                    validationErrors={validationErrors}
                    currentElement="h2"
                />
                <StyleBlock
                    label="Heading 3 (H3)"
                    shortLabel="H3"
                    expanded={expandedBlocks.h3}
                    style={styles.h3}
                    fonts={fonts}
                    onToggle={() => toggleBlock('h3', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('h3', f, v)}
                    validationErrors={validationErrors}
                    currentElement="h3"
                />
                <StyleBlock
                    label="Heading 4 (H4)"
                    shortLabel="H4"
                    expanded={expandedBlocks.h4}
                    style={styles.h4}
                    fonts={fonts}
                    onToggle={() => toggleBlock('h4', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('h4', f, v)}
                    validationErrors={validationErrors}
                    currentElement="h4"
                />
                <StyleBlock
                    label="Heading 5 (H5)"
                    shortLabel="H5"
                    expanded={expandedBlocks.h5}
                    style={styles.h5}
                    fonts={fonts}
                    onToggle={() => toggleBlock('h5', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('h5', f, v)}
                    validationErrors={validationErrors}
                    currentElement="h5"
                />
                <StyleBlock
                    label="Heading 6 (H6)"
                    shortLabel="H6"
                    expanded={expandedBlocks.h6}
                    style={styles.h6}
                    fonts={fonts}
                    onToggle={() => toggleBlock('h6', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('h6', f, v)}
                    validationErrors={validationErrors}
                    currentElement="h6"
                />
                <StyleBlock
                    label="Paragraph (p)"
                    shortLabel="P"
                    expanded={expandedBlocks.p}
                    style={styles.p}
                    fonts={fonts}
                    onToggle={() => toggleBlock('p', setExpandedBlocks)}
                    onStyleChange={(f, v) => onStyleChange('p', f, v)}
                    validationErrors={validationErrors}
                    currentElement="p"
                />
            </div>

            {/* Right Column: Live Preview */}
            <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-24 flex flex-col gap-4">
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

                        <div
                            style={{
                                fontFamily: styles.p.fontFamily,
                                fontSize: `${styles.p.size}rem`,
                                color: styles.p.color,
                                fontWeight: styles.p.fontWeight,
                                lineHeight: styles.p.lineHeight,
                                marginTop: '1rem'
                            }}
                        >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </div>

                        <div className="mt-4">
                            <button
                                className="theme-button"
                                style={{
                                    backgroundColor: colors.primary,
                                    color: colors.decorator,
                                    fontFamily: styles.p.fontFamily,
                                    fontSize: `${styles.p.size}rem`,
                                    fontWeight: styles.p.fontWeight,
                                    lineHeight: styles.p.lineHeight
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.accent;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.primary;
                                }}
                            >
                                Example Button
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
