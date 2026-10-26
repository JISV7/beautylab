import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { CompanyLayout } from '../components/company/CompanyLayout';
import { OverviewPanel } from '../components/company/OverviewPanel';
import { DepartmentsPanel } from '../components/company/DepartmentsPanel';
import { ClassesPanel } from '../components/company/ClassesPanel';
import { DirectoryPanel } from '../components/company/DirectoryPanel';
import type { CompanyTab } from '../components/company/CompanySidebar';
import { companyApi, getApiErrorMessage, type CompanyProfile } from '../lib/companyApi';

const VALID_TABS: CompanyTab[] = ['inicio', 'departamentos', 'clases', 'directorio'];

export function CompanyDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as CompanyTab | null;
  const activeTab: CompanyTab =
    rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'inicio';

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    companyApi
      .getProfile()
      .then((profile) => {
        if (active) setCompany(profile);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          getApiErrorMessage(
            err,
            'No se pudo cargar el espacio de empresa. Verifica tu acceso.',
          ),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleNavigate = (tab: CompanyTab) => {
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="min-h-screen company-shell flex items-center justify-center text-[#6E7882]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Cargando espacio de empresa...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen company-shell flex items-center justify-center p-6">
        <div className="company-card max-w-md w-full p-8 text-center">
          <h1 className="text-lg font-bold text-[#0D2B4D]">Acceso no disponible</h1>
          <p className="text-sm text-[#6E7882] mt-2">{error}</p>
          <Link
            to="/dashboard"
            className="company-btn-primary mt-6 inline-flex"
          >
            Ir a mi panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CompanyLayout activeTab={activeTab} onNavigate={handleNavigate} company={company}>
      {activeTab === 'inicio' && <OverviewPanel />}
      {activeTab === 'departamentos' && <DepartmentsPanel />}
      {activeTab === 'clases' && <ClassesPanel />}
      {activeTab === 'directorio' && <DirectoryPanel />}
    </CompanyLayout>
  );
}
