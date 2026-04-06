import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'primary' | 'success';
    showInput?: boolean;
    inputValue?: string;
    onInputChange?: (value: string) => void;
    inputPlaceholder?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'primary',
    showInput = false,
    inputValue = '',
    onInputChange,
    inputPlaceholder = '',
}) => {
    if (!isOpen) return null;

    const getButtonStyles = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            default:
                return 'theme-button-primary';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle className="w-6 h-6 text-red-600" />;
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            default:
                return null;
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={onClose}
            onKeyDown={handleKeyDown}
        >
            <div 
                className="w-full max-w-md relative max-h-[80vh] flex flex-col bg-[var(--palette-surface)] border border-[var(--palette-border)] rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-[var(--text-paragraph)] hover:opacity-80 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Scrollable content area */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-4 mb-4">
                        {getIcon()}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-[var(--text-h2)] mb-2">
                                {title}
                            </h2>
                            <div className="text-[var(--text-paragraph)] text-sm">
                                {message}
                            </div>
                        </div>
                    </div>

                    {/* Input field (for duplicate action) */}
                    {showInput && onInputChange && (
                        <div className="mt-4">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => onInputChange(e.target.value)}
                                placeholder={inputPlaceholder}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--palette-border)] bg-[var(--palette-background)] text-[var(--text-paragraph)] focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)]"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Fixed button area */}
                <div className="p-6 border-t border-[var(--palette-border)] flex items-center gap-3 shrink-0 bg-[var(--palette-surface)]">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-[var(--palette-border)] text-[var(--text-paragraph)] hover:bg-[var(--palette-border)] transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${getButtonStyles()}`}
                        disabled={showInput && !inputValue?.trim()}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
