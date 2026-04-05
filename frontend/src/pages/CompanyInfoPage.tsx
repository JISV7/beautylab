import { useState, useEffect } from 'react';
import axios from 'axios';
import { CompanyTable, CompanyForm } from '../components/admin/company';
import { ConfirmModal } from '../components/admin/ConfirmModal';
import type { CompanyInfo, CompanyInfoCreate } from '../data/company.types';

const API_URL = 'http://localhost:8000';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function CompanyInfoPage() {
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyInfo | null>(null);
  const [formData, setFormData] = useState<CompanyInfoCreate>({
    businessName: '',
    rif: '',
    fiscalAddress: '',
    phone: '',
    email: '',
    logoUrl: '',
    isActive: false,
  });
  const [companyToDelete, setCompanyToDelete] = useState<CompanyInfo | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'danger' | 'primary' | 'success';
    title: string;
    message: string | React.ReactNode;
    confirmText: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    type: 'primary',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null,
  });
  const [setActiveModal, setSetActiveModal] = useState<{
    isOpen: boolean;
    company: CompanyInfo | null;
  }>({
    isOpen: false,
    company: null,
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company-info/');
      setCompanies(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenForm = (company?: CompanyInfo) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        businessName: company.businessName,
        rif: company.rif,
        fiscalAddress: company.fiscalAddress,
        phone: company.phone || '',
        email: company.email || '',
        logoUrl: company.logoUrl || '',
        isActive: company.isActive,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        businessName: '',
        rif: '',
        fiscalAddress: '',
        phone: '',
        email: '',
        logoUrl: '',
        isActive: false,
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingCompany) {
        await api.patch(`/company-info/${editingCompany.id}`, formData);
      } else {
        await api.post('/company-info/', formData);
      }
      setIsFormOpen(false);
      fetchCompanies();
    } catch (error: any) {
      console.error('Failed to save company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (company: CompanyInfo) => {
    setCompanyToDelete(company);
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Company Info',
      message: (
        <>
          Are you sure you want to delete <strong>"{company.businessName}"</strong>?
          <br />
          <span className="text-red-600 dark:text-red-400 mt-2 block">
            This action cannot be undone.
          </span>
        </>
      ),
      confirmText: 'Delete',
      onConfirm: () => {
        executeDelete();
      },
    });
  };

  const executeDelete = async () => {
    if (!companyToDelete) return;
    try {
      await api.delete(`/company-info/${companyToDelete.id}`);
      fetchCompanies();
      setCompanyToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete company:', error);
    }
  };

  const handleFormChange = (field: keyof CompanyInfoCreate, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetActive = (company: CompanyInfo) => {
    setSetActiveModal({
      isOpen: true,
      company,
    });
  };

  const confirmSetActive = async () => {
    if (!setActiveModal.company) return;
    try {
      setSaving(true);
      await api.post(`/company-info/${setActiveModal.company.id}/set-active`);
      setSetActiveModal({ isOpen: false, company: null });
      fetchCompanies();
    } catch (error: any) {
      console.error('Failed to set active company:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-p-color">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-h1-size font-bold mb-1">Company Information</h1>
        <p className="text-p-font text-p-size text-p-color">
          Manage your company&apos;s legal name, RIF, fiscal address, and
          branding details.
        </p>
      </div>

      <CompanyTable
        companies={companies}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEdit={handleOpenForm}
        onDelete={handleDelete}
        onAdd={() => handleOpenForm()}
        onSetActive={handleSetActive}
      />

      {isFormOpen && (
        <CompanyForm
          company={editingCompany}
          formData={formData}
          onChange={handleFormChange}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
          saving={saving}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />

      {/* Set Active Confirmation Modal */}
      <ConfirmModal
        isOpen={setActiveModal.isOpen}
        onClose={() => setSetActiveModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmSetActive}
        title="Set Active Company"
        message={
          <>
            <p className="text-p-color mb-3">
              Are you sure you want to set <strong>"{setActiveModal.company?.businessName}"</strong> as the active company?
            </p>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--palette-surface)',
                borderColor: 'var(--palette-border)',
              }}
            >
              <p className="text-sm text-[var(--text-p-color)] opacity-80">
                <strong>Note:</strong> This will automatically deactivate all other companies. Only one company can be active at a time.
              </p>
            </div>
          </>
        }
        confirmText="Set Active"
        type="primary"
      />
    </div>
  );
}
