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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md relative overflow-hidden bg-[var(--palette-surface)] border border-[var(--palette-border)] rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-[var(--text-p-color)] hover:opacity-80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Form switcher tabs */}
        <div className="flex border-b border-[var(--palette-border)]">
          <button
            onClick={() => setView('login')}
            className={`flex-1 py-3 text-sm sm:text-base text-p-font font-medium transition-colors border-b-2 ${
              view === 'login' ? 'border-[var(--palette-primary)] text-[var(--palette-primary)]' : 'border-transparent text-[var(--text-p-color)]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setView('register')}
            className={`flex-1 py-3 text-sm sm:text-base text-p-font font-medium transition-colors border-b-2 ${
              view === 'register' ? 'border-[var(--palette-primary)] text-[var(--palette-primary)]' : 'border-transparent text-[var(--text-p-color)]'
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
