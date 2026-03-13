import React, { useState } from 'react';
import { UploadCloud, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { FontManagerProps } from './types';
import { FontDataTable } from './FontDataTable';

export const FontManager: React.FC<FontManagerProps> = ({
    installedFonts,
    uploading,
    fileInputRef,
    onFileUpload,
    onFontDelete,
}) => {
    const [isUploadExpanded, setIsUploadExpanded] = useState(true);
    const [isTableExpanded, setIsTableExpanded] = useState(true);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(
            file => file.name.endsWith('.ttf') || file.name.endsWith('.otf') || 
                    file.name.endsWith('.woff') || file.name.endsWith('.woff2')
        );
        
        if (files.length === 0) {
            alert('Please upload valid font files (.ttf, .otf, .woff, .woff2)');
            return;
        }
        
        // Create a mock event with multiple files
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        const event = { target: { files: dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileUpload(event);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="theme-card">
                <div
                    className="p-6 border-b palette-border flex items-center justify-between cursor-pointer"
                    onClick={() => setIsUploadExpanded(!isUploadExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <UploadCloud className="w-5 h-5" style={{ color: 'var(--decorator-color)' }} />
                        <h3 className="text-lg font-bold">Upload Fonts</h3>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-sm">{installedFonts.length} fonts installed</span>
                        {isUploadExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
                {isUploadExpanded && (
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
                                Upload multiple fonts at once<br />
                                Supported formats: .ttf, .otf, .woff, .woff2
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileUpload}
                                className="hidden"
                                accept=".ttf,.otf,.woff,.woff2"
                                multiple
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
                )}
            </div>

            {/* Font DataTable */}
            <div className="theme-card">
                <div
                    className="p-6 border-b palette-border flex items-center justify-between cursor-pointer"
                    onClick={() => setIsTableExpanded(!isTableExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">Installed Fonts</h3>
                    </div>
                    {isTableExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
                {isTableExpanded && (
                    <FontDataTable
                        fonts={installedFonts}
                        onDelete={onFontDelete}
                    />
                )}
            </div>
        </div>
    );
};
