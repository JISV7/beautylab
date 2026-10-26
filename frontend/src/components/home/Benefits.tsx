import React from 'react';
import { BadgeCheck, Globe2, Headset, Wallet } from 'lucide-react';

const benefits = [
  {
    id: 'currency',
    icon: Wallet,
    title: 'Opera en tu moneda',
    description:
      'Paga y factura en moneda local con procesos contables claros para tu empresa.',
  },
  {
    id: 'support',
    icon: Headset,
    title: 'Soporte en español',
    description:
      'Acompañamiento humano para RR. HH., operaciones y equipos de formación.',
  },
  {
    id: 'evidence',
    icon: BadgeCheck,
    title: 'Evidencia de progreso',
    description:
      'Certificados verificables y reportes de avance listos para auditorías.',
  },
];

export const Benefits: React.FC = () => {
  return (
    <section className="py-16 lg:py-20 palette-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--palette-secondary)] mb-3">
            Por qué Cursorg
          </p>
          <h2 className="text-h2 mb-4">Capacitación que se adapta a tu operación</h2>
          <p className="text-paragraph text-lg opacity-80">
            Un programa corporativo pensado para empresas latinoamericanas que necesitan
            resultados medibles sin fricción administrativa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.id}
                className="palette-surface palette-border border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#55C7E8]/15 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-[#55C7E8]" aria-hidden="true" />
                </div>
                <h3 className="text-h4 mb-2">{benefit.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{benefit.description}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-[#1E5AA8]/15 bg-[#1E5AA8]/5 px-5 py-4">
          <Globe2 className="w-5 h-5 text-[#1E5AA8] flex-shrink-0" aria-hidden="true" />
          <p className="text-paragraph text-sm">
            Contenido y soporte en español, con una experiencia lista para equipos
            distribuidos en toda la región.
          </p>
        </div>
      </div>
    </section>
  );
};
