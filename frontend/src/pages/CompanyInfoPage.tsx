import { useState, useEffect } from 'react';
import axios from 'axios';
import { CompanyTable, CompanyForm } from '../components/admin/company';
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
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company-info/');
      setCompanies(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch companies:', error);
      alert(error.response?.data?.detail || 'Failed to load company information.');
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
      alert(error.response?.data?.detail || 'Failed to save company information.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company: CompanyInfo) => {
    try {
      await api.delete(`/company-info/${company.id}`);
      fetchCompanies();
    } catch (error: any) {
      console.error('Failed to delete company:', error);
      alert(error.response?.data?.detail || 'Failed to delete company information.');
    }
  };

  const handleFormChange = (field: keyof CompanyInfoCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <CompanyTable
        companies={companies}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEdit={handleOpenForm}
        onDelete={handleDelete}
        onAdd={() => handleOpenForm()}
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
    </div>
  );
}
