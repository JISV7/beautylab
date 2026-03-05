import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Settings, Shield } from 'lucide-react';

interface UserMenuProps {
    onNavigateToAdmin?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigateToAdmin }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdminPanel = () => {
        if (onNavigateToAdmin) {
            onNavigateToAdmin();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg theme-surface border theme-border hover:bg-[var(--theme-border)] transition-colors"
            >
                <div className="w-8 h-8 rounded-full theme-primary flex items-center justify-center text-white">
                    <User className="w-4 h-4" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl theme-surface border theme-border shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b theme-border">
                        <p className="text-sm font-medium theme-text-base">
                            {user?.name || 'User Account'}
                        </p>
                        <p className="text-xs theme-text-secondary">{user?.email}</p>
                    </div>
                    <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm theme-text-secondary hover:bg-[var(--theme-border)] hover:text-[var(--theme-text-base)] flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        {user?.isAdmin && (
                            <button
                                onClick={handleAdminPanel}
                                className="w-full text-left px-4 py-2 text-sm theme-text-secondary hover:bg-[var(--theme-border)] hover:text-[var(--theme-text-base)] flex items-center gap-2"
                            >
                                <Shield className="w-4 h-4" />
                                Admin Panel
                            </button>
                        )}
                        <button
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm theme-text-secondary hover:bg-[var(--theme-border)] hover:text-red-500 flex items-center gap-2 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
