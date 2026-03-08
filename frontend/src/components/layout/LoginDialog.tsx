import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordRecoveryForm } from './PasswordRecoveryForm';

type AuthView = 'login' | 'register' | 'recovery';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange, onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');

  if (!open) return null;

  const handleSuccess = () => {
    onOpenChange(false);
    setView('login');
    onLoginSuccess?.();
  };

  const handleClose = () => {
    onOpenChange(false);
    setView('login');
  };

  return (
    <div className="auth-dialog-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="auth-dialog w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 auth-text-secondary hover:auth-text-base transition-colors z-10"
        >
          <X className="w-5 h-5" style={{ color: 'var(--decorator-color)' }} />
        </button>

        {/* Form switcher tabs */}
        <div className="auth-tabs flex border-b">
          <button
            onClick={() => setView('login')}
            className={`flex-1 py-3 text-sm font-medium auth-tab ${
              view === 'login' ? 'auth-tab-active' : ''
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setView('register')}
            className={`flex-1 py-3 text-sm font-medium auth-tab ${
              view === 'register' ? 'auth-tab-active' : ''
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form content - scrollable for long forms */}
        <div className="max-h-[80vh] overflow-y-auto p-6">
          {view === 'login' && (
            <LoginForm
              onSwitchToRegister={() => setView('register')}
              onSwitchToRecovery={() => setView('recovery')}
              onSuccess={handleSuccess}
            />
          )}
          {view === 'register' && (
            <RegisterForm
              onSwitchToLogin={() => setView('login')}
              onSuccess={handleSuccess}
            />
          )}
          {view === 'recovery' && (
            <PasswordRecoveryForm
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
