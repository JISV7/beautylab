import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Shield } from 'lucide-react';

interface UserMenuProps {
    user: {
        name?: string;
        email?: string;
        isAdmin?: boolean;
    } | null;
    onNavigate?: (page: string) => void;
    onNavigateToAdmin?: () => void;
    onLogout?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
    user,
    onNavigate,
    onNavigateToAdmin,
    onLogout,
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

    const userName = user?.name || user?.email?.split('@')[0] || 'User';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg palette-surface palette-border border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-[var(--palette-primary)]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--palette-primary)]" />
                </div>
                <span className="text-p-font text-p-size text-p-color hidden md:inline">
                    {userName}
                </span>
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 palette-surface palette-border border rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b palette-border">
                        <p className="text-p-font text-p-size text-p-color">
                            {userName}
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
    );
};
