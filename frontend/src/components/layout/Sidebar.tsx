import React from 'react';
import { 
    BookOpen, 
    Compass, 
    Users, 
    Home,
    Sparkles
} from 'lucide-react';

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
        <aside className="dashboard-sidebar w-64 min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b dashboard-sidebar-border">
                <a href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg theme-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="theme-h4 font-bold">Codyn</span>
                </a>
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
                                dashboard-sidebar-link
                                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                text-sm font-medium transition-all
                                ${isActive ? 'dashboard-sidebar-link-active' : ''}
                            `}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* User Progress Summary */}
            <div className="p-4 border-t dashboard-sidebar-border">
                <div className="theme-card p-4 rounded-lg">
                    <p className="text-xs font-medium theme-text-secondary mb-2">Weekly Progress</p>
                    <div className="w-full bg-[var(--theme-border-value)] rounded-full h-2 mb-2">
                        <div 
                            className="theme-primary h-2 rounded-full transition-all" 
                            style={{ width: '65%' }}
                        />
                    </div>
                    <p className="text-xs theme-text-secondary">65% complete</p>
                </div>
            </div>
        </aside>
    );
};
