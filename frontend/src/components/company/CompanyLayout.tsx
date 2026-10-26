import React, { useState } from 'react';
import { CompanyHeader } from './CompanyHeader';
import { CompanySidebar, type CompanyTab } from './CompanySidebar';
import type { CompanyProfile } from '../../lib/companyApi';

interface CompanyLayoutProps {
  children: React.ReactNode;
  activeTab: CompanyTab;
  onNavigate: (tab: CompanyTab) => void;
  company: CompanyProfile | null;
}

export const CompanyLayout: React.FC<CompanyLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  company,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex company-shell">
      <CompanySidebar
        activeTab={activeTab}
        onNavigate={(tab) => {
          onNavigate(tab);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <CompanyHeader company={company} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
