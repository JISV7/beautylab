import React, { useState } from 'react';
import { Menu, Search, Bell, ArrowLeft, Sun, Moon, Eye, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserMenu } from './UserMenu';

interface AdminHeaderProps {
    onBack?: () => void;
    onMenuToggle?: () => void;
    onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onBack, onMenuToggle, onLogout }) => {
    const navigate = useNavigate();
    const { user, logout: authLogout } = useAuth();
    const { currentMode, setPaletteMode } = useTheme();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const handleLogout = () => {
        authLogout();
        onLogout?.();
    };

    return (
        <header className="dashboard-header palette-surface z-40 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 border-b palette-border print:hidden">
            {/* Left Side: Hamburger + Logo + Search */}
            <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                {/* Mobile Hamburger Menu */}
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 rounded-lg text-paragraph hover:bg-palette-border transition-colors"
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
                    <span className="text-h4 font-bold hidden sm:inline">Codyn</span>
                </a>

                {/* Search Bar */}
                <div className="flex-1 min-w-0 max-w-xs sm:max-w-xl">
                    <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                        <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-paragraph placeholder:opacity-60 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Back to Dashboard */}
                <button
                    onClick={onBack}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-paragraph hover:bg-palette-border transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
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
                        <Sun className="w-5 h-5 text-paragraph" />
                    </button>
                    <button
                        onClick={() => setPaletteMode('dark')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'dark'
                            ? 'palette-primary'
                            : 'bg-transparent'
                            }`}
                        title="Dark Mode"
                    >
                        <Moon className="w-5 h-5 text-paragraph" />
                    </button>
                    <button
                        onClick={() => setPaletteMode('accessibility')}
                        className={`p-2 rounded-lg transition-colors ${currentMode === 'accessibility'
                            ? 'palette-primary'
                            : 'bg-transparent'
                            }`}
                        title="Accessibility Mode"
                    >
                        <Eye className="w-5 h-5 text-paragraph" />
                    </button>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 rounded-lg bg-transparent transition-colors"
                    >
                        <Bell className="w-5 h-5 text-paragraph" />
                        <span className="absolute top-1 right-1 w-2 h-2 palette-primary rounded-full" />
                    </button>

                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 palette-surface palette-border border rounded-xl shadow-lg py-2 z-50">
                            <div className="px-4 py-2 border-b palette-border">
                                <h3 className="text-h3">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="group px-4 py-3 text-paragraph hover:bg-palette-secondary hover:text-white cursor-pointer transition-colors">
                                    <p className="text-paragraph">Theme updated successfully</p>
                                    <p className="text-paragraph opacity-60 mt-1 group-hover:text-palette-primary">2 hours ago</p>
                                </div>
                                <div className="group px-4 py-3 text-paragraph hover:bg-palette-secondary hover:text-white cursor-pointer transition-colors">
                                    <p className="text-paragraph">New user registered</p>
                                    <p className="text-paragraph opacity-60 mt-1 group-hover:text-palette-primary">5 hours ago</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <UserMenu
                    user={user}
                    onNavigateToDashboard={() => navigate('/dashboard?tab=dashboard')}
                    onNavigateToHome={() => navigate('/')}
                    isOnHome={false}
                    onLogout={handleLogout}
                />
            </div>
        </header>
    );
};
