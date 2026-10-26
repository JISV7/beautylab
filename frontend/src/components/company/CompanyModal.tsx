import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0D2B4D]/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-modal-title"
        className="relative z-10 w-full max-w-lg flex flex-col max-h-[85vh] rounded-xl bg-white border border-[#E2E8F0] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 id="company-modal-title" className="text-lg font-bold text-[#0D2B4D]">
              {title}
            </h2>
            {description && <p className="text-sm text-[#6E7882] mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6E7882] hover:bg-[#F1F5F9]"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
