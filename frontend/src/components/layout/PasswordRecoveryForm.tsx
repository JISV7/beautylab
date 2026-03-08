import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowLeft, Send } from 'lucide-react';

interface PasswordRecoveryFormProps {
  onSwitchToLogin: () => void;
}

export const PasswordRecoveryForm: React.FC<PasswordRecoveryFormProps> = ({
  onSwitchToLogin,
}) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetPassword(email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="auth-success-icon w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-p-color" />
          </div>
          <h2 className="auth-title mb-2">Check Your Email</h2>
          <p className="auth-description text-sm">
            We&apos;ve sent password reset instructions to <br />
            <span className="auth-title text-sm">{email}</span>
          </p>
        </div>

        <button
          onClick={onSwitchToLogin}
          className="auth-button-secondary w-full"
        >
          <ArrowLeft className="w-4 h-4 text-p-color" />
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="auth-title mb-2">Forgot Password?</h2>
        <p className="auth-description text-sm">
          No worries! Enter your email and we&apos;ll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="auth-label block mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 auth-text-secondary text-p-color" />
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

        <button
          type="submit"
          className="auth-button-primary w-full"
        >
          Send Reset Link
          <Send className="w-4 h-4 decorator-color" />
        </button>
      </form>

      <button
        onClick={onSwitchToLogin}
        className="auth-button-secondary w-full"
      >
        <ArrowLeft className="w-4 h-4 text-p-color" />
        Back to Sign In
      </button>
    </div>
  );
};
