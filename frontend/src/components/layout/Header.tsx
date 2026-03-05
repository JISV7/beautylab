import React, { useState } from 'react';
import { Code2, Moon, Sun, LogIn } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from './LoginDialog';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onNavigateToDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToDashboard }) => {
  const { config, updateTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const toggleTheme = (mode: 'light' | 'dark') => {
    updateTheme({ mode });
  };

  const handleLoginSuccess = () => {
    onNavigateToDashboard?.();
  };

  return (
    <header className="sticky top-0 z-50 theme-surface border-b theme-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="theme-primary rounded-lg p-2">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="theme-h4 font-bold text-[var(--theme-text-base)]">Codyn</span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#courses" className="theme-text-secondary hover:text-[var(--theme-primary)] transition-colors">
              Courses
            </a>
            <a href="#services" className="theme-text-secondary hover:text-[var(--theme-primary)] transition-colors">
              Services
            </a>
            <a href="#about" className="theme-text-secondary hover:text-[var(--theme-primary)] transition-colors">
              About
            </a>
            <a href="#contact" className="theme-text-secondary hover:text-[var(--theme-primary)] transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Side: Theme Toggles + Auth */}
          <div className="flex items-center gap-2">
            {/* Theme Toggles */}
            <div className="flex items-center gap-1 sm:gap-2 mr-2">
              <button
                onClick={() => toggleTheme('light')}
                className={`p-2 rounded-lg transition-colors ${config.mode === 'light'
                  ? 'theme-primary text-white'
                  : 'bg-transparent text-[var(--theme-text-secondary)] hover:bg-[var(--theme-border)]'
                  }`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                className={`p-2 rounded-lg transition-colors ${config.mode === 'dark'
                  ? 'theme-primary text-white'
                  : 'bg-transparent text-[var(--theme-text-secondary)] hover:bg-[var(--theme-border)]'
                  }`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* Authentication */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setLoginDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg theme-primary text-white hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline theme-text-sm">Sign In</span>
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
