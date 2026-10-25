import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validateRif, normalizeRif } from '../utils/rif';

export const SettingsPage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [fullName, setFullName] = useState('');
    const [fiscalAddress, setFiscalAddress] = useState('');
    const [rif, setRif] = useState('');
    const [rifError, setRifError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setFullName(user?.full_name ?? '');
        setFiscalAddress(user?.fiscal_address ?? '');
        setRif(user?.rif ? normalizeRif(user.rif) : '');
        setRifError('');
    }, [user]);

    const handleRifBlur = () => {
        if (rif) {
            const validation = validateRif(rif);
            if (validation.isValid) {
                setRif(validation.normalizedRif);
                setRifError('');
            } else {
                setRifError(validation.errorMessage);
            }
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setRifError('');
        setIsSaving(true);

        let normalizedRif: string | undefined;
        if (rif) {
            const validation = validateRif(rif);
            if (!validation.isValid) {
                setRifError(validation.errorMessage);
                setError('Corrige el campo RIF antes de guardar.');
                setIsSaving(false);
                return;
            }
            normalizedRif = validation.normalizedRif;
            // Update UI with autocompleted RIF if necessary
            setRif(normalizedRif);
        }

        try {
            await updateProfile({
                full_name: fullName || undefined,
                fiscal_address: fiscalAddress || undefined,
                rif: normalizedRif,
            });
            setMessage('Tu perfil se actualizó correctamente.');
        } catch (submitError: any) {
            setError(submitError?.message || 'No pudimos actualizar tu perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="palette-surface palette-border border rounded-3xl p-8">
                <div className="flex flex-col gap-3 mb-6">
                    <h1 className="text-h3 font-semibold text-paragraph">Configuración</h1>
                    <p className="text-paragraph opacity-75 max-w-2xl">
                        Edita los datos de tu cuenta. Por ahora puedes actualizar tu nombre y domicilio fiscal.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-paragraph block font-medium">Nombre completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                className="auth-input w-full py-3 px-4 rounded-xl"
                                placeholder="Tu nombre completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-paragraph block font-medium">Domicilio fiscal</label>
                            <input
                                type="text"
                                value={fiscalAddress}
                                onChange={(event) => setFiscalAddress(event.target.value)}
                                className="auth-input w-full py-3 px-4 rounded-xl"
                                placeholder="Dirección completa para facturas"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-paragraph block font-medium">RIF</label>
                            <input
                                type="text"
                                value={rif}
                                onChange={(event) => setRif(event.target.value.toUpperCase().replace(/[-\s]/g, ''))}
                                onBlur={handleRifBlur}
                                className={`auth-input w-full py-3 px-4 rounded-xl ${rifError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="V123456784"
                                maxLength={10}
                            />
                            {rifError ? (
                                <p className="text-paragraph text-red-600 dark:text-red-400 mt-1">
                                    {rifError}
                                </p>
                            ) : (
                                <p className="text-paragraph opacity-60 mt-1">
                                    Usa el formato <code className="font-mono">V123456784</code> con dígito verificador válido.
                                </p>
                            )}
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
                            Sesión iniciada como {user?.email ?? 'tu cuenta'}.
                        </p>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center rounded-xl bg-palette-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="palette-surface palette-border border rounded-3xl p-6">
                <h2 className="text-h5 font-semibold text-paragraph mb-2">Más opciones próximamente</h2>
                <p className="text-paragraph opacity-70">
                    Ampliaremos esta sección con opciones adicionales de cuenta.
                </p>
            </div>
        </div>
    );
};
