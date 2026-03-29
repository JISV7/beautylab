import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, User, LogOut, Settings, ArrowLeft, Sun, Moon, Eye, Code2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminHeaderProps {
    onBack?: () => void;
    onMenuToggle?: () => void;
    onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onBack, onMenuToggle, onLogout }) => {
    const { user, logout } = useAuth();
    const { currentMode, setPaletteMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="dashboard-header palette-surface z-40 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 border-b border-[var(--palette-border)] print:hidden">
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
                            className="w-full pl-10 pr-4 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color placeholder-[var(--palette-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Back to Dashboard */}
                <button
                    onClick={onBack}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--text-p-size)] text-[var(--text-p-color)] hover:bg-[var(--palette-border)] transition-colors text-p-font"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </button>

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
                                    <p className="text-p-font text-p-size">Theme updated successfully</p>
                                    <p className="text-xs palette-text-secondary mt-1 group-hover:[color:var(--palette-primary)]">2 hours ago</p>
                                </div>
                                <div className="group px-4 py-3 text-p-font text-p-size text-p-color hover:bg-[var(--palette-secondary)] hover:text-white cursor-pointer transition-colors">
                                    <p className="text-p-font text-p-size">New user registered</p>
                                    <p className="text-xs palette-text-secondary mt-1 group-hover:[color:var(--palette-primary)]">5 hours ago</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 p-2 rounded-lg palette-surface palette-border border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-[var(--palette-primary)]/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-[var(--palette-primary)]" />
                        </div>
                        <span className="text-p-font text-p-size text-p-color hidden md:inline">
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                        </span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 palette-surface palette-border border rounded-xl shadow-lg py-1 z-50">
                            <div className="px-4 py-2 border-b palette-border">
                                <p className="text-p-font text-p-size text-p-color">
                                    {user?.name || 'User Account'}
                                </p>
                                <p className="text-p-font text-p-size text-p-color">{user?.email}</p>
                            </div>
                            <button className="w-full text-left px-4 py-2 text-p-font text-p-size text-p-color hover:bg-[var(--palette-primary)] hover:text-white flex items-center gap-2 transition-colors">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMenuOpen(false);
                                    onLogout?.();
                                }}
                                className="w-full text-left px-4 py-2 text-p-font text-p-size text-p-color hover:bg-[var(--palette-primary)] hover:text-white flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
