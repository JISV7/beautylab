import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Code2, Moon, Sun, LogIn, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from './LoginDialog';
import { UserMenu } from './UserMenu';

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

  return (
    <header className="sticky top-0 z-50 palette-surface palette-border border-b transition-colors duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: '#F83A3A' }}
            >
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-h4 font-bold">Codyn</span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href={isAuthenticated ? '/dashboard?tab=explore' : '/explore'} className="text-paragraph hover:palette-primary transition-colors">
              Explore
            </a>
            <a href="/#courses" className="text-paragraph hover:palette-primary transition-colors">
              Courses
            </a>
            <a href="/#services" className="text-paragraph hover:palette-primary transition-colors">
              Services
            </a>
            <a href="/#about" className="text-paragraph hover:palette-primary transition-colors">
              About
            </a>
            <a href="/#contact" className="text-paragraph hover:palette-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Side: Theme Toggles + Auth */}
          <div className="flex items-center gap-2">
            {/* Theme Toggles */}
            <div className="flex items-center gap-1 sm:gap-2 mr-2">
              <button
                onClick={() => setPaletteMode('light')}
                className={`p-2 rounded-lg transition-colors ${currentMode === 'light'
                  ? 'palette-primary'
                  : 'bg-transparent'
                  }`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4 text-paragraph" />
              </button>
              <button
                onClick={() => setPaletteMode('dark')}
                className={`p-2 rounded-lg transition-colors ${currentMode === 'dark'
                  ? 'palette-primary'
                  : 'bg-transparent'
                  }`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4 text-paragraph" />
              </button>
              <button
                onClick={() => setPaletteMode('accessibility')}
                className={`p-2 rounded-lg transition-colors ${currentMode === 'accessibility'
                  ? 'palette-primary'
                  : 'bg-transparent'
                  }`}
                title="Accessibility Mode"
              >
                <Eye className="w-4 h-4 text-paragraph" />
              </button>
            </div>

            {/* Authentication */}
            {isAuthenticated ? (
              <UserMenu
                user={user}
                onNavigateToDashboard={() => navigate('/dashboard')}
                onNavigateToAdmin={() => navigate('/admin')}
                onNavigateToHome={() => navigate('/')}
                isOnHome={window.location.pathname === '/'}
                onLogout={handleLogout}
              />
            ) : (
              <button
                onClick={() => setLoginDialogOpen(true)}
                className="theme-button theme-button-primary"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
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
