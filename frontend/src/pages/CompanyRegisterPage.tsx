import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Lock,
  Mail,
  Phone,
  Plus,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { validatePhone } from '../utils/phone';
import { validateRif } from '../utils/rif';

const SUGGESTED_DEPARTMENTS = [
  'Operaciones',
  'Ventas',
  'Recursos Humanos',
  'Finanzas',
  'Tecnología',
  'Administración',
];

export function CompanyRegisterPage() {
  const navigate = useNavigate();
  const { registerCompany } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: '',
    rif: '',
    sector: '',
    email: '',
    phone: '',
    admin_name: '',
    password: '',
  });
  const [departments, setDepartments] = useState<string[]>([
    'Operaciones',
    'Ventas',
    'Recursos Humanos',
  ]);
  const [customDepartment, setCustomDepartment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleDepartment = (name: string) => {
    setDepartments((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name],
    );
  };

  const addCustomDepartment = () => {
    const name = customDepartment.trim();
    if (!name || departments.some((item) => item.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setDepartments((previous) => [...previous, name]);
    setCustomDepartment('');
  };

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const rifValidation = validateRif(form.rif);
    if (!rifValidation.isValid) {
      setError(rifValidation.errorMessage);
      return;
    }

    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.errorMessage);
      return;
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    if (departments.length === 0) {
      setError('Selecciona al menos un departamento.');
      return;
    }

    const rifValidation = validateRif(form.rif);
    const phoneValidation = validatePhone(form.phone);
    if (!rifValidation.isValid || !phoneValidation.isValid) {
      setError('Revisa el RIF y el teléfono antes de continuar.');
      return;
    }

    setIsLoading(true);
    try {
      await registerCompany({
        name: form.name.trim(),
        rif: rifValidation.normalizedRif,
        sector: form.sector.trim() || undefined,
        email: form.email.trim(),
        phone: phoneValidation.normalizedPhone,
        admin_name: form.admin_name.trim(),
        password: form.password,
        departments,
      });
      navigate('/empresa', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la empresa.');
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen company-shell">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center">
            <BrandLogo variant="compact" theme="light" size="sm" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6E7882] hover:text-[#1E5AA8]"
          >
            <ArrowLeft className="w-4 h-4" />
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E5AA8]">
            Registro de empresa
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0D2B4D] mt-2">
            Configura el espacio de tu equipo
          </h1>
          <p className="text-sm text-[#6E7882] mt-2 max-w-xl mx-auto">
            Dos pasos para crear la cuenta corporativa, invitar a tu equipo y
            comenzar a medir el avance de la capacitación.
          </p>
        </div>

        <div className="company-card overflow-hidden">
          <div className="border-b border-[#E2E8F0] px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6E7882] mb-3">
              <span className={step === 1 ? 'text-[#1E5AA8]' : ''}>1. Datos de la empresa</span>
              <span className={step === 2 ? 'text-[#1E5AA8]' : ''}>2. Departamentos</span>
            </div>
            <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1E5AA8] transition-all duration-300"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {step === 1 ? (
              <form onSubmit={handleContinue} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Nombre de la empresa *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        required
                        value={form.name}
                        onChange={(event) => update('name', event.target.value)}
                        className="company-input pl-10"
                        placeholder="Ej. Inversiones Andina C.A."
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      RIF *
                    </label>
                    <input
                      required
                      value={form.rif}
                      onChange={(event) => update('rif', event.target.value.toUpperCase())}
                      className="company-input"
                      placeholder="J-12345678-9"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Sector
                    </label>
                    <input
                      value={form.sector}
                      onChange={(event) => update('sector', event.target.value)}
                      className="company-input"
                      placeholder="Industrial, retail, servicios..."
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Correo corporativo *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(event) => update('email', event.target.value)}
                        className="company-input pl-10"
                        placeholder="rrhh@empresa.com"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(event) => update('phone', event.target.value)}
                        className="company-input pl-10"
                        placeholder="+58 412 1234567"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Responsable de la cuenta *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        required
                        value={form.admin_name}
                        onChange={(event) => update('admin_name', event.target.value)}
                        className="company-input pl-10"
                        placeholder="Nombre y apellido"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={form.password}
                        onChange={(event) => update('password', event.target.value)}
                        className="company-input pl-10"
                        placeholder="Mínimo 8 caracteres"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <Link to="/" className="text-sm text-[#6E7882] hover:text-[#1E5AA8]">
                    Cancelar
                  </Link>
                  <button type="submit" className="company-btn-primary">
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0D2B4D]">
                    ¿Qué departamentos capacitará tu empresa?
                  </h2>
                  <p className="text-sm text-[#6E7882] mt-1">
                    Puedes ajustarlos después desde el panel de la empresa.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_DEPARTMENTS.map((name) => {
                    const selected = departments.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleDepartment(name)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          selected
                            ? 'border-[#1E5AA8] bg-[#1E5AA8] text-white'
                            : 'border-[#CBD5E1] bg-white text-[#475569] hover:border-[#1E5AA8] hover:text-[#1E5AA8]'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                        {name}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <label className="block text-sm font-semibold text-[#0D2B4D] mb-2">
                    Agregar otro departamento
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={customDepartment}
                      onChange={(event) => setCustomDepartment(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addCustomDepartment();
                        }
                      }}
                      className="company-input"
                      placeholder="Ej. Compras"
                    />
                    <button
                      type="button"
                      onClick={addCustomDepartment}
                      className="company-btn-outline shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>

                {departments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#6E7882] mb-2">
                      Seleccionados ({departments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {departments.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1E5AA8]/10 px-3 py-1.5 text-sm font-medium text-[#1E5AA8]"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => toggleDepartment(name)}
                            aria-label={`Quitar ${name}`}
                            className="hover:text-[#0D2B4D]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#6E7882] hover:text-[#1E5AA8]"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="company-btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando empresa...' : 'Crear cuenta de empresa'}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Al continuar aceptas los términos de servicio y la política de privacidad de Cursorg.
        </p>
      </main>
    </div>
  );
}
