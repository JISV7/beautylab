import React from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import type { FontManagerProps } from './types';
import { FontDataTable } from './FontDataTable';

export const FontManager: React.FC<FontManagerProps> = ({
    installedFonts,
    uploading,
    fileInputRef,
    onFileUpload,
    onFontDelete,
    getFontUsage,
}) => {
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.ttf') || file.name.endsWith('.otf') || file.name.endsWith('.woff') || file.name.endsWith('.woff2'))) {
            const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            onFileUpload(event);
        } else {
            alert('Please upload a valid font file (.ttf, .otf, .woff, .woff2)');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="theme-card">
                <div className="p-6 border-b palette-border">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <UploadCloud className="w-5 h-5" style={{ color: 'var(--decorator-color)' }} />
                        Upload Fonts
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Upload custom fonts to use in your theme typography
                    </p>
                </div>
                <div className="p-6">
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed palette-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer min-h-[180px]"
                    >
                        <UploadCloud className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-base font-medium text-p-color mb-2">
                            Drag and drop your font files here
                        </p>
                        <p className="text-sm text-slate-500 mb-4">
                            Supported formats: .ttf, .otf, .woff, .woff2
                        </p>
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
                            className="px-6 py-2.5 text-sm font-medium text-white theme-button-primary rounded-lg shadow-sm transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                            ) : (
                                'Browse Files'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Font DataTable */}
            <FontDataTable
                fonts={installedFonts}
                onDelete={onFontDelete}
                getFontUsage={getFontUsage}
            />
        </div>
    );
};
