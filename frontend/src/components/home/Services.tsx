import React from 'react';
import {
  ArrowUpRight,
  Calculator,
  Handshake,
  Monitor,
  ShieldCheck,
  Users,
} from 'lucide-react';

const courses = [
  {
    id: 'seguridad-salud',
    icon: ShieldCheck,
    category: 'Industrial y manufactura',
    title: 'Seguridad y Salud en el Trabajo',
    description:
      'Prevención de riesgos industriales, prácticas seguras y cumplimiento para proteger a tu equipo en planta.',
  },
  {
    id: 'finanzas-practicas',
    icon: Calculator,
    category: 'Servicios financieros',
    title: 'Finanzas Prácticas para No Financieros',
    description:
      'Lectura de estados financieros, presupuestos y decisiones de negocio para líderes de área.',
  },
  {
    id: 'ventas-consultivas',
    icon: Handshake,
    category: 'Comercio y retail',
    title: 'Ventas Consultivas y Atención al Cliente',
    description:
      'Técnicas modernas para entender necesidades, construir confianza y elevar la experiencia del cliente.',
  },
  {
    id: 'habilidades-digitales',
    icon: Monitor,
    category: 'Productividad',
    title: 'Habilidades Digitales para la Oficina Moderna',
    description:
      'Herramientas, colaboración y hábitos digitales para trabajar con más orden, foco y productividad.',
  },
  {
    id: 'liderazgo-operativo',
    icon: Users,
    category: 'Liderazgo',
    title: 'Liderazgo Operativo y Supervisión Efectiva',
    description:
      'Herramientas de supervisión para acompañar equipos, dar retroalimentación y sostener resultados.',
  },
];

export const Services: React.FC = () => {
  return (
    <section id="courses" className="py-16 lg:py-24 palette-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10 lg:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--palette-secondary)] mb-3">
            Programa piloto Cursorg
          </p>
          <h2 className="text-h2 mb-4">Cursos para tu equipo</h2>
          <p className="text-paragraph text-lg opacity-80">
            Cinco programas diseñados para los retos reales de empresas en Latinoamérica.
            Combina formación en español, seguimiento de progreso y certificados
            verificables en una sola plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const Icon = course.icon;
            return (
              <article
                key={course.id}
                className="group relative flex flex-col palette-surface palette-border border rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--palette-secondary)]/10 flex items-center justify-center">
                    <Icon
                      className="w-6 h-6 text-[var(--palette-secondary)]"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-paragraph opacity-50">
                    0{index + 1}
                  </span>
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--palette-secondary)] mb-2">
                  {course.category}
                </p>
                <h3 className="text-h3 mb-3 leading-snug">{course.title}</h3>
                <p className="text-paragraph opacity-75 text-sm leading-relaxed flex-grow">
                  {course.description}
                </p>

                <div className="mt-5 pt-4 border-t palette-border flex items-center gap-2 text-sm font-semibold text-[var(--palette-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--palette-accent)]" />
                  Disponible en el piloto
                </div>
              </article>
            );
          })}

          {/* Demo CTA card */}
          <article className="relative flex flex-col overflow-hidden rounded-2xl p-6 bg-[#0D2B4D] text-white shadow-lg">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(85, 199, 232, 0.3), transparent 48%)',
              }}
            />
            <div className="relative flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[#55C7E8]/15 border border-[#55C7E8]/30 flex items-center justify-center mb-5">
                <ArrowUpRight className="w-6 h-6 text-[#55C7E8]" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9FC3D8] mb-2">
                A tu medida
              </p>
              <h3 className="text-2xl font-bold text-white mb-3 leading-snug">
                ¿Necesitas una ruta de capacitación a medida?
              </h3>
              <p className="text-sm text-[#D9E7F2] leading-relaxed flex-grow">
                Cuéntanos sobre tu equipo y tus objetivos. Te mostramos cómo estructurar
                un programa piloto con seguimiento y evidencia de avance.
              </p>
              <a
                href="/#contact"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#55C7E8] px-5 py-3 text-sm font-bold text-[#071A2E] hover:bg-[#7FD9F2] transition-colors"
              >
                Hablemos de tu equipo
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
