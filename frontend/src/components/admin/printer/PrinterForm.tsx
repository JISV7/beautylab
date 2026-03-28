import { useState, useEffect } from 'react';
import { X, Building, FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import type { Printer, PrinterCreate } from '../../../data/company.types';
import { validateRif, getExpectedRif } from '../../../utils/rif';

interface PrinterFormProps {
  printer?: Printer | null;
  formData: PrinterCreate;
  onChange: (field: keyof PrinterCreate, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export const PrinterForm: React.FC<PrinterFormProps> = ({
  printer,
  formData,
  onChange,
  onSave,
  onCancel,
  saving = false,
}) => {
  const [rifError, setRifError] = useState('');
  const [rifValid, setRifValid] = useState(false);
  const [expectedRif, setExpectedRif] = useState('');
  const [documentType, setDocumentType] = useState('J');
  const [documentNumber, setDocumentNumber] = useState('');
  const [authorizationDate, setAuthorizationDate] = useState('');
  const [authorizationDateError, setAuthorizationDateError] = useState('');

  // Extract document number from RIF when editing
  useEffect(() => {
    if (printer?.rif) {
      const rifMatch = printer.rif.match(/^([A-Z])(\d+)-?(\d)$/);
      if (rifMatch) {
        setDocumentType(rifMatch[1]);
        setDocumentNumber(rifMatch[2]);
      }
    }
  }, [printer]);

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

  // Validate authorization date format (DDMMAAAA)
  useEffect(() => {
    if (!authorizationDate) {
      setAuthorizationDateError('');
      return;
    }

    // Check if it's 8 digits
    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(authorizationDate)) {
      setAuthorizationDateError('Must be 8 digits (DDMMAAAA)');
      return;
    }

    // Validate date components
    const day = parseInt(authorizationDate.substring(0, 2), 10);
    const month = parseInt(authorizationDate.substring(2, 4), 10);
    const year = parseInt(authorizationDate.substring(4, 8), 10);

    if (day < 1 || day > 31) {
      setAuthorizationDateError('Invalid day (01-31)');
      return;
    }

    if (month < 1 || month > 12) {
      setAuthorizationDateError('Invalid month (01-12)');
      return;
    }

    if (year < 2000 || year > new Date().getFullYear()) {
      setAuthorizationDateError('Invalid year');
      return;
    }

    setAuthorizationDateError('');
  }, [authorizationDate]);

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

  const handleAuthorizationDateChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length <= 8) {
      setAuthorizationDate(cleanValue);
      // Format for display: DD/MM/AAAA
      if (cleanValue.length >= 4) {
        const formatted = `${cleanValue.substring(0, 2)}/${cleanValue.substring(2, 4)}/${cleanValue.substring(4)}`;
        onChange('authorizationProvidence', `${formData.authorizationProvidence.split(' ')[0] || ''} ${formatted}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate RIF
    const rifValidation = validateRif(formData.rif);
    if (!rifValidation.isValid) {
      alert(rifValidation.errorMessage);
      return;
    }

    // Validate authorization date
    if (authorizationDateError || authorizationDate.length !== 8) {
      alert('Please enter a valid authorization date (DDMMAAAA format)');
      return;
    }

    onSave();
  };

  const isEditing = !!printer;

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
              <h2 className="text-2xl font-bold text-[var(--text-h2-color)]">
                {isEditing ? 'Edit Printer' : 'Add Printer'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-[var(--text-p-color)] hover:text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-5">
            {/* Printer Information Section */}
            <div className="space-y-3.5">
              <h3
                className="text-[var(--text-p-color)] font-semibold border-b pb-2"
                style={{ borderColor: 'var(--palette-border)' }}
              >
                Printer Information (Imprenta Autorizada)
              </h3>

              <div>
                <label className="text-[var(--text-p-color)] block mb-1.5">
                  Business Name (Razón Social) *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-p-color)] opacity-75" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={(e) => onChange('businessName', e.target.value)}
                    required
                    className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-p-color)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                    placeholder="Imprentos C.A."
                    disabled={saving}
                  />
                </div>
              </div>

              {/* RIF Section */}
              <div>
                <label className="text-[var(--text-p-color)] block mb-1.5">
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
                      className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-p-color)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
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
                      className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-p-color)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                      placeholder="12345678-9"
                      disabled={saving}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-p-color)] opacity-75" />
                  <input
                    type="text"
                    name="rif"
                    value={formData.rif}
                    onChange={(e) => handleRifChange(e.target.value)}
                    required
                    readOnly
                    className={`w-full py-2.5 px-4 pl-11 pr-10 rounded-lg bg-[var(--palette-background)] border text-[var(--text-p-color)] focus:outline-none ${rifValid
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
                    <p className="text-[var(--text-p-color)] opacity-80 mb-2">
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

              {/* Authorization Providence Section */}
              <div>
                <label className="text-[var(--text-p-color)] block mb-1.5">
                  Authorization Providence (Providencia Administrativa) *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-p-color)] opacity-75" />
                  <input
                    type="text"
                    name="authorizationProvidence"
                    value={formData.authorizationProvidence}
                    onChange={(e) => onChange('authorizationProvidence', e.target.value)}
                    required
                    className="w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-[var(--text-p-color)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                    placeholder="SNAT/2023/001234"
                    disabled={saving}
                  />
                </div>
                <p className="text-xs text-[var(--text-p-color)] opacity-60 mt-1">
                  Example: SNAT/2023/001234
                </p>
              </div>

              {/* Authorization Date Section */}
              <div>
                <label className="text-[var(--text-p-color)] block mb-1.5">
                  Authorization Date (Fecha de Asignación) *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-p-color)] opacity-75" />
                  <input
                    type="text"
                    value={authorizationDate}
                    onChange={(e) => handleAuthorizationDateChange(e.target.value)}
                    required
                    className={`w-full py-2.5 px-4 pl-11 rounded-lg bg-[var(--palette-surface)] border text-[var(--text-p-color)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] ${authorizationDateError ? 'border-red-500' : 'border-[var(--palette-border)]'
                      }`}
                    placeholder="DDMMAAAA (e.g., 15012023)"
                    disabled={saving}
                    maxLength={8}
                  />
                </div>
                {authorizationDate && authorizationDate.length >= 4 && (
                  <p className="text-xs text-[var(--text-p-color)] opacity-60 mt-1">
                    Formatted: {authorizationDate.substring(0, 2)}/{authorizationDate.substring(2, 4)}/{authorizationDate.substring(4)}
                  </p>
                )}
                {authorizationDateError && (
                  <p className="text-red-600 dark:text-red-400 mt-1 text-sm">
                    {authorizationDateError}
                  </p>
                )}
                {!authorizationDateError && authorizationDate.length === 8 && (
                  <p className="text-green-600 dark:text-green-400 mt-1 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid date format
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-[var(--palette-surface)] border-t border-[var(--palette-border)] p-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--palette-border)] text-[var(--text-p-color)] hover:bg-[var(--palette-border)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !rifValid || !!authorizationDateError || authorizationDate.length !== 8}
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
    </div>
  );
};
