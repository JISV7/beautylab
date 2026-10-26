import React from 'react';
import { X, BookOpen, Compass, Route, Users, Home, FileText } from 'lucide-react';

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
        { id: 'home', label: 'Inicio', icon: Home },
        { id: 'my-courses', label: 'Mis cursos', icon: BookOpen },
        { id: 'explore', label: 'Explorar cursos', icon: Compass },
        { id: 'learning-paths', label: 'Rutas de aprendizaje', icon: Route },
        { id: 'community', label: 'Comunidad', icon: Users },
        { id: 'invoices', label: 'Facturas', icon: FileText },
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
                fixed inset-y-0 left-0 z-40 flex w-64 flex-col transform transition-transform duration-200
                lg:translate-x-0 lg:static
                bg-palette-surface
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Mobile Close Button */}
                <div className="lg:hidden flex shrink-0 items-center justify-between p-4 border-b palette-border">
                    <span className="text-h4">Menú</span>
                    <button onClick={onClose} aria-label="Cerrar menú" className="p-2 text-paragraph">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleClick(item.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`
                                    flex w-full min-h-12 items-center gap-3 px-4 py-3 rounded-lg
                                    text-left text-paragraph leading-6 whitespace-nowrap transition-all
                                    ${isActive
                                        ? 'bg-palette-primary text-on-primary'
                                        : 'text-paragraph hover:bg-palette-border'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="min-w-0 flex-1 text-left whitespace-nowrap leading-6">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};
