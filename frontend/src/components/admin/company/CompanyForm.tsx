import { useState, useEffect, useRef } from 'react';
import { X, Building, FileText, MapPin, Phone, Mail, Image as ImageIcon, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import type { CompanyInfo, CompanyInfoCreate } from '../../../data/company.types';
import { validateRif, getExpectedRif } from '../../../utils/rif';
import { validatePhone } from '../../../utils/phone';
import { Modal } from '../Modal';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Axios instance with auth
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface CompanyFormProps {
  company?: CompanyInfo | null;
  formData: CompanyInfoCreate;
  onChange: (field: keyof CompanyInfoCreate, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  formData,
  onChange,
  onSave,
  onCancel,
  saving = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rifError, setRifError] = useState('');
  const [rifValid, setRifValid] = useState(false);
  const [expectedRif, setExpectedRif] = useState('');
  const [documentType, setDocumentType] = useState('J');
  const [documentNumber, setDocumentNumber] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Extract document number from RIF when editing
  useEffect(() => {
    if (company?.rif) {
      const rifMatch = company.rif.match(/^([A-Z])(\d+)-?(\d)$/);
      if (rifMatch) {
        setDocumentType(rifMatch[1]);
        setDocumentNumber(rifMatch[2]);
      }
    }
  }, [company]);

  // Validate RIF when document type, number, or RIF changes
  useEffect(() => {
    if (!documentNumber || !documentType) {
      setRifError('');
      setRifValid(false);
      setExpectedRif('');
      return;
    }

    // Calculate expected RIF based on document type and number
    const expected = getExpectedRif(documentType, documentNumber);
    setExpectedRif(expected);

    // Validate the entered RIF
    if (formData.rif) {
      const validation = validateRif(formData.rif);
      if (!validation.isValid) {
        setRifError(validation.errorMessage);
        setRifValid(false);
      } else {
        setRifError('');
        setRifValid(true);
      }
    } else {
      setRifError('');
      setRifValid(false);
    }
  }, [documentType, documentNumber, formData.rif]);

  const handleRifChange = (value: string) => {
    onChange('rif', value.toUpperCase());
  };

  const handleDocumentNumberChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setDocumentNumber(cleanValue);
    // Auto-generate RIF when document number changes
    if (cleanValue.length >= 8) {
      const expected = getExpectedRif(documentType, cleanValue);
      onChange('rif', expected);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, GIF, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(false);

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await api.post('/company-info/upload-logo', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      // Update the logoUrl in the parent form with full backend URL
      onChange('logoUrl', `${API_URL}${data.url}`);

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail
        ? (typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail))
        : error.message || 'Failed to upload image';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClearLogo = () => {
    onChange('logoUrl', '');
    setUploadError('');
    setUploadSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate RIF
    const rifValidation = validateRif(formData.rif);
    if (!rifValidation.isValid) {
      setModalTitle('Validation Error');
      setModalMessage(rifValidation.errorMessage);
      setModalOpen(true);
      return;
    }

    // Normalize RIF before saving
    onChange('rif', rifValidation.normalizedRif);

    // Normalize phone before saving (if provided)
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        setModalTitle('Validation Error');
        setModalMessage(phoneValidation.errorMessage);
        setModalOpen(true);
        return;
      }
      onChange('phone', phoneValidation.normalizedPhone);
    }

    onSave();
  };

  const isEditing = !!company;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl relative max-h-[90vh] overflow-y-auto bg-[var(--palette-surface)] border border-[var(--palette-border)] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-[var(--palette-surface)] border-b border-[var(--palette-border)] p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-h2)]">
                {isEditing ? 'Edit Company Info' : 'Add Company Info'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-[var(--text-paragraph)] hover:text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-5">
            {/* Company Information Section */}
            <div className="space-y-3.5">
              <h3
                className="text-[var(--text-paragraph)] font-semibold border-b pb-2"
                style={{ borderColor: 'var(--palette-border)' }}
              >
                Company Information (Emisor)
              </h3>

              <div>
                <label className="text-[var(--text-paragraph)] block mb-1.5">
                  Business Name (Razón Social) *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-paragraph)] opacity-75" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={(e) => onChange('businessName', e.target.value)}
                    required
                    className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                    placeholder="Company Name C.A."
                    disabled={saving}
                  />
                </div>
              </div>

              {/* RIF Section */}
              <div>
                <label className="text-[var(--text-paragraph)] block mb-1.5">
                  RIF (Registro Único de Información Fiscal) *
                </label>

                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <select
                      value={documentType}
                      onChange={(e) => {
                        setDocumentType(e.target.value);
                        if (documentNumber.length >= 8) {
                          const expected = getExpectedRif(e.target.value, documentNumber);
                          onChange('rif', expected);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                      disabled={saving}
                    >
                      <option value="V">V</option>
                      <option value="E">E</option>
                      <option value="J">J</option>
                      <option value="P">P</option>
                      <option value="G">G</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => handleDocumentNumberChange(e.target.value)}
                      className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                      placeholder="12345678-9"
                      disabled={saving}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-paragraph)] opacity-75" />
                  <input
                    type="text"
                    name="rif"
                    value={formData.rif}
                    onChange={(e) => handleRifChange(e.target.value)}
                    required
                    readOnly
                    className={`w-full py-2.5 px-4 pl-11 pr-10 rounded-lg bg-[var(--palette-background)] border text-[var(--text-paragraph)] focus:outline-none ${rifValid
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : rifError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-[var(--palette-border)]'
                      }`}
                    placeholder="J-12345678-9"
                    disabled={saving}
                  />
                  {rifValid && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {rifError && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>

                {/* RIF validation messages */}
                {rifError && (
                  <p className="text-red-600 dark:text-red-400 mt-1 text-sm">
                    {rifError}
                  </p>
                )}

                {/* Show expected RIF when user has typed document number but no RIF yet */}
                {expectedRif && !formData.rif && (
                  <div
                    className="mt-2 p-3 rounded-lg border text-sm"
                    style={{
                      backgroundColor: 'var(--palette-surface)',
                      borderColor: 'var(--palette-border)',
                    }}
                  >
                    <p className="text-[var(--text-paragraph)] opacity-80 mb-2">
                      Expected RIF:
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <code
                        className="px-3 py-2 rounded font-mono font-bold"
                        style={{
                          backgroundColor: 'var(--palette-background)',
                          color: 'var(--palette-primary)',
                        }}
                      >
                        {expectedRif}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          onChange('rif', expectedRif);
                          setDocumentType(expectedRif.charAt(0));
                          setDocumentNumber(expectedRif.slice(2, -2).replace('-', ''));
                        }}
                        className="px-3 py-2 rounded font-semibold transition-colors whitespace-nowrap"
                        style={{
                          backgroundColor: 'var(--palette-primary)',
                          color: 'var(--decorator-color)',
                        }}
                        disabled={saving}
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>
                )}

                {!rifError && rifValid && formData.rif && (
                  <p className="text-green-600 dark:text-green-400 mt-1 text-sm">
                    RIF is valid
                  </p>
                )}
              </div>

              <div>
                <label className="text-[var(--text-paragraph)] block mb-1.5">
                  Fiscal Address (Domicilio Fiscal) *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-paragraph)] opacity-75" />
                  <textarea
                    name="fiscalAddress"
                    value={formData.fiscalAddress}
                    onChange={(e) => onChange('fiscalAddress', e.target.value)}
                    required
                    rows={3}
                    className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                    placeholder="Complete address: Street, Building, City, State"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[var(--text-paragraph)] block mb-1.5">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-paragraph)] opacity-75" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={(e) => onChange('phone', e.target.value)}
                      className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                      placeholder="+58 412 1234567"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[var(--text-paragraph)] block mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-paragraph)] opacity-75" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={(e) => onChange('email', e.target.value)}
                      className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                      placeholder="info@company.com"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[var(--text-paragraph)] block mb-1.5">
                  Company Logo (Optional)
                </label>
                
                {/* Logo Preview */}
                {formData.logoUrl && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={formData.logoUrl}
                      alt="Company Logo Preview"
                      className="h-24 w-auto rounded-lg border border-[var(--palette-border)] bg-[var(--palette-surface)] p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      title="Remove logo"
                      disabled={saving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Section */}
                <div className="flex items-start gap-3">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-paragraph)] opacity-75" />
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl || ''}
                      onChange={(e) => onChange('logoUrl', e.target.value)}
                      className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                      placeholder="https://example.com/logo.png or upload below"
                      disabled={saving || uploading}
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={saving || uploading}
                  />
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    disabled={saving || uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--palette-border)] text-[var(--text-paragraph)] hover:bg-[var(--palette-surface)] transition-colors disabled:opacity-50 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                </div>

                {/* Upload Status */}
                {uploadSuccess && (
                  <p className="text-green-600 dark:text-green-400 mt-2 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Logo uploaded successfully!
                  </p>
                )}
                {uploadError && (
                  <p className="text-red-600 dark:text-red-400 mt-2 text-sm">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Active Status Toggle */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--palette-border)' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive ?? false}
                    onChange={(e) => onChange('isActive', e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--palette-border)] text-[var(--palette-primary)] focus:ring-[var(--palette-primary)] focus:ring-2"
                    disabled={saving}
                  />
                  <div className="flex flex-col">
                    <span className="text-[var(--text-paragraph)] font-medium">Set as Active Company</span>
                    <span className="text-xs text-[var(--text-paragraph)] opacity-75">
                      Only one company can be active at a time. Activating this company will deactivate others.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-[var(--palette-surface)] border-t border-[var(--palette-border)] p-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--palette-border)] text-[var(--text-paragraph)] hover:bg-[var(--palette-border)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !rifValid}
              className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--palette-primary)',
                color: 'var(--decorator-color)',
              }}
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {/* Validation Error Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        footer={
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--palette-primary)',
              color: 'var(--decorator-color)',
            }}
          >
            OK
          </button>
        }
      >
        <p className="text-paragraph">{modalMessage}</p>
      </Modal>
    </div>
  );
};
