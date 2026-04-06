import React, { useState } from 'react';
import { X, Gift, Mail, MessageSquare } from 'lucide-react';

export interface GiftLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (email: string, message?: string) => void;
    licenseCode?: string;
}

export const GiftLicenseModal: React.FC<GiftLicenseModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    licenseCode,
}) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        onConfirm(email, message || undefined);
        setEmail('');
        setMessage('');
        setError('');
    };

    const handleClose = () => {
        setEmail('');
        setMessage('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-md palette-surface palette-border border rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--palette-border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--palette-primary)]/10 rounded-lg">
                            <Gift size={20} className="text-[var(--palette-primary)]" />
                        </div>
                        <h2 className="text-h4">
                            Gift License
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[var(--palette-border)] rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={18} className="text-paragraph" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {licenseCode && (
                            <div className="p-3 bg-[var(--palette-background)] rounded-lg">
                                <p className="text-[10px] font-bold text-paragraph opacity-40 uppercase mb-1">
                                    License Code
                                </p>
                                <code className="text-xs font-mono text-paragraph">
                                    {licenseCode}
                                </code>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-bold text-paragraph uppercase tracking-wider mb-2">
                                Recipient Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-paragraph opacity-40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="friend@example.com"
                                    className="w-full py-2.5 pl-11 pr-4 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-paragraph focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Optional Message */}
                        <div>
                            <label className="block text-xs font-bold text-paragraph uppercase tracking-wider mb-2">
                                Message (Optional)
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-paragraph opacity-40" />
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Add a personal message..."
                                    rows={3}
                                    className="w-full py-2.5 pl-11 pr-4 rounded-lg bg-[var(--palette-surface)] border border-[var(--palette-border)] text-paragraph focus:outline-none focus:ring-2 focus:ring-[var(--palette-primary)] transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        )}

                        {/* Info */}
                        <div className="p-3 bg-[var(--palette-background)] rounded-lg">
                            <p className="text-xs text-paragraph opacity-60">
                                The recipient will receive an email with instructions on how to redeem this license.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 p-6 border-t border-[var(--palette-border)]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--palette-border)] text-paragraph hover:bg-[var(--palette-border)] transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--palette-primary)] text-[var(--decorator-color)] hover:opacity-90 transition-opacity font-medium"
                        >
                            Send Gift
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
