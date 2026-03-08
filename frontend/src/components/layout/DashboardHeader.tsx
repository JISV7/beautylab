import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, LogOut, Settings, Shield, Sun, Moon, Eye , Code2} from 'lucide-react';
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
        <header className="dashboard-header z-40 px-6 py-4 flex items-center justify-between">
            {/* Left Side: Logo + Search */}
            <div className="flex items-center gap-6 flex-1 max-w-3xl">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--palette-primary)] flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-h4-font text-h4-size text-h4-color text-h4-weight font-bold">Codyn</span>
                </a>

                {/* Search Bar */}
                <div className="flex-1 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-p-color" />
                        <input
                            type="text"
                            placeholder="Search courses, lessons, or topics..."
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
                        className="relative p-2 rounded-lg palette-text-secondary hover:palette-border transition-colors"
                    >
                        <Bell className="w-5 h-5" />
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
                            {user?.isAdmin && (
                                <button
                                    onClick={handleAdminPanel}
                                    className="w-full text-left px-4 py-2 text-p-font text-p-size text-p-color hover:bg-[var(--palette-primary)] hover:text-white flex items-center gap-2 transition-colors"
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
