import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface ThemePreviewProps {
    previewMode?: 'desktop' | 'mobile';
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
    previewMode = 'desktop',
}) => {
    const [mode, setMode] = React.useState<'desktop' | 'mobile'>(previewMode);

    return (
        <div className="admin-editor-panel sticky top-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold theme-text-base">Live Preview</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('desktop')}
                        className={`p-2 rounded-lg transition-colors ${
                            mode === 'desktop'
                                ? 'theme-primary text-white'
                                : 'theme-text-secondary hover:bg-[var(--theme-border-value)]'
                        }`}
                        title="Desktop View"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setMode('mobile')}
                        className={`p-2 rounded-lg transition-colors ${
                            mode === 'mobile'
                                ? 'theme-primary text-white'
                                : 'theme-text-secondary hover:bg-[var(--theme-border-value)]'
                        }`}
                        title="Mobile View"
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Preview Frame */}
            <div className="admin-preview-frame">
                <div
                    className={`
                        theme-background transition-all duration-300
                        ${mode === 'desktop' ? 'w-full' : 'w-[375px] mx-auto'}
                    `}
                >
                    {/* Preview Header */}
                    <div className="theme-surface border-b theme-border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg theme-primary" />
                                <span className="font-bold theme-text-base">Codyn</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full theme-primary/20" />
                                <div className="w-8 h-8 rounded-full theme-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Preview Hero */}
                    <div className="p-6">
                        <div className="theme-primary rounded-xl p-6 mb-4">
                            <p className="text-white/80 text-sm mb-2">Welcome back</p>
                            <h2 className="text-white text-xl font-bold mb-4">Continue Learning</h2>
                            <button className="theme-surface theme-primary text-sm font-semibold px-4 py-2 rounded-lg">
                                Continue
                            </button>
                        </div>

                        {/* Preview Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="theme-surface theme-border rounded-lg p-3">
                                <p className="text-xs theme-text-secondary">Streak</p>
                                <p className="text-lg font-bold theme-primary">7 days</p>
                            </div>
                            <div className="theme-surface theme-border rounded-lg p-3">
                                <p className="text-xs theme-text-secondary">XP</p>
                                <p className="text-lg font-bold theme-primary">2,450</p>
                            </div>
                        </div>

                        {/* Preview Course Card */}
                        <div className="theme-surface theme-border rounded-lg p-4">
                            <div className="theme-border rounded-full h-2 mb-2">
                                <div className="theme-primary h-2 rounded-full" style={{ width: '45%' }} />
                            </div>
                            <p className="text-xs theme-text-secondary">Web Development - 45%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Info */}
            <div className="mt-4 p-3 theme-surface theme-border rounded-lg">
                <p className="text-xs theme-text-secondary">
                    <strong>Tip:</strong> Changes are applied in real-time. Click "Save Theme" to persist your changes.
                </p>
            </div>
        </div>
    );
};
