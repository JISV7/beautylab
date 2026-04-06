import React from 'react';
import { X, BookOpen, Compass, Users, Home, Sparkles, FileText } from 'lucide-react';

interface SidebarProps {
    activeItem?: string;
    onNavigate?: (item: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeItem = 'home',
    onNavigate,
    isOpen = false,
    onClose
}) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'my-courses', label: 'My Courses', icon: BookOpen },
        { id: 'explore', label: 'Explore', icon: Compass },
        { id: 'learning-paths', label: 'Learning Paths', icon: Compass },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'ai-lab', label: 'AI Lab', icon: Sparkles },
        { id: 'invoices', label: 'Invoices', icon: FileText },
    ];

    const handleClick = (itemId: string) => {
        if (onNavigate) {
            onNavigate(itemId);
        }
    };

    return (
        <>
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200
                lg:translate-x-0 lg:static
                bg-palette-surface
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Mobile Close Button */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b palette-border">
                    <span className="text-h4">Menu</span>
                    <button onClick={onClose} className="p-2 text-p-color">
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
                                    text-paragraph transition-all
                                    ${isActive
                                        ? 'bg-palette-primary text-p-color'
                                        : 'text-p-color hover:bg-palette-border'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};
