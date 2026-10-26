import React from 'react';
import {
  ArrowRight,
  Award,
  CalendarCheck,
  Clock3,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router';

const stats = [
  {
    id: 'currency',
    icon: Wallet,
    value: 'Moneda local',
    label: 'Pago y facturación en tu moneda',
  },
  {
    id: 'onboarding',
    icon: Clock3,
    value: '< 48 h',
    label: 'Onboarding de tu equipo',
  },
  {
    id: 'completion',
    icon: Award,
    value: '80%+',
    label: 'Meta de finalización',
  },
];

const heroMetrics = [
  { value: '5', label: 'programas' },
  { value: '24', label: 'colaboradores' },
  { value: '72%', label: 'avance' },
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden palette-background">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 88% 8%, rgba(85, 199, 232, 0.18), transparent 34%), radial-gradient(circle at 4% 88%, rgba(30, 90, 168, 0.10), transparent 38%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(85, 199, 232, 0.6), transparent)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full palette-surface border palette-border shadow-sm mb-6 text-left">
              <Sparkles
                className="w-4 h-4 flex-shrink-0 text-[var(--palette-secondary)]"
                aria-hidden="true"
              />
              <span className="min-w-0 text-paragraph text-sm font-semibold">
                Plataforma B2B para empresas en Latinoamérica
              </span>
            </div>

            <h1 className="text-h1 mb-5 max-w-2xl mx-auto lg:mx-0">
              Capacitación corporativa{' '}
              <span className="text-[var(--palette-secondary)]">sin barreras.</span>
            </h1>

            <p className="text-paragraph text-lg leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0 opacity-85">
              Formación que habla tu idioma y opera en tu moneda. Tu equipo crece con
              evidencia: cursos especializados, seguimiento de progreso y certificados
              verificables, con soporte en español.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => navigate('/registro-empresa')}
                className="theme-button theme-button-primary"
              >
                <CalendarCheck className="w-4 h-4 decorator-color" aria-hidden="true" />
                Registrar mi empresa
              </button>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="theme-button theme-button-secondary"
              >
                Explorar cursos
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-muted text-sm mt-4">
              Demo guiada para equipos de RR. HH., operaciones y formación.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t palette-border">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.id} className="flex items-start gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl palette-surface border palette-border flex items-center justify-center flex-shrink-0">
                      <Icon
                        className="w-5 h-5 text-[var(--palette-secondary)]"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <dt className="text-h5 font-bold leading-tight">{stat.value}</dt>
                      <dd className="text-muted text-xs sm:text-sm mt-1 leading-snug">
                        {stat.label}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div
              className="absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl"
              aria-hidden="true"
              style={{
                background: 'linear-gradient(135deg, #55C7E8 0%, #1E5AA8 52%, #0D2B4D 100%)',
              }}
            />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img
                src="/images/hero-corporate.jpg"
                alt="Equipo corporativo colaborando en una sesión de capacitación"
                className="h-[380px] w-full object-cover sm:h-[440px]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-[#1E5AA8]/50" aria-hidden="true" />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#0D2B4D]/90 via-[#0D2B4D]/25 to-transparent"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#55C7E8]/15 border border-[#55C7E8]/40 px-3 py-1 text-[11px] font-semibold text-[#D8F4FC] backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55C7E8]" />
                  Programa piloto
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white leading-snug">
                  Tu equipo crece con evidencia
                </h2>
                <p className="mt-2 max-w-sm text-xs sm:text-sm text-[#D9E7F2] leading-relaxed">
                  Seguimiento en tiempo real, certificados verificables y reportes de
                  avance para RR. HH. y operaciones.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  {heroMetrics.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-center backdrop-blur-sm"
                    >
                      <p className="text-lg sm:text-xl font-bold text-white leading-none">
                        {item.value}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#D9E7F2] mt-1">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -left-4 top-6 hidden sm:flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-lg border border-[#E2E8F0]">
              <div className="w-9 h-9 rounded-lg bg-[#1E5AA8]/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#1E5AA8]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D2B4D] leading-none">Certificados</p>
                <p className="text-[10px] text-[#6E7882] mt-1">verificables</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
