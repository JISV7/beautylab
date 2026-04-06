import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
}) => {
    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal - flex layout for proper scrolling */}
            <div
                className="relative z-10 w-full max-w-md mx-4 flex flex-col max-h-[80vh] palette-surface palette-border border rounded-xl shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header - shrink-0 to stay fixed */}
                <div className="shrink-0 flex items-center justify-between p-6 border-b palette-border">
                    <h2 id="modal-title" className="text-xl font-bold text-paragraph">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-paragraph" />
                    </button>
                </div>

                {/* Content - scrollable */}
                <div className="overflow-y-auto flex-1 p-6">
                    {children}
                </div>

                {/* Footer - shrink-0 to stay fixed */}
                {footer && (
                    <div className="shrink-0 flex items-center justify-end gap-3 p-6 border-t palette-border">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
