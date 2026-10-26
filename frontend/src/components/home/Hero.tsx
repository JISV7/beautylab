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

const sampleCourses = [
  {
    id: 'sst',
    icon: ShieldCheck,
    title: 'Seguridad y Salud en el Trabajo',
    detail: 'Prevención de riesgos industriales',
    progress: 68,
    status: 'En curso',
  },
  {
    id: 'finanzas',
    icon: Wallet,
    title: 'Finanzas Prácticas para No Financieros',
    detail: 'Gestión presupuestaria',
    progress: 45,
    status: 'Asignado',
  },
  {
    id: 'liderazgo',
    icon: Award,
    title: 'Liderazgo Operativo',
    detail: 'Supervisión efectiva de equipos',
    progress: 82,
    status: 'En curso',
  },
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden palette-background">
      {/* Ambient brand background */}
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
          {/* Copy */}
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
              <a href="/#contact" className="theme-button theme-button-primary">
                <CalendarCheck className="w-4 h-4 decorator-color" aria-hidden="true" />
                Solicita una demo
              </a>
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

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div
              className="absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl"
              aria-hidden="true"
              style={{
                background: 'linear-gradient(135deg, #55C7E8 0%, #1E5AA8 52%, #0D2B4D 100%)',
              }}
            />

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0D2B4D]">
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(circle at 100% 0%, rgba(85, 199, 232, 0.24), transparent 42%), linear-gradient(160deg, rgba(30, 90, 168, 0.35), transparent 60%)',
                }}
              />

              <div className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9FC3D8]">
                      Vista de ejemplo
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                      Panel de capacitación
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#55C7E8]/15 border border-[#55C7E8]/30 px-3 py-1 text-[11px] font-semibold text-[#BFEAF7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#55C7E8]" />
                    Programa piloto
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                  {[
                    { value: '5', label: 'cursos' },
                    { value: '24', label: 'colaboradores' },
                    { value: '72%', label: 'avance' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-white/[0.06] border border-white/10 px-3 py-3 text-center"
                    >
                      <p className="text-lg sm:text-xl font-bold text-white leading-none">
                        {item.value}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#B8CBDD] mt-1">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-[#FBFBFE] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <p className="text-sm font-bold text-[#0D2B4D]">
                      Progreso del equipo
                    </p>
                    <span className="text-[11px] font-semibold text-[#1E5AA8]">
                      Este mes
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sampleCourses.map((course) => {
                      const Icon = course.icon;
                      return (
                        <div
                          key={course.id}
                          className="rounded-xl border border-[#DCE5EE] bg-white p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1E5AA8]/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-[#1E5AA8]" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs sm:text-sm font-bold text-[#0D2B4D] leading-snug">
                                  {course.title}
                                </p>
                                <span className="text-[10px] font-semibold text-[#1E5AA8] whitespace-nowrap">
                                  {course.progress}%
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-[#6E7882] mt-0.5">
                                {course.detail}
                              </p>
                              <div className="mt-2 h-1.5 rounded-full bg-[#E6EEF5] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#55C7E8]"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-[#9FC3D8] mt-4 text-center">
                  Datos de demostración. Tu panel se configura con los cursos y equipos de tu empresa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
