import React, { useState, useEffect, useRef } from 'react';
import { Save, Type, UploadCloud, Trash2, ChevronDown, ChevronUp, Palette, Loader2 } from 'lucide-react';
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

    const [expandedH1, setExpandedH1] = useState(true);
    const [expandedP, setExpandedP] = useState(true);

    const [h1Style, setH1Style] = useState({
        fontFamily: activeModeData.typography.title.fontFamily || 'Manrope',
        size: parseFloat(activeModeData.typography.title.fontSize) || 2.5,
        color: (activeModeData.typography.title as any).color || activeModeData.colors.text
    });

    const [pStyle, setPStyle] = useState({
        fontFamily: activeModeData.typography.paragraph.fontFamily || 'Manrope',
        size: parseFloat(activeModeData.typography.paragraph.fontSize) || 1.0,
        color: (activeModeData.typography.paragraph as any).color || activeModeData.colors.textSecondary
    });

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

    const handleDeleteFont = async (id: string) => {
        if (!confirm("Are you sure you want to delete this font?")) return;
        try {
            await axios.delete(`${API_URL}/fonts/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            fetchFonts();
        } catch (error) {
            console.error("Error deleting font:", error);
        }
    };

    const handleSave = () => {
        const currentCustom = getCustomTheme() || {};

        const updatedModeData = {
            ...activeModeData,
            typography: {
                ...activeModeData.typography,
                title: {
                    ...activeModeData.typography.title,
                    fontFamily: h1Style.fontFamily,
                    fontSize: `${h1Style.size}rem`,
                    color: h1Style.color
                },
                paragraph: {
                    ...activeModeData.typography.paragraph,
                    fontFamily: pStyle.fontFamily,
                    fontSize: `${pStyle.size}rem`,
                    color: pStyle.color
                }
            }
        };

        saveCustomTheme({
            ...currentCustom,
            [config.mode]: updatedModeData
        });

        alert("Typography saved to the Custom Theme!");
    };

    // Inject @font-face dynamically for installed fonts so they can be previewed/used
    const injectedStyles = installedFonts.map(font => `
        @font-face {
            font-family: '${font.name}';
            src: url('${API_URL}${font.url}');
            font-display: swap;
        }
    `).join('\n');

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
                <div className="max-w-4xl mx-auto flex flex-col gap-8">

                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black tracking-tight theme-text-base">Manage Typography</h1>
                        <p className="theme-text-secondary">Configure global fonts and specific styles for headings and paragraphs.</p>
                    </div>

                    <div className="rounded-xl border theme-border shadow-sm overflow-hidden" style={{ backgroundColor: '#fffafb' }}>
                        <div className="p-6 border-b theme-border">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Type className="w-5 h-5 text-blue-500" />
                                Font Manager
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                            <div className="flex flex-col gap-4">
                                <h4 className="text-sm font-semibold text-slate-700">Upload Custom Font</h4>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer" style={{ backgroundColor: '#fffafb' }}>
                                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm font-medium text-slate-700">Drag & drop font files here</p>
                                    <p className="text-xs text-slate-500 mt-1">Supports .ttf, .otf, .woff, .woff2</p>
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
                                        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Browse Files'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h4 className="text-sm font-semibold text-slate-700">Installed Fonts</h4>
                                <ul className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2">
                                    {installedFonts.map((font) => (
                                        <li key={font.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200" style={{ backgroundColor: '#fffafb' }}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold font-display text-slate-900" style={{ fontFamily: font.name }}>Ag</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{font.name}</p>
                                                    <p className="text-xs text-slate-500">Custom Font</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteFont(font.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                    {installedFonts.length === 0 && (
                                        <li className="p-4 text-center text-sm theme-text-secondary border border-dashed rounded-lg">
                                            No custom fonts installed yet.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold theme-text-base mt-4">Element Styles</h3>

                        {/* H1 Row */}
                        <div className="rounded-xl border theme-border shadow-sm overflow-hidden" style={{ backgroundColor: '#fffafb' }}>
                            <div
                                className="p-5 flex items-center justify-between border-b theme-border cursor-pointer hover:bg-black/5 transition-colors"
                                onClick={() => setExpandedH1(!expandedH1)}
                                style={{ backgroundColor: '#fffafb' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-slate-700" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>H1</div>
                                    <h4 className="font-semibold text-slate-900">Heading 1</h4>
                                </div>
                                {expandedH1 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expandedH1 && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-slate-700">Font Family</span>
                                        <div className="relative">
                                            <select
                                                value={h1Style.fontFamily}
                                                onChange={(e) => setH1Style({ ...h1Style, fontFamily: e.target.value })}
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
                                        <span className="text-sm font-semibold text-slate-700">Size</span>
                                        <div className="relative flex items-center">
                                            <input
                                                className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500"
                                                type="number"
                                                step="0.1"
                                                value={h1Style.size}
                                                onChange={(e) => setH1Style({ ...h1Style, size: parseFloat(e.target.value) || 1 })}
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
                                                    value={h1Style.color}
                                                    onChange={(e) => setH1Style({ ...h1Style, color: e.target.value })}
                                                />
                                                <div className="w-10 h-10 rounded border-2 border-slate-200 shadow-sm" style={{ backgroundColor: h1Style.color }}></div>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    className="w-full rounded-lg border-slate-200 text-slate-900 py-2 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 uppercase text-sm font-mono"
                                                    type="text"
                                                    value={h1Style.color}
                                                    onChange={(e) => setH1Style({ ...h1Style, color: e.target.value })}
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

                        {/* P Row */}
                        <div className="rounded-xl border theme-border shadow-sm overflow-hidden" style={{ backgroundColor: '#fffafb' }}>
                            <div
                                className="p-5 flex items-center justify-between border-b theme-border cursor-pointer hover:bg-black/5 transition-colors"
                                onClick={() => setExpandedP(!expandedP)}
                                style={{ backgroundColor: '#fffafb' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-slate-700" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>P</div>
                                    <h4 className="font-semibold text-slate-900">Paragraph</h4>
                                </div>
                                {expandedP ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expandedP && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-slate-700">Font Family</span>
                                        <div className="relative">
                                            <select
                                                value={pStyle.fontFamily}
                                                onChange={(e) => setPStyle({ ...pStyle, fontFamily: e.target.value })}
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
                                        <span className="text-sm font-semibold text-slate-700">Size</span>
                                        <div className="relative flex items-center">
                                            <input
                                                className="w-full rounded-lg border-slate-200 text-slate-900 py-2.5 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500"
                                                type="number"
                                                step="0.1"
                                                value={pStyle.size}
                                                onChange={(e) => setPStyle({ ...pStyle, size: parseFloat(e.target.value) || 1 })}
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
                                                    value={pStyle.color}
                                                    onChange={(e) => setPStyle({ ...pStyle, color: e.target.value })}
                                                />
                                                <div className="w-10 h-10 rounded border-2 border-slate-200 shadow-sm" style={{ backgroundColor: pStyle.color }}></div>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    className="w-full rounded-lg border-slate-200 text-slate-900 py-2 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 uppercase text-sm font-mono"
                                                    type="text"
                                                    value={pStyle.color}
                                                    onChange={(e) => setPStyle({ ...pStyle, color: e.target.value })}
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

                    </div>
                </div>
            </div>
        </div>
    );
};
