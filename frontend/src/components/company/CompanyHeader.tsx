import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import type { CompanyProfile } from '../../lib/companyApi';

interface CompanyHeaderProps {
  company: CompanyProfile | null;
  onMenuToggle: () => void;
}

const initials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ company, onMenuToggle }) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#475569] hover:bg-[#F1F5F9]"
          aria-label="Abrir menú de empresa"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex flex-1 max-w-md">
          <div className="flex w-full items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 focus-within:border-[#1E5AA8] focus-within:ring-2 focus-within:ring-[#1E5AA8]/15">
            <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar colaboradores, clases o departamentos..."
              aria-label="Buscar en el panel de empresa"
              className="w-full bg-transparent px-2 py-2 text-sm text-[#0D2B4D] placeholder:text-[#94A3B8] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        <button
          type="button"
          className="relative w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#475569] hover:bg-[#F1F5F9]"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute right-2.5 top-2.5 w-2 h-2 rounded-full bg-[#55C7E8]" />
        </button>

        <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l sm:border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-full bg-[#0D2B4D] text-white flex items-center justify-center text-xs font-bold">
            {initials(company?.name || 'Cursorg')}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-semibold text-[#0D2B4D] leading-tight truncate max-w-[180px]">
              {company?.name || 'Mi empresa'}
            </p>
            <p className="text-xs text-[#6E7882] leading-tight truncate max-w-[180px]">
              {company?.sector || 'Panel corporativo'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
