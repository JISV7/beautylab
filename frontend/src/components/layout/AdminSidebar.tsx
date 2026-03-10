import React from 'react';
import { Palette, Users, Sparkles, ArrowLeft, FileText, Code2 } from 'lucide-react';

interface AdminSidebarProps {
    activeItem?: string;
    onNavigate?: (item: string) => void;
    onBack?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeItem = 'theme',
    onNavigate,
    onBack,
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
        { id: 'themes', label: 'Theme Config', icon: Palette },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'content', label: 'Content', icon: FileText },
    ];

    const handleClick = (itemId: string) => {
        if (onNavigate) {
            onNavigate(itemId);
        }
    };

    return (
        <aside className="dashboard-sidebar w-64 min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--palette-border)]">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--palette-primary)] flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[var(--text-h4-size)] text-[var(--text-h4-color)] text-[var(--text-h4-weight)] font-bold">Codyn Admin</span>
                </div>
                <button
                    onClick={onBack}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--text-p-size)] text-[var(--text-p-color)] hover:bg-[var(--palette-border)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-[var(--text-p-color)]" />
                    Back to Dashboard
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
                                text-sm font-medium transition-all
                                ${isActive 
                                    ? 'bg-[var(--palette-primary)] text-[var(--text-p-color)]' 
                                    : 'text-[var(--text-p-color)] hover:bg-[var(--palette-border)]'
                                }
                            `}
                        >
                            <Icon className="w-5 h-5 text-[var(--text-p-color)]" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Admin Badge */}
            <div className="p-4 border-t border-[var(--palette-border)]">
                <div className="bg-[var(--palette-surface)] border border-[var(--palette-border)] p-4 rounded-lg">
                    <p className="text-xs font-medium text-[var(--text-p-color)] opacity-70 mb-2">Admin Mode</p>
                    <p className="text-xs text-[var(--text-p-color)]">
                        You have full access to customize the site appearance.
                    </p>
                </div>
            </div>
        </aside>
    );
};
