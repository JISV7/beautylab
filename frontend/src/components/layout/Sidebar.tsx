import React from 'react';
import { BookOpen, Compass, Users, Home, Sparkles } from 'lucide-react';

interface SidebarProps {
    activeItem?: string;
    onNavigate?: (item: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    activeItem = 'home', 
    onNavigate 
}) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'explore', label: 'Explore', icon: Compass },
        { id: 'learning-paths', label: 'Learning Paths', icon: Compass },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'ai-lab', label: 'AI Lab', icon: Sparkles },
    ];

    const handleClick = (itemId: string) => {
        if (onNavigate) {
            onNavigate(itemId);
        }
    };

    return (
        <aside className="dashboard-sidebar w-64 flex flex-col">
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
                                dashboard-sidebar-link
                                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                text-sm font-medium transition-all
                                ${isActive ? 'dashboard-sidebar-link-active' : ''}
                            `}
                        >
                            <Icon className="w-5 h-5" style={{ color: 'var(--decorator-color)' }} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};
