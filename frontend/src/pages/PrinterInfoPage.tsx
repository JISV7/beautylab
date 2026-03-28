import { useState, useEffect } from 'react';
import axios from 'axios';
import { PrinterTable, PrinterForm } from '../components/admin/printer';
import type { Printer, PrinterCreate } from '../data/company.types';

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

export default function PrinterInfoPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [formData, setFormData] = useState<PrinterCreate>({
    businessName: '',
    rif: '',
    authorizationProvidence: '',
  });

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/printers/');
      setPrinters(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch printers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleOpenForm = (printer?: Printer) => {
    if (printer) {
      setEditingPrinter(printer);
      setFormData({
        businessName: printer.businessName,
        rif: printer.rif,
        authorizationProvidence: printer.authorizationProvidence,
      });
    } else {
      setEditingPrinter(null);
      setFormData({
        businessName: '',
        rif: '',
        authorizationProvidence: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingPrinter) {
        await api.patch(`/printers/${editingPrinter.id}`, formData);
      } else {
        await api.post('/printers/', formData);
      }
      setIsFormOpen(false);
      fetchPrinters();
    } catch (error: any) {
      console.error('Failed to save printer:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (printer: Printer) => {
    try {
      await api.delete(`/printers/${printer.id}`);
      setPrinters(printers.filter((p) => p.id !== printer.id));
    } catch (error: any) {
      console.error('Failed to delete printer:', error);
    }
  };

  const handleFormChange = (field: keyof PrinterCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading && printers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-p-color">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PrinterTable
        printers={printers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEdit={handleOpenForm}
        onDelete={handleDelete}
        onAdd={() => handleOpenForm()}
      />

      {isFormOpen && (
        <PrinterForm
          printer={editingPrinter}
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
