import React from 'react';
import { X, Palette, Users, Sparkles, FileText, FolderOpen, Receipt, Tag, Building2, Printer, Layout } from 'lucide-react';

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
        { id: 'dashboard', label: 'Panel', icon: Sparkles },
        { id: 'themes', label: 'Configuración de temas', icon: Palette },
        { id: 'home', label: 'Página de inicio', icon: Layout },
        { id: 'categories', label: 'Categorías', icon: FolderOpen },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'content', label: 'Cursos', icon: FileText },
        { id: 'invoices', label: 'Facturas', icon: Receipt },
        { id: 'coupons', label: 'Cupones', icon: Tag },
        { id: 'company-info', label: 'Información de la empresa', icon: Building2 },
        { id: 'printer-info', label: 'Información de impresión', icon: Printer },
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
                bg-palette-surface
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Mobile Close Button */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b palette-border">
                    <span className="text-h4">Menú</span>
                    <button onClick={onClose} aria-label="Cerrar menú" className="p-2 text-paragraph">
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
                                        ? 'bg-palette-primary text-on-primary'
                                        : 'text-paragraph hover:bg-palette-border'
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
