import { useState, useEffect } from 'react';
import axios from 'axios';
import { PrinterTable, PrinterForm } from '../components/admin/printer';
import { ConfirmModal } from '../components/admin/ConfirmModal';
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
    isActive: false,
  });
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
    printer: Printer | null;
  }>({
    isOpen: false,
    printer: null,
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
        isActive: printer.isActive,
      });
    } else {
      setEditingPrinter(null);
      setFormData({
        businessName: '',
        rif: '',
        authorizationProvidence: '',
        isActive: false,
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

  const handleDelete = (printer: Printer) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Printer',
      message: (
        <>
          Are you sure you want to delete <strong>"{printer.businessName}"</strong>?
          <br />
          <span className="text-red-600 dark:text-red-400 mt-2 block">
            This action cannot be undone.
          </span>
        </>
      ),
      confirmText: 'Delete',
      onConfirm: () => {
        executeDelete(printer);
      },
    });
  };

  const executeDelete = async (printer: Printer) => {
    try {
      await api.delete(`/printers/${printer.id}`);
      setPrinters(printers.filter((p) => p.id !== printer.id));
    } catch (error: any) {
      console.error('Failed to delete printer:', error);
    }
  };

  const handleFormChange = (field: keyof PrinterCreate, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetActive = (printer: Printer) => {
    setSetActiveModal({
      isOpen: true,
      printer,
    });
  };

  const confirmSetActive = async () => {
    if (!setActiveModal.printer) return;
    try {
      setSaving(true);
      await api.post(`/printers/${setActiveModal.printer.id}/set-active`);
      setSetActiveModal({ isOpen: false, printer: null });
      fetchPrinters();
    } catch (error: any) {
      console.error('Failed to set active printer:', error);
    } finally {
      setSaving(false);
    }
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
        onSetActive={handleSetActive}
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

      {/* Delete Confirmation Modal */}
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
        title="Set Active Printer"
        message={
          <>
            <p className="text-p-color mb-3">
              Are you sure you want to set <strong>"{setActiveModal.printer?.businessName}"</strong> as the active printer?
            </p>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--palette-surface)',
                borderColor: 'var(--palette-border)',
              }}
            >
              <p className="text-sm text-[var(--text-p-color)] opacity-80">
                <strong>Note:</strong> This will automatically deactivate all other printers and their control number ranges. Only one printer can be active at a time.
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
