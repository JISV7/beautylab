import React from 'react';
import { Eye, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type PaletteMode = 'light' | 'dark' | 'accessibility';

interface ThemeModeToggleProps {
    compact?: boolean;
    className?: string;
}

const MODES: Array<{
    mode: PaletteMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
    { mode: 'light', label: 'Activar modo claro', icon: Sun },
    { mode: 'dark', label: 'Activar modo oscuro', icon: Moon },
    { mode: 'accessibility', label: 'Activar modo accesible', icon: Eye },
];

export const ThemeModeToggle: React.FC<ThemeModeToggleProps> = ({
    compact = false,
    className = '',
}) => {
    const { currentMode, setPaletteMode } = useTheme();
    const buttonSize = compact ? 'w-9 h-9' : 'w-10 h-10';

    return (
        <div
            className={`flex items-center gap-1 rounded-lg ${className}`}
            role="group"
            aria-label="Selector de modo de color"
        >
            {MODES.map(({ mode, label, icon: Icon }) => {
                const isActive = currentMode === mode;
                return (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => setPaletteMode(mode)}
                        className={`${buttonSize} inline-flex items-center justify-center rounded-lg transition-colors ${
                            isActive
                                ? 'bg-palette-primary text-on-primary'
                                : 'text-paragraph hover:bg-palette-border'
                        }`}
                        title={label}
                        aria-label={label}
                        aria-pressed={isActive}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
};
