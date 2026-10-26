import React, { useState } from 'react';
import { Menu, Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserMenu } from './UserMenu';
import { CartIcon } from '../cart/CartIcon';
import { BrandLogo } from '../brand/BrandLogo';
import { ThemeModeToggle } from './ThemeModeToggle';

interface DashboardHeaderProps {
    onNavigate?: (page: string) => void;
    onNavigateToAdmin?: () => void;
    onNavigateToSettings?: () => void;
    onNavigateToHome?: () => void;
    onLogout?: () => void;
    onMenuToggle?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNavigate, onNavigateToAdmin, onNavigateToSettings, onNavigateToHome, onLogout, onMenuToggle }) => {
    const { user, logout: authLogout } = useAuth();
    const { currentMode } = useTheme();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const logoTheme = currentMode === 'dark' ? 'dark' : 'light';

    const handleLogout = () => {
        authLogout();
        onLogout?.();
    };

    return (
        <header className="dashboard-header palette-surface z-40 px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between gap-3 border-b palette-border print:hidden">
            {/* Left Side: Hamburger + Logo + Search */}
            <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg text-paragraph hover:bg-palette-border transition-colors"
                    aria-label="Abrir menú del panel"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <a href="/" className="flex items-center flex-shrink-0">
                    <BrandLogo variant="compact" theme={logoTheme} size="sm" />
                </a>

                <div className="hidden sm:block flex-1 min-w-0 max-w-xs sm:max-w-xl">
                    <div className="flex items-center palette-surface palette-border border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-palette-primary">
                        <Search className="w-4 h-4 text-paragraph flex-shrink-0 ml-3" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Buscar cursos..."
                            aria-label="Buscar cursos"
                            className="flex-1 min-w-0 py-2 pl-2 pr-4 bg-transparent text-paragraph placeholder:text-muted focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
                <div className="hidden sm:block">
                    <ThemeModeToggle compact />
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsNotificationOpen((open) => !open)}
                        className="relative w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-palette-border transition-colors"
                        aria-label="Notificaciones"
                        aria-expanded={isNotificationOpen}
                        aria-controls="customer-notifications"
                    >
                        <Bell className="w-5 h-5 text-paragraph" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-palette-primary rounded-full" aria-hidden="true" />
                    </button>

                    {isNotificationOpen && (
                        <div
                            id="customer-notifications"
                            role="dialog"
                            aria-label="Notificaciones"
                            className="fixed left-4 right-4 top-20 z-50 palette-surface palette-border border rounded-xl shadow-lg py-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
                        >
                            <div className="flex items-center justify-between px-4 py-2 border-b palette-border">
                                <h3 className="text-h4">Notificaciones</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsNotificationOpen(false)}
                                    className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-paragraph hover:bg-palette-border"
                                    aria-label="Cerrar notificaciones"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="px-4 py-3 text-paragraph hover:bg-palette-surface transition-colors">
                                    <p className="text-paragraph">Nuevo curso asignado a tu equipo</p>
                                    <p className="text-muted text-sm mt-1">Hace 2 horas</p>
                                </div>
                                <div className="px-4 py-3 text-paragraph hover:bg-palette-surface transition-colors">
                                    <p className="text-paragraph">Certificado disponible para descarga</p>
                                    <p className="text-muted text-sm mt-1">Hace 5 horas</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <CartIcon onClick={() => onNavigate?.('cart')} />
                    <UserMenu
                        user={user}
                        onNavigate={onNavigate}
                        onNavigateToAdmin={onNavigateToAdmin}
                        onNavigateToSettings={onNavigateToSettings}
                        onNavigateToDashboard={onNavigateToHome}
                        onNavigateToHome={onNavigateToHome}
                        onLogout={handleLogout}
                        isOnHome={false}
                    />
                </div>
            </div>
        </header>
    );
};
