import { X } from 'lucide-react';
import type { Printer, PrinterCreate } from '../../../data/company.types';

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onChange(name as keyof PrinterCreate, value);
  };

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
          <div className="sticky top-0 bg-[var(--palette-surface)] border-b border-[var(--palette-border)] p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[var(--text-h2-color)]">
              {printer ? 'Edit Printer' : 'Add Printer'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-p-color hover:text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-p-color mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-p-color mb-1">
                RIF (Tax ID) *
              </label>
              <input
                type="text"
                name="rif"
                value={formData.rif}
                onChange={handleChange}
                required
                placeholder="J-12345678-9"
                className="w-full px-4 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-p-color mb-1">
                Authorization Providence *
              </label>
              <textarea
                name="authorizationProvidence"
                value={formData.authorizationProvidence}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Providencia Administrativa Nro. SNAT/2023/001234"
                className="w-full px-4 py-2 rounded-lg palette-surface palette-border border text-p-font text-p-size text-p-color focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
              />
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
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : printer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
