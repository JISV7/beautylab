import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [fullName, setFullName] = useState('');
    const [fiscalAddress, setFiscalAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setFullName(user?.full_name ?? '');
        setFiscalAddress(user?.fiscal_address ?? '');
    }, [user]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setIsSaving(true);

        try {
            await updateProfile({
                full_name: fullName || undefined,
                fiscal_address: fiscalAddress || undefined,
            });
            setMessage('Your profile was updated successfully.');
        } catch (submitError: any) {
            setError(submitError?.message || 'Unable to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="palette-surface palette-border border rounded-3xl p-8">
                <div className="flex flex-col gap-3 mb-6">
                    <h1 className="text-h3 font-semibold text-paragraph">Settings</h1>
                    <p className="text-paragraph opacity-75 max-w-2xl">
                        Edit your account details here. Right now you can update your name and your fiscal address.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-paragraph block font-medium">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                className="auth-input w-full py-3 px-4 rounded-xl"
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-paragraph block font-medium">Fiscal Address</label>
                            <input
                                type="text"
                                value={fiscalAddress}
                                onChange={(event) => setFiscalAddress(event.target.value)}
                                className="auth-input w-full py-3 px-4 rounded-xl"
                                placeholder="Complete address for invoices"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-paragraph opacity-75">
                            Logged in as {user?.email ?? 'your account'}.
                        </p>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center rounded-xl bg-palette-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="palette-surface palette-border border rounded-3xl p-6">
                <h2 className="text-h5 font-semibold text-paragraph mb-2">More options coming soon</h2>
                <p className="text-paragraph opacity-70">
                    This section will be expanded with additional account settings over time.
                </p>
            </div>
        </div>
    );
};
