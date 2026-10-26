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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[rgba(30,90,168,0.1)]">
            <Mail className="w-8 h-8 text-link" />
          </div>
          <h2 className="text-h2 mb-2">Revisa tu correo</h2>
          <p className="text-paragraph text-sm">
            Enviamos las instrucciones para restablecer tu contraseña a <br />
            <span className="text-paragraph text-sm font-medium">{email}</span>
          </p>
        </div>

        <button
          onClick={onSwitchToLogin}
          className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-surface)] text-[var(--text-paragraph)] font-semibold border border-[var(--palette-border)] hover:bg-[var(--palette-border)] transition-colors flex items-center justify-center gap-2 text-paragraph"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-h2 mb-2">¿Olvidaste tu contraseña?</h2>
        <p className="text-paragraph text-sm">
          Ingresa tu correo y te enviaremos las instrucciones para restablecerla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-paragraph block mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
              placeholder="tu@empresa.com"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-primary)] text-on-primary font-semibold hover:bg-[var(--palette-accent)] transition-colors flex items-center justify-center gap-2 text-paragraph"
        >
          Enviar enlace
          <Send className="w-4 h-4" />
        </button>
      </form>

      <button
        onClick={onSwitchToLogin}
        className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-surface)] text-[var(--text-paragraph)] font-semibold border border-[var(--palette-border)] hover:bg-[var(--palette-border)] transition-colors flex items-center justify-center gap-2 text-paragraph"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a iniciar sesión
      </button>
    </div>
  );
};
