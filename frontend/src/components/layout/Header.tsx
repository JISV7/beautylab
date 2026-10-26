import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarCheck, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from './LoginDialog';
import { UserMenu } from './UserMenu';
import { BrandLogo } from '../brand/BrandLogo';
import { ThemeModeToggle } from './ThemeModeToggle';
import { useTheme } from '../../contexts/ThemeContext';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#courses', label: 'Cursos' },
  { href: '/#about', label: 'Sobre Cursorg' },
  { href: '/#contact', label: 'Contacto' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentMode } = useTheme();
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    authLogout();
    navigate('/');
  };

  const logoTheme = currentMode === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 palette-surface palette-border border-b transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <a href="/" className="flex items-center min-w-0">
            <BrandLogo variant="compact" theme={logoTheme} size="sm" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-paragraph hover:text-link transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Side: Theme Toggles + Auth */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeModeToggle compact />
            </div>

            {/* Demo CTA */}
            <div className="hidden sm:block">
              <a
                href="/#contact"
                className="theme-button theme-button-secondary !px-3 sm:!px-4"
              >
                <CalendarCheck className="w-4 h-4" />
                <span className="hidden lg:inline">Solicita una demo</span>
                <span className="lg:hidden">Demo</span>
              </a>
            </div>

            {/* Authentication */}
            {isAuthenticated ? (
              <UserMenu
                user={user}
                onNavigateToDashboard={() => navigate('/dashboard')}
                onNavigateToSettings={() => navigate('/dashboard?tab=settings')}
                onNavigateToAdmin={() => navigate('/admin')}
                onNavigateToHome={() => navigate('/')}
                isOnHome={window.location.pathname === '/'}
                onLogout={handleLogout}
              />
            ) : (
              <button
                onClick={() => setLoginDialogOpen(true)}
                className="theme-button theme-button-primary !px-3 sm:!px-4"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar sesión</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg text-paragraph hover:bg-palette-border transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div
          id="landing-mobile-menu"
          className="md:hidden border-t palette-border palette-surface shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col" aria-label="Navegación móvil">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-11 flex items-center px-3 rounded-lg text-paragraph font-medium hover:bg-palette-border hover:text-link transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="border-t palette-border pt-4 flex flex-col gap-4">
              <a
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="theme-button theme-button-secondary w-full"
              >
                <CalendarCheck className="w-4 h-4" />
                Solicita una demo
              </a>

              <div className="flex items-center justify-between gap-3">
                <span className="text-paragraph text-sm font-medium">Modo de color</span>
                <ThemeModeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login/Register Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLoginSuccess={handleLoginSuccess}
      />
    </header>
  );
};
