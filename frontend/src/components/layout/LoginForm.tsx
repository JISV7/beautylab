import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToRecovery: () => void;
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSwitchToRecovery,
  onSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-[var(--text-h2-size)] text-[var(--text-h2-color)] text-[var(--text-h2-weight)] mb-2">Welcome Back</h2>
        <p className="text-[var(--text-p-size)] text-[var(--text-p-color)]">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[var(--text-p-size)] text-[var(--text-p-color)] block mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-p-color)] opacity-60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full pl-10 pr-4"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="text-[var(--text-p-size)] text-[var(--text-p-color)] block mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-p-color)] opacity-60" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full pl-10 pr-12"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-p-color)] opacity-60 hover:opacity-100 transition-opacity"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={onSwitchToRecovery}
            className="text-[var(--palette-primary)] text-sm mt-2 hover:opacity-80 transition-opacity"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="text-sm rounded-lg p-3 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-primary)] text-[var(--decorator-color)] font-semibold hover:bg-[var(--palette-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <div className="text-center">
        <p className="text-[var(--text-p-size)] text-[var(--text-p-color)] text-sm">
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-[var(--palette-primary)] hover:opacity-80 transition-opacity"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};
