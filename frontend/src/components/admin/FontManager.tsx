import React from 'react';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import type { FontManagerProps } from './types';
import type { Font } from '../../data/theme.types';

export const FontManager: React.FC<FontManagerProps> = ({
    installedFonts,
    uploading,
    fileInputRef,
    onFileUpload,
    onFontDelete,
    getFontUsage,
}) => {
    const handleDeleteFont = (font: Font) => {
        const usage = getFontUsage(font.name);

        if (usage.length > 0) {
            const usageText = usage.map(u =>
                `${u.theme} (${u.elements.join(', ')})`
            ).join('; ');
            alert(`Cannot delete '${font.name}' because it is being used in:\n${usageText}\n\nPlease change the typography settings in those themes before deleting this font.`);
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the font "${font.name}"?`)) return;
        onFontDelete(font);
    };

    return (
        <div className="rounded-xl border theme-border shadow-sm overflow-hidden" style={{ backgroundColor: '#fffafb' }}>
            <div className="p-6 border-b theme-border">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-blue-500" style={{ color: 'var(--decorator-color)' }} />
                    Upload Fonts
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Area */}
                <div className="flex flex-col gap-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px]" style={{ backgroundColor: '#fffafb' }}>
                        <p className="text-sm font-medium text-slate-700">Drag and drop your font (.ttf, .otf)</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileUpload}
                            className="hidden"
                            accept=".ttf,.otf,.woff,.woff2"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                            style={{ backgroundColor: '#fffafb' }}
                        >
                            {uploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                            ) : (
                                'Select file'
                            )}
                        </button>
                    </div>
                </div>

                {/* Installed Fonts List */}
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
                                <button
                                    onClick={() => handleDeleteFont(font)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" style={{ color: 'var(--decorator-color)' }} />
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
    );
};
