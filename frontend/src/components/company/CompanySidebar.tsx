import React from 'react';
import { BookOpen, Building2, LayoutDashboard, LogOut, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { BrandLogo } from '../brand/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';

export type CompanyTab = 'inicio' | 'departamentos' | 'clases' | 'directorio';

const NAV_ITEMS: { id: CompanyTab; label: string; icon: React.ElementType }[] = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'departamentos', label: 'Departamentos', icon: Building2 },
  { id: 'clases', label: 'Gestión de Clases', icon: BookOpen },
  { id: 'directorio', label: 'Directorio y Usuarios', icon: Users },
];

interface CompanySidebarProps {
  activeTab: CompanyTab;
  onNavigate: (tab: CompanyTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CompanySidebar: React.FC<CompanySidebarProps> = ({
  activeTab,
  onNavigate,
  isOpen = false,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0D2B4D] transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <Link to="/empresa" className="inline-flex items-center" onClick={onClose}>
            <BrandLogo variant="compact" theme="dark" size="sm" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-[#CBD5E1] hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7E97AE]">
            Panel de empresa
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Navegación de empresa">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose?.();
                }}
                className={`company-nav-item ${isActive ? 'company-nav-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="rounded-lg bg-white/5 px-3 py-3 mb-2">
            <p className="text-sm font-semibold text-white truncate">
              {user?.full_name || user?.email || 'Usuario'}
            </p>
            <p className="text-xs text-[#9FB4C7] truncate">{user?.email}</p>
          </div>
          <Link
            to="/"
            className="company-nav-item text-sm"
            onClick={onClose}
          >
            Volver al sitio
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="company-nav-item text-sm"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};
