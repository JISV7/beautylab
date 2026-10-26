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
      setError(err.message || 'No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-h2 mb-2">Bienvenido de nuevo</h2>
        <p className="text-paragraph">
          Inicia sesión para continuar con la capacitación de tu equipo.
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
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="text-paragraph block mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full py-2.5 px-4 pl-11 pr-12 rounded-lg"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-100 transition-opacity"
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
            className="text-paragraph text-link text-sm mt-2 hover:opacity-80 transition-opacity"
            disabled={isLoading}
          >
¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <div className="text-sm rounded-lg p-3 text-danger bg-red-50 dark:text-danger dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-primary)] text-on-primary font-semibold hover:bg-[var(--palette-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-paragraph"
          disabled={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <div className="text-center">
        <p className="text-paragraph text-sm">
          ¿Aún no tienes cuenta?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-paragraph text-link hover:opacity-80 transition-opacity"
          >
            Crear una cuenta
          </button>
        </p>
      </div>
    </div>
  );
};
