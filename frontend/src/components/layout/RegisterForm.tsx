import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    register(name, email, password);
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="auth-title mb-1.5">Create Account</h2>
        <p className="auth-description text-sm">
          Join us and start your learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="auth-label block mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 auth-text-secondary" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input w-full pl-10 pr-4"
              placeholder="John Doe"
            />
          </div>
        </div>

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
        </div>

        <div>
          <label className="auth-label block mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 auth-text-secondary" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input w-full pl-10 pr-4"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="auth-error text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="auth-button-primary w-full"
        >
          Create Account
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center">
        <p className="auth-description text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="auth-link"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
