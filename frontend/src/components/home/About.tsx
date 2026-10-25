import React from 'react';
import { Compass, Lightbulb, Target, TrendingUp } from 'lucide-react';

const aboutFeatures = [
  {
    id: 'mision',
    icon: Target,
    title: 'Misión',
    description:
      'Brindar a las empresas latinoamericanas una plataforma tecnológica accesible, segura y especializada para la capacitación continua de sus colaboradores, con soporte personalizado en español, pagos en moneda local y certificaciones verificables.',
  },
  {
    id: 'vision',
    icon: Compass,
    title: 'Visión 2029',
    description:
      'Consolidar más de 100 empresas B2B activas y capacitar de forma recurrente a más de 5.000 empleados. Una meta de crecimiento, no un resultado alcanzado.',
  },
  {
    id: 'enfoque',
    icon: Lightbulb,
    title: 'Enfoque',
    description:
      'Formación aplicada a la operación real: contenidos en español, casos cercanos a la industria y rutas de aprendizaje que RR. HH. y líderes pueden gestionar sin fricción.',
  },
  {
    id: 'impacto',
    icon: TrendingUp,
    title: 'Impacto con evidencia',
    description:
      'Seguimiento de progreso, reportes claros y certificados verificables. Nuestra meta piloto es una finalización igual o superior al 80% en los cursos asignados durante los primeros 30 días.',
  },
];

export const About: React.FC = () => {
  return (
    <section id="about" className="py-16 lg:py-24 palette-surface border-y palette-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--palette-secondary)] mb-3">
              Sobre Cursorg
            </p>
            <h2 className="text-h2 mb-4">Tu equipo crece con evidencia.</h2>
            <p className="text-paragraph text-lg opacity-80 mb-6">
              Cursorg es la plataforma de capacitación corporativa pensada para empresas
              que necesitan formar equipos en español, operar en su moneda y demostrar
              avance con datos claros.
            </p>
            <div className="rounded-2xl border palette-border bg-[var(--palette-background)] p-5">
              <p className="text-sm font-semibold text-[var(--palette-secondary)] mb-2">
                Formación que habla tu idioma y opera en tu moneda.
              </p>
              <p className="text-paragraph text-sm opacity-70">
                Menos fricción administrativa. Más tiempo para lo que importa: que tu
                equipo aprenda y aplique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aboutFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.id}
                  className="palette-background palette-border border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--palette-secondary)]/10 flex items-center justify-center mb-4">
                    <Icon
                      className="w-5 h-5 text-[var(--palette-secondary)]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-h4 mb-2">{feature.title}</h3>
                  <p className="text-paragraph text-sm opacity-75 leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
