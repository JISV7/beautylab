import React from 'react';

const companies = [
  'Andina Industrial',
  'TecnoSur',
  'Grupo Meridian',
  'FerroCaribe',
  'NovaBank',
  'LogiPlaza',
  'AgroValle',
];

export const TrustedBy: React.FC = () => {
  const marquee = [...companies, ...companies];

  return (
    <section className="py-10 palette-surface border-y palette-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-6">
          Empresas que confían en Cursorg
        </p>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--palette-surface)] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--palette-surface)] to-transparent z-10" />
          <div className="logo-track items-center gap-10 sm:gap-14">
            {marquee.map((name, index) => (
              <div
                key={`${name}-${index}`}
                className="flex items-center gap-2 whitespace-nowrap text-[#6E7882] grayscale opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-[#6E7882]" aria-hidden="true" />
                <span className="text-sm sm:text-base font-bold tracking-[0.08em] uppercase">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
