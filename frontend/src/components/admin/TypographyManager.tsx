import React, { useState, useEffect, useRef } from 'react';
import { Save, Type, UploadCloud, Trash2, ChevronDown, ChevronUp, Palette, Loader2, Eye } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';

const API_URL = 'http://localhost:8000';

interface Font {
    id: string;
    name: string;
    filename: string;
    url: string;
    created_at: string;
}

export const TypographyManager: React.FC = () => {
    const { config, themeData, getCustomTheme, saveCustomTheme } = useTheme();
    const customTheme = getCustomTheme();
    const activeModeData = customTheme?.[config.mode] || themeData[config.mode];

    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
        h1: true,
        h2: false,
        h3: false,
        h4: false,
        h5: false,
        h6: false,
        p: false
    });

    const toggleBlock = (block: string) => {
        setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
    };

    // Helper to extract nested typography safely
    const getInitialStyle = (key: string, defaultSize: number, defaultFont: string = 'Manrope') => {
        const typoConfig = activeModeData.typography[key as keyof typeof activeModeData.typography] as any;
        return {
            fontFamily: typoConfig?.fontFamily || activeModeData.typography.title?.fontFamily || defaultFont,
            size: parseFloat(typoConfig?.fontSize) || defaultSize,
            color: typoConfig?.color || (key === 'paragraph' ? activeModeData.colors.textSecondary : activeModeData.colors.text)
        };
    };

    const [styles, setStyles] = useState({
        h1: getInitialStyle('h1', 2.5),
        h2: getInitialStyle('h2', 2.0),
        h3: getInitialStyle('h3', 1.75),
        h4: getInitialStyle('h4', 1.5),
        h5: getInitialStyle('h5', 1.25),
        h6: getInitialStyle('h6', 1.0),
        p: getInitialStyle('paragraph', 1.0)
    });

    const updateStyle = (key: keyof typeof styles, field: string, value: string | number) => {
        setStyles(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const [installedFonts, setInstalledFonts] = useState<Font[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
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
        // Validation: Verify if the font is currently in use across any style
        const isUsed = Object.values(styles).some(style => style.fontFamily === font.name);
        
        if (isUsed) {
            alert(`Cannot delete '${font.name}' because it is currently in use by your typography settings. Please assign a different font to those text elements before deleting it.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the font "${font.name}"?`)) return;
        try {
            await axios.delete(`${API_URL}/fonts/${font.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            fetchFonts();
        } catch (error) {
            console.error("Error deleting font:", error);
            alert("Failed to delete font. It may be locked or you might not have the correct permissions.");
        }
    };

    const handleSave = () => {
        const currentCustom = getCustomTheme() || {};

        const updatedModeData = {
            ...activeModeData,
            typography: {
                ...activeModeData.typography,
                title: { ...activeModeData.typography.title, fontFamily: styles.h1.fontFamily, fontSize: `${styles.h1.size}rem`, color: styles.h1.color },
                h1: { fontFamily: styles.h1.fontFamily, fontSize: `${styles.h1.size}rem`, color: styles.h1.color },
                h2: { fontFamily: styles.h2.fontFamily, fontSize: `${styles.h2.size}rem`, color: styles.h2.color },
                h3: { fontFamily: styles.h3.fontFamily, fontSize: `${styles.h3.size}rem`, color: styles.h3.color },
                h4: { fontFamily: styles.h4.fontFamily, fontSize: `${styles.h4.size}rem`, color: styles.h4.color },
                h5: { fontFamily: styles.h5.fontFamily, fontSize: `${styles.h5.size}rem`, color: styles.h5.color },
                h6: { fontFamily: styles.h6.fontFamily, fontSize: `${styles.h6.size}rem`, color: styles.h6.color },
                paragraph: {
                    ...activeModeData.typography.paragraph,
                    fontFamily: styles.p.fontFamily,
                    fontSize: `${styles.p.size}rem`,
                    color: styles.p.color
                }
            }
        };

        saveCustomTheme({
            ...currentCustom,
            [config.mode]: updatedModeData
        });

        alert("Typography saved to the Custom Theme!");
    };

    const injectedStyles = installedFonts.map(font => `
        @font-face {
            font-family: '${font.name}';
            src: url('${API_URL}${font.url}');
            font-display: swap;
        }
    `).join('\n');

    const renderStyleBlock = (key: keyof typeof styles, label: string, shortLabel: string) => (
        <div key={key} className="rounded-xl border theme-border shadow-sm overflow-hidden mb-4" style={{ backgroundColor: '#fffafb' }}>
            <div
                className="p-5 flex items-center justify-between border-b theme-border cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => toggleBlock(key)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-slate-700" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>{shortLabel}</div>
                    <h4 className="font-semibold text-slate-900">{label}</h4>
                </div>
                {expandedBlocks[key] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>

            {expandedBlocks[key] && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">Font Family</span>
                        <div className="relative">
                            <select
                                value={styles[key].fontFamily}
                                onChange={(e) => updateStyle(key, 'fontFamily', e.target.value)}
                                className="w-full appearance-none rounded-lg border-slate-200 text-slate-900 py-2.5 pl-4 pr-10 focus:border-blue-500 focus:ring-blue-500" style={{ backgroundColor: '#fffafb' }}>
                                <option>Manrope</option>
                                <option>Inter</option>
                                <option>System Default</option>
                                {installedFonts.map(f => (
                                    <option key={f.id} value={f.name}>{f.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">Size (rem)</span>
                        <div className="relative flex items-center">
                            <input
                                className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500"
                                type="number"
                                step="0.1"
                                value={styles[key].size}
                                onChange={(e) => updateStyle(key, 'size', parseFloat(e.target.value) || 1)}
                                style={{ backgroundColor: '#fffafb' }}
                            />
                            <span className="absolute right-4 text-sm text-slate-500 font-medium">rem</span>
                        </div>
                    </label>

                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-700">Color</span>
                        <div className="flex items-center gap-3">
                            <div className="relative group cursor-pointer shrink-0">
                                <input
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                    type="color"
                                    value={styles[key].color}
                                    onChange={(e) => updateStyle(key, 'color', e.target.value)}
                                />
                                <div className="w-10 h-10 rounded border-2 border-slate-200 shadow-sm" style={{ backgroundColor: styles[key].color }}></div>
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    className="w-full rounded-lg border-slate-200 text-slate-900 py-2 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 uppercase text-sm font-mono"
                                    type="text"
                                    value={styles[key].color}
                                    onChange={(e) => updateStyle(key, 'color', e.target.value)}
                                    style={{ backgroundColor: '#fffafb' }}
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-background">
            <style>{injectedStyles}</style>
            <header className="h-16 theme-surface border-b theme-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Typography Settings</h2>
                <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm font-medium theme-text-secondary rounded-lg border theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Discard</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white theme-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Controls */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-black tracking-tight theme-text-base">Typography Configurator</h1>
                            <p className="theme-text-secondary">Upload custom fonts and configure sizes for each text level.</p>
                        </div>

                        {/* Font Manager */}
                        <div className="rounded-xl border theme-border shadow-sm overflow-hidden" style={{ backgroundColor: '#fffafb' }}>
                            <div className="p-6 border-b theme-border">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5 text-blue-500" />
                                    Upload Fonts
                                </h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-4">
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px]" style={{ backgroundColor: '#fffafb' }}>
                                        <p className="text-sm font-medium text-slate-700">Drag and drop your font (.ttf, .otf)</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept=".ttf,.otf,.woff,.woff2"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                                            style={{ backgroundColor: '#fffafb' }}
                                        >
                                            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Select file'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h4 className="text-sm font-semibold text-slate-700">Installed Fonts</h4>
                                    <ul className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2">
                                        {installedFonts.map((font) => (
                                            <li key={font.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200" style={{ backgroundColor: '#fffafb' }}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold font-display text-slate-900" style={{ fontFamily: font.name }}>Ag</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{font.name}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteFont(font)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                        {installedFonts.length === 0 && (
                                            <li className="p-4 text-center text-sm theme-text-secondary border border-dashed rounded-lg">
                                                No fonts installed.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Typography Sizes */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-bold theme-text-base mt-2 flex items-center gap-2">
                                <Type className="w-5 h-5 text-slate-700" /> Font Sizes
                            </h3>
                            {renderStyleBlock('h1', 'Heading 1 (H1)', 'H1')}
                            {renderStyleBlock('h2', 'Heading 2 (H2)', 'H2')}
                            {renderStyleBlock('h3', 'Heading 3 (H3)', 'H3')}
                            {renderStyleBlock('h4', 'Heading 4 (H4)', 'H4')}
                            {renderStyleBlock('h5', 'Heading 5 (H5)', 'H5')}
                            {renderStyleBlock('h6', 'Heading 6 (H6)', 'H6')}
                            {renderStyleBlock('p', 'Paragraph (p)', 'P')}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Live Preview */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 flex flex-col gap-4">
                            <h3 className="text-xl font-bold theme-text-base flex items-center gap-2">
                                <Eye className="w-5 h-5 text-slate-700" /> Preview
                            </h3>
                            
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm flex flex-col gap-6" style={{ minHeight: '500px' }}>
                                <div style={{ 
                                    fontFamily: styles.h1.fontFamily, 
                                    fontSize: `${styles.h1.size}rem`, 
                                    color: styles.h1.color,
                                    fontWeight: 800,
                                    lineHeight: 1.2
                                }}>
                                    Example Heading (H1)
                                </div>

                                <div style={{ 
                                    fontFamily: styles.h2.fontFamily, 
                                    fontSize: `${styles.h2.size}rem`, 
                                    color: styles.h2.color,
                                    fontWeight: 700,
                                    lineHeight: 1.2
                                }}>
                                    Example Subheading (H2)
                                </div>

                                <div style={{ 
                                    fontFamily: styles.h3.fontFamily, 
                                    fontSize: `${styles.h3.size}rem`, 
                                    color: styles.h3.color,
                                    fontWeight: 600,
                                    lineHeight: 1.3
                                }}>
                                    Section Header (H3)
                                </div>

                                <div style={{ 
                                    fontFamily: styles.h4.fontFamily, 
                                    fontSize: `${styles.h4.size}rem`, 
                                    color: styles.h4.color,
                                    fontWeight: 600,
                                    lineHeight: 1.4
                                }}>
                                    Minor Header (H4)
                                </div>

                                <div style={{ 
                                    fontFamily: styles.h5.fontFamily, 
                                    fontSize: `${styles.h5.size}rem`, 
                                    color: styles.h5.color,
                                    fontWeight: 600,
                                    lineHeight: 1.4
                                }}>
                                    Card Title (H5)
                                </div>

                                <div style={{ 
                                    fontFamily: styles.h6.fontFamily, 
                                    fontSize: `${styles.h6.size}rem`, 
                                    color: styles.h6.color,
                                    fontWeight: 600,
                                    lineHeight: 1.5
                                }}>
                                    Highlight Tag (H6)
                                </div>

                                <div style={{ 
                                    fontFamily: styles.p.fontFamily, 
                                    fontSize: `${styles.p.size}rem`, 
                                    color: styles.p.color,
                                    lineHeight: 1.6,
                                    marginTop: '1rem'
                                }}>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                                </div>

                                <div className="mt-4">
                                    <button 
                                        className="px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                                        style={{ 
                                            backgroundColor: activeModeData.colors.primary,
                                            fontFamily: styles.p.fontFamily,
                                            fontSize: `${styles.p.size}rem`
                                        }}
                                    >
                                        Example Button
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
