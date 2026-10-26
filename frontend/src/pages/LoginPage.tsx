import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, BadgeCheck, ShieldCheck, Users } from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { LoginForm } from '../components/layout/LoginForm';
import { PasswordRecoveryForm } from '../components/layout/PasswordRecoveryForm';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [view, setView] = useState<'login' | 'recovery'>('login');
  const [loginSucceeded, setLoginSucceeded] = useState(false);

  useEffect(() => {
    if (!loginSucceeded || !isAuthenticated || !user) return;
    navigate(user.isCompanyAdmin ? '/empresa' : '/dashboard', { replace: true });
  }, [loginSucceeded, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 xl:p-14">
        <img
          src="/images/login-corporate.jpg"
          alt="Equipo corporativo en una sesión de trabajo"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1E5AA8]/55" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0D2B4D]/85 via-[#0D2B4D]/20 to-[#0D2B4D]/30"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <BrandLogo variant="compact" theme="dark" size="md" />
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
            Bienvenido a Cursorg
          </h1>
          <p className="mt-4 text-[#E2EEF7] leading-relaxed">
            Centraliza la capacitación de tu empresa, mide el avance de cada
            departamento y entrega certificados verificables.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: Users, label: 'Directorio y departamentos en un solo lugar' },
              { icon: BadgeCheck, label: 'Progreso y certificados verificables' },
              { icon: ShieldCheck, label: 'Facturación y pagos en moneda local' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex items-center justify-center gap-3 text-sm text-white"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#C7DBEA]">
          © {new Date().getFullYear()} Cursorg. Capacitación corporativa sin barreras.
        </p>
      </aside>

      <main className="flex flex-col min-h-screen bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6E7882] hover:text-[#1E5AA8]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <div className="lg:hidden">
            <BrandLogo variant="compact" theme="light" size="sm" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="company-card p-7 sm:p-9">
              {view === 'login' ? (
                <LoginForm
                  onSwitchToRegister={() => navigate('/registro-empresa')}
                  onSwitchToRecovery={() => setView('recovery')}
                  onSuccess={() => setLoginSucceeded(true)}
                />
              ) : (
                <PasswordRecoveryForm onSwitchToLogin={() => setView('login')} />
              )}
            </div>

            {view === 'login' && (
              <p className="mt-6 text-center text-sm text-[#6E7882]">
                ¿Quieres capacitar a tu equipo?{' '}
                <Link
                  to="/registro-empresa"
                  className="font-semibold text-[#1E5AA8] hover:text-[#0D2B4D]"
                >
                  Registra tu empresa
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
