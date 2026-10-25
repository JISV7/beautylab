import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone, MapPin, FileText, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { validateRif, getExpectedRif } from '../../utils/rif';
import { validatePhone } from '../../utils/phone';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const { register } = useAuth();
  
  // Personal information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Fiscal information
  const [documentType, setDocumentType] = useState('V');
  const [documentNumber, setDocumentNumber] = useState('');
  const [rif, setRif] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isContributor, setIsContributor] = useState(false);
  
  // RIF validation state
  const [rifError, setRifError] = useState('');
  const [rifValid, setRifValid] = useState(false);
  const [expectedRif, setExpectedRif] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (rif) {
      const validation = validateRif(rif);
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
  }, [documentType, documentNumber, rif]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    // Validate RIF
    const rifValidation = validateRif(rif);
    if (!rifValidation.isValid) {
      setError(rifValidation.errorMessage);
      return;
    }

    // Validate phone (Venezuelan format)
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.errorMessage);
      return;
    }

    setIsLoading(true);
    try {
      await register(
        name,
        email,
        password,
        documentType,
        documentNumber,
        rifValidation.normalizedRif,
        fiscalAddress,
        phoneValidation.normalizedPhone,
        businessName || undefined,
        isContributor,
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLegalEntity = documentType === 'J';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-h2 mb-1.5">Crea tu cuenta</h2>
        <p className="text-paragraph text-sm">
          Registra a tu empresa y comienza a capacitar a tu equipo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information Section */}
        <div className="space-y-3.5">
          <h3
            className="text-paragraph font-semibold border-b pb-2"
            style={{
              borderColor: 'var(--palette-border)',
            }}
          >
            Datos personales
          </h3>
          
          <div>
            <label className="text-paragraph block mb-1.5">
              Nombre completo {isLegalEntity ? '(representante)' : '*'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
                placeholder={isLegalEntity ? 'Nombre del representante' : 'Ej. María Pérez'}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="text-paragraph block mb-1.5">
              Correo electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
                placeholder="tu@empresa.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          {isLegalEntity && (
            <div>
              <label className="text-paragraph block mb-1.5">
                Razón social *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
                  placeholder="Nombre de la empresa C.A."
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-paragraph block mb-1.5">
                Tipo de documento *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg appearance-none bg-white dark:bg-gray-800"
                  disabled={isLoading}
                >
                  <option value="V">V - Venezolano</option>
                  <option value="E">E - Residente</option>
                  <option value="J">J - Persona jurídica</option>
                  <option value="P">P - Pasaporte</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-paragraph block mb-1.5">
                Número de documento *
              </label>
              <input
                type="text"
                required
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="auth-input w-full py-2.5 px-4 rounded-lg"
                placeholder={documentType === 'P' ? 'Número de pasaporte' : 'Número de cédula'}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="text-paragraph block mb-1.5">
              RIF (identificación fiscal) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={rif}
                onChange={(e) => setRif(e.target.value.toUpperCase())}
                className={`auth-input w-full py-2.5 px-4 rounded-lg pr-10 ${
                  rifValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                  rifError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="V-12345678-9"
                disabled={isLoading}
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
              <p className="text-paragraph text-red-600 dark:text-red-400 mt-1">
                {rifError}
              </p>
            )}

            {/* Show expected RIF when user has typed document number but no RIF yet */}
            {expectedRif && !rif && (
              <div className="mt-2 p-3 rounded-lg border text-paragraph"
                style={{
                  backgroundColor: 'var(--palette-surface)',
                  borderColor: 'var(--palette-border)',
                }}
              >
                <p className="text-paragraph opacity-80 mb-2">
                  Tu RIF esperado es:
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code
                    className="text-paragraph px-3 py-2 rounded font-mono font-bold"
                    style={{
                      backgroundColor: 'var(--palette-background)',
                      color: 'var(--palette-primary)',
                    }}
                  >
                    {expectedRif}
                  </code>
                  <button
                    type="button"
                    onClick={() => setRif(expectedRif)}
                    className="text-paragraph px-3 py-2 rounded font-semibold transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--palette-primary)',
                      color: 'var(--decorator-color)',
                    }}
                    disabled={isLoading}
                  >
                    Autocompletar
                  </button>
                </div>
              </div>
            )}

            {!rifError && rifValid && (
              <p className="text-paragraph text-green-600 dark:text-green-400 mt-1">
                El RIF es válido
              </p>
            )}
          </div>

          <div>
            <label className="text-paragraph block mb-1.5">
              Dirección fiscal *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                required
                value={fiscalAddress}
                onChange={(e) => setFiscalAddress(e.target.value)}
                className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
                placeholder="Dirección completa para facturación"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="text-paragraph block mb-1.5">
              Teléfono *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
                placeholder="+58 412 1234567"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isContributor"
              checked={isContributor}
              onChange={(e) => setIsContributor(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <label htmlFor="isContributor" className="text-sm text-gray-700 dark:text-gray-300">
Soy contribuyente de IVA (requiero factura con RIF)
            </label>
          </div>

          {isContributor && (
            <div>
              <label className="text-paragraph block mb-1.5">
                Razón social / Nombre completo *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="auth-input w-full py-2.5 px-4 pl-11 rounded-lg"
                  placeholder="Empresa C.A. / Tu nombre si eres persona natural"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="space-y-3.5">
          <h3
            className="text-paragraph font-semibold border-b pb-2"
            style={{
              borderColor: 'var(--palette-border)',
            }}
          >
            Seguridad
          </h3>

          <div>
            <label className="text-paragraph block mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full py-2.5 px-4 pl-11 pr-12 rounded-lg"
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-paragraph block mb-1.5">
              Confirmar contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input w-full py-2.5 px-4 pl-11 pr-12 rounded-lg"
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm rounded-lg p-3 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-[var(--palette-primary)] text-[var(--decorator-color)] font-semibold hover:bg-[var(--palette-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-paragraph"
          disabled={isLoading}
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <div className="text-center">
        <p className="text-paragraph text-sm">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-paragraph text-palette-primary hover:opacity-80 transition-opacity"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};
