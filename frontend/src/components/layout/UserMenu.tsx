import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Shield, Home, Settings } from 'lucide-react';

interface UserMenuProps {
    user: {
        name?: string;
        email?: string;
        isAdmin?: boolean;
    } | null;
    onNavigate?: (page: string) => void;
    onNavigateToAdmin?: () => void;
    onNavigateToSettings?: () => void;
    onNavigateToHome?: () => void;
    onNavigateToDashboard?: () => void;
    onLogout?: () => void;
    isOnHome?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
    user,
    onNavigate,
    onNavigateToAdmin,
    onNavigateToHome,
    onNavigateToDashboard,
    onLogout,
    isOnHome = false,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    const handleGoToHome = () => {
        if (onNavigateToHome) {
            onNavigateToHome();
        }
        setIsMenuOpen(false);
    };

    const handleGoToDashboard = () => {
        if (onNavigateToDashboard) {
            onNavigateToDashboard();
        }
        setIsMenuOpen(false);
    };

    const handleSettings = () => {
        if (onNavigate) {
            onNavigate('settings');
        } else if (onNavigateToSettings) {
            onNavigateToSettings();
        } else if (onNavigateToDashboard) {
            window.location.href = '/dashboard?tab=settings';
        }
        setIsMenuOpen(false);
    };

    const userName = user?.name || user?.email?.split('@')[0] || 'User';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg palette-surface palette-border border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-palette-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-palette-primary" />
                </div>
                <span className="text-paragraph hidden md:inline">
                    {userName}
                </span>
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-fit palette-surface palette-border border rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b palette-border">
                        <p className="text-paragraph font-semibold whitespace-nowrap">
                            {userName}
                        </p>
                        <p className="text-paragraph whitespace-nowrap opacity-75">
                            {user?.email}
                        </p>
                    </div>
                    {isOnHome ? (
                        <button
                            onClick={handleGoToDashboard}
                            className="w-full text-left px-4 py-2 text-paragraph hover:bg-palette-primary hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <Home className="w-4 h-4 rotate-180" />
                            Go to Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={handleGoToHome}
                            className="w-full text-left px-4 py-2 text-paragraph hover:bg-palette-primary hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            Go to Home
                        </button>
                    )}
                    {user?.isAdmin && (
                        <button
                            onClick={handleAdminPanel}
                            className="w-full text-left px-4 py-2 text-paragraph hover:bg-palette-primary hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </button>
                    )}
                    <button
                        onClick={handleSettings}
                        className="w-full text-left px-4 py-2 text-paragraph hover:bg-palette-primary hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    <button
                        onClick={() => {
                            setIsMenuOpen(false);
                            onLogout?.();
                        }}
                        className="w-full text-left px-4 py-2 text-paragraph hover:bg-palette-primary hover:text-white flex items-center gap-2 transition-colors rounded-b-xl"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};
