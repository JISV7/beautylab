import React from 'react';
import { X, Palette, Users, Sparkles, FileText, FolderOpen } from 'lucide-react';

interface AdminSidebarProps {
    activeItem?: string;
    onNavigate?: (item: string) => void;
    onBack?: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeItem = 'theme',
    onNavigate,
    isOpen = false,
    onClose
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
        { id: 'themes', label: 'Theme Config', icon: Palette },
        { id: 'categories', label: 'Categories', icon: FolderOpen },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'content', label: 'Courses', icon: FileText },
    ];

    const handleClick = (itemId: string) => {
        if (onNavigate) {
            onNavigate(itemId);
        }
    };

    return (
        <>
            {/* Admin Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200
                lg:translate-x-0 lg:static
                bg-[var(--palette-surface)]
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Mobile Close Button */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--palette-border)]">
                    <span className="text-[var(--text-h4-size)] text-[var(--text-h4-color)] font-bold">Menu</span>
                    <button onClick={onClose} className="p-2 text-[var(--text-p-color)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleClick(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                    text-sm sm:text-base text-p-font transition-all
                                    ${isActive
                                        ? 'bg-[var(--palette-primary)] text-[var(--text-p-color)]'
                                        : 'text-[var(--text-p-color)] hover:bg-[var(--palette-border)]'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Admin Badge */}
                <div className="p-4 border-t border-[var(--palette-border)]">
                    <div className="bg-[var(--palette-surface)] border border-[var(--palette-border)] p-4 rounded-lg">
                        <p className="text-xs text-p-font text-[var(--text-p-color)] opacity-70 mb-2">Admin Mode</p>
                        <p className="text-xs text-p-font text-[var(--text-p-color)]">
                            You have full access to customize the site appearance.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};
