import React, { useState } from 'react';
import { Menu, Search, Bell, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserMenu } from './UserMenu';
import { BrandLogo } from '../brand/BrandLogo';
import { ThemeModeToggle } from './ThemeModeToggle';

interface AdminHeaderProps {
    onBack?: () => void;
    onMenuToggle?: () => void;
    onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onBack, onMenuToggle, onLogout }) => {
    const navigate = useNavigate();
    const { user, logout: authLogout } = useAuth();
    const { currentMode } = useTheme();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const logoTheme = currentMode === 'dark' ? 'dark' : 'light';

    const handleLogout = () => {
        authLogout();
        onLogout?.();
    };

    return (
        <header className="dashboard-header palette-surface z-40 px-4 lg:px-6 py-3 lg:py-4 border-b palette-border print:hidden">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                {/* First row on mobile; left side on desktop */}
                <div className="flex items-center justify-between gap-3 lg:flex-1 lg:min-w-0">
                    <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg text-paragraph hover:bg-palette-border transition-colors"
                            aria-label="Abrir menú de administración"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <a href="/" className="flex items-center flex-shrink-0">
                            <BrandLogo variant="compact" theme={logoTheme} size="sm" />
                        </a>

                        {/* Desktop search */}
                        <div className="hidden lg:block flex-1 min-w-0 max-w-xl">
                            <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                                <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    aria-label="Buscar en el panel de administración"
                                    className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-muted focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-paragraph hover:bg-palette-border transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Volver al panel</span>
                        </button>

                        <ThemeModeToggle compact />

                        <NotificationButton
                            id="admin-notifications-desktop"
                            isOpen={isNotificationOpen}
                            onToggle={() => setIsNotificationOpen((open) => !open)}
                            items={[
                                { title: 'Tema actualizado correctamente', time: 'Hace 2 horas' },
                                { title: 'Nuevo usuario registrado', time: 'Hace 5 horas' },
                            ]}
                        />

                        <UserMenu
                            user={user}
                            onNavigateToDashboard={() => navigate('/dashboard?tab=dashboard')}
                            onNavigateToSettings={() => navigate('/dashboard?tab=settings')}
                            onNavigateToHome={() => navigate('/')}
                            isOnHome={false}
                            onLogout={handleLogout}
                        />
                    </div>

                    {/* Mobile actions */}
                    <div className="flex lg:hidden items-center gap-1">
                        <NotificationButton
                            id="admin-notifications-mobile"
                            isOpen={isNotificationOpen}
                            onToggle={() => setIsNotificationOpen((open) => !open)}
                            items={[
                                { title: 'Tema actualizado correctamente', time: 'Hace 2 horas' },
                                { title: 'Nuevo usuario registrado', time: 'Hace 5 horas' },
                            ]}
                        />
                        <UserMenu
                            user={user}
                            onNavigateToDashboard={() => navigate('/dashboard?tab=dashboard')}
                            onNavigateToSettings={() => navigate('/dashboard?tab=settings')}
                            onNavigateToHome={() => navigate('/')}
                            isOnHome={false}
                            onLogout={handleLogout}
                        />
                    </div>
                </div>

                {/* Second row on mobile: full-width search + compact theme toggles */}
                <div className="flex lg:hidden items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                            <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                aria-label="Buscar en el panel de administración"
                                className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-muted focus:outline-none"
                            />
                        </div>
                    </div>
                    <ThemeModeToggle compact />
                </div>
            </div>
        </header>
    );
};

interface NotificationItem {
    title: string;
    time: string;
}

interface NotificationButtonProps {
    id: string;
    isOpen: boolean;
    onToggle: () => void;
    items: NotificationItem[];
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ id, isOpen, onToggle, items }) => (
    <div className="relative">
        <button
            type="button"
            onClick={onToggle}
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-palette-border transition-colors"
            aria-label="Notificaciones"
            aria-expanded={isOpen}
            aria-controls={id}
        >
            <Bell className="w-5 h-5 text-paragraph" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-palette-primary rounded-full" aria-hidden="true" />
        </button>

        {isOpen && (
            <div
                id={id}
                role="dialog"
                aria-label="Notificaciones"
                className="fixed left-4 right-4 top-36 z-50 palette-surface palette-border border rounded-xl shadow-lg py-2 lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:w-80"
            >
                <div className="flex items-center justify-between px-4 py-2 border-b palette-border">
                    <h3 className="text-h4">Notificaciones</h3>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-paragraph hover:bg-palette-border"
                        aria-label="Cerrar notificaciones"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <div
                            key={item.title}
                            className="px-4 py-3 text-paragraph hover:bg-palette-surface transition-colors"
                        >
                            <p className="text-paragraph">{item.title}</p>
                            <p className="text-muted text-sm mt-1">{item.time}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);
