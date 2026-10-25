import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Moon, Sun, LogIn, Eye, CalendarCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from './LoginDialog';
import { UserMenu } from './UserMenu';
import { BrandLogo } from '../brand/BrandLogo';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentMode, setPaletteMode } = useTheme();
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    authLogout();
    navigate('/');
  };

  const logoTheme = currentMode === 'dark' ? 'dark' : 'light';

  return (
    <header className="sticky top-0 z-50 palette-surface palette-border border-b transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center" aria-label="Cursorg — Inicio">
            <BrandLogo variant="compact" theme={logoTheme} size="sm" />
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
            <a href="/" className="text-paragraph hover:palette-primary transition-colors">
              Inicio
            </a>
            <a href="/#courses" className="text-paragraph hover:palette-primary transition-colors">
              Cursos
            </a>
            <a href="/#about" className="text-paragraph hover:palette-primary transition-colors">
              Sobre Cursorg
            </a>
            <a href="/#contact" className="text-paragraph hover:palette-primary transition-colors">
              Contacto
            </a>
          </nav>

          {/* Right Side: Theme Toggles + Auth */}
          <div className="flex items-center gap-2">
            {/* Theme Toggles */}
            <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
              <button
                onClick={() => setPaletteMode('light')}
                className={`p-2 rounded-lg transition-colors ${currentMode === 'light'
                  ? 'palette-primary'
                  : 'bg-transparent'
                  }`}
                title="Modo claro"
                aria-label="Activar modo claro"
                aria-pressed={currentMode === 'light'}
              >
                <Sun
                  className={`w-4 h-4 ${currentMode === 'light' ? 'text-[var(--palette-background)]' : 'text-paragraph'}`}
                />
              </button>
              <button
                onClick={() => setPaletteMode('dark')}
                className={`p-2 rounded-lg transition-colors ${currentMode === 'dark'
                  ? 'palette-primary'
                  : 'bg-transparent'
                  }`}
                title="Modo oscuro"
                aria-label="Activar modo oscuro"
                aria-pressed={currentMode === 'dark'}
              >
                <Moon
                  className={`w-4 h-4 ${currentMode === 'dark' ? 'text-[var(--palette-background)]' : 'text-paragraph'}`}
                />
              </button>
              <button
                onClick={() => setPaletteMode('accessibility')}
                className={`p-2 rounded-lg transition-colors ${currentMode === 'accessibility'
                  ? 'palette-primary'
                  : 'bg-transparent'
                  }`}
                title="Modo accesible"
                aria-label="Activar modo accesible"
                aria-pressed={currentMode === 'accessibility'}
              >
                <Eye
                  className={`w-4 h-4 ${currentMode === 'accessibility' ? 'text-[var(--palette-background)]' : 'text-paragraph'}`}
                />
              </button>
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
          </div>
        </div>
      </div>

      {/* Login/Register Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onLoginSuccess={handleLoginSuccess}
      />
    </header>
  );
};
