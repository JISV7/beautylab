import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, LogOut, Settings, Shield, Sun, Moon, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardHeaderProps {
    onNavigate?: (page: string) => void;
    onNavigateToAdmin?: () => void;
    onLogout?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNavigate, onNavigateToAdmin, onLogout }) => {
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

    const handleAdminPanel = () => {
        if (onNavigateToAdmin) {
            onNavigateToAdmin();
        } else if (onNavigate) {
            onNavigate('admin');
        }
        setIsMenuOpen(false);
    };

    return (
        <header className="dashboard-header sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 theme-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search courses, lessons, or topics..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg theme-surface theme-border border theme-text-base placeholder-[var(--theme-text-secondary-value)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-value)]"
                    />
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPaletteMode('light')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'light'
                                ? 'palette-primary text-white'
                                : 'bg-transparent palette-text-secondary hover:palette-border'
                            }`}
                        title="Light Mode"
                    >
                        <Sun className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setPaletteMode('dark')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'dark'
                                ? 'palette-primary text-white'
                                : 'bg-transparent palette-text-secondary hover:palette-border'
                            }`}
                        title="Dark Mode"
                    >
                        <Moon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setPaletteMode('accessibility')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'accessibility'
                                ? 'palette-primary text-white'
                                : 'bg-transparent palette-text-secondary hover:palette-border'
                            }`}
                        title="Accessibility Mode"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 rounded-lg theme-text-secondary hover:bg-[var(--theme-border-value)] transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 theme-primary rounded-full" />
                    </button>

                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 theme-surface theme-border border rounded-xl shadow-lg py-2 z-50">
                            <div className="px-4 py-2 border-b theme-border">
                                <h3 className="font-medium theme-text-base">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="px-4 py-3 hover:bg-[var(--theme-border-value)] cursor-pointer">
                                    <p className="text-sm theme-text-base">New lesson available in React Course</p>
                                    <p className="text-xs theme-text-secondary mt-1">2 hours ago</p>
                                </div>
                                <div className="px-4 py-3 hover:bg-[var(--theme-border-value)] cursor-pointer">
                                    <p className="text-sm theme-text-base">You earned 100 XP!</p>
                                    <p className="text-xs theme-text-secondary mt-1">5 hours ago</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 p-2 rounded-lg theme-surface theme-border border hover:bg-[var(--theme-border-value)] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-[var(--theme-primary-value)]/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-[var(--theme-primary-value)]" />
                        </div>
                        <span className="text-sm font-medium theme-text-base hidden md:inline">
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                        </span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 theme-surface theme-border border rounded-xl shadow-lg py-1 z-50">
                            <div className="px-4 py-2 border-b theme-border">
                                <p className="text-sm font-medium theme-text-base">
                                    {user?.name || 'User Account'}
                                </p>
                                <p className="text-xs theme-text-secondary">{user?.email}</p>
                            </div>
                            <button className="w-full text-left px-4 py-2 text-sm theme-text-secondary hover:bg-[var(--theme-border-value)] flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            {user?.isAdmin && (
                                <button
                                    onClick={handleAdminPanel}
                                    className="w-full text-left px-4 py-2 text-sm theme-text-secondary hover:bg-[var(--theme-border-value)] flex items-center gap-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin Panel
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMenuOpen(false);
                                    onLogout?.();
                                }}
                                className="w-full text-left px-4 py-2 text-sm theme-text-secondary hover:bg-red-50 hover:text-red-500 flex items-center gap-2 transition-colors"
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
