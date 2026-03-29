import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, Eye, Code2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserMenu } from './UserMenu';

interface DashboardHeaderProps {
    onNavigate?: (page: string) => void;
    onNavigateToAdmin?: () => void;
    onLogout?: () => void;
    onMenuToggle?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNavigate, onNavigateToAdmin, onLogout, onMenuToggle }) => {
    const { user, logout: authLogout } = useAuth();
    const { currentMode, setPaletteMode } = useTheme();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const handleLogout = () => {
        authLogout();  // Clear tokens
        onLogout?.();  // Navigate to home
    };

    return (
        <header className="dashboard-header palette-surface z-40 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 border-b border-[var(--palette-border)]">
            {/* Left Side: Hamburger + Logo + Search */}
            <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                {/* Mobile Hamburger Menu */}
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 rounded-lg text-[var(--text-p-color)] hover:bg-[var(--palette-border)] transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Logo */}
                <a href="/" className="flex items-center gap-2 flex-shrink-0">
                    <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: '#F83A3A' }}
                    >
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-h4-font text-h4-size text-h4-color text-h4-weight font-bold hidden sm:inline">Codyn</span>
                </a>

                {/* Search Bar */}
                <div className="flex-1 min-w-0 max-w-xs sm:max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-p-color" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg palette-surface palette-border border text-p-color placeholder-[var(--palette-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPaletteMode('light')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'light'
                                ? 'palette-primary'
                                : 'bg-transparent'
                            }`}
                        title="Light Mode"
                    >
                        <Sun className="w-5 h-5 text-p-color" />
                    </button>
                    <button
                        onClick={() => setPaletteMode('dark')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'dark'
                                ? 'palette-primary'
                                : 'bg-transparent'
                            }`}
                        title="Dark Mode"
                    >
                        <Moon className="w-5 h-5 text-p-color" />
                    </button>
                    <button
                        onClick={() => setPaletteMode('accessibility')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'accessibility'
                                ? 'palette-primary'
                                : 'bg-transparent'
                            }`}
                        title="Accessibility Mode"
                    >
                        <Eye className="w-5 h-5 text-p-color" />
                    </button>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 rounded-lg bg-transparent transition-colors"
                    >
                        <Bell className="w-5 h-5 text-p-color" />
                        <span className="absolute top-1 right-1 w-2 h-2 palette-primary rounded-full" />
                    </button>

                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 palette-surface palette-border border rounded-xl shadow-lg py-2 z-50">
                            <div className="px-4 py-2 border-b palette-border">
                                <h3 className="font-medium text-p-color">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="group px-4 py-3 text-p-font text-p-size text-p-color hover:bg-[var(--palette-secondary)] hover:text-white cursor-pointer transition-colors">
                                    <p className="text-p-font text-p-size">New lesson available in React Course</p>
                                    <p className="text-xs palette-text-secondary mt-1 group-hover:[color:var(--palette-primary)]">2 hours ago</p>
                                </div>
                                <div className="group px-4 py-3 text-p-font text-p-size text-p-color hover:bg-[var(--palette-secondary)] hover:text-white cursor-pointer transition-colors">
                                    <p className="text-p-font text-p-size">You earned 100 XP!</p>
                                    <p className="text-xs palette-text-secondary mt-1 group-hover:[color:var(--palette-primary)]">5 hours ago</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <UserMenu
                    user={user}
                    onNavigate={onNavigate}
                    onNavigateToAdmin={onNavigateToAdmin}
                    onLogout={handleLogout}
                />
            </div>
        </header>
    );
};
