import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    onSuccess();
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="auth-title mb-2">Welcome Back</h2>
        <p className="auth-description">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="auth-label block mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 auth-text-secondary" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full pl-10 pr-4"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="auth-label block mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 auth-text-secondary" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full pl-10 pr-4"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            onClick={onSwitchToRecovery}
            className="auth-link text-sm mt-2"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="auth-button-primary w-full"
        >
          Sign In
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center">
        <p className="auth-description text-sm">
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="auth-link"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};
