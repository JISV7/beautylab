import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { CompanyModal } from './CompanyModal';
import {
  companyApi,
  getApiErrorMessage,
  type CompanyUser,
  type Department,
} from '../../lib/companyApi';

const roleLabel = (role: string) => {
  if (role === 'company_admin') return 'Administrador';
  if (role === 'admin') return 'Admin plataforma';
  if (role === 'root') return 'Root';
  return 'Empleado';
};

const initials = (value: string | null, email: string) => {
  const source = value?.trim() || email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export function DirectoryPanel() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    role: 'user' as 'user' | 'company_admin',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, departmentsData] = await Promise.all([
        companyApi.listUsers(),
        companyApi.listDepartments(),
      ]);
      setUsers(usersData);
      setDepartments(departmentsData);
    } catch {
      setError('No se pudo cargar el directorio de la empresa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.department_name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [users, search]);

  const activeCount = users.filter((user) => user.is_active).length;

  const openCreate = () => {
    setForm({
      full_name: '',
      email: '',
      password: '',
      department_id: '',
      role: 'user',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      setFormError('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await companyApi.createUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        department_id: form.department_id || null,
        role: form.role,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo crear el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: CompanyUser) => {
    try {
      await companyApi.updateUser(user.id, { is_active: !user.is_active });
      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id ? { ...item, is_active: !item.is_active } : item,
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el usuario.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2B4D]">Directorio y Usuarios</h1>
          <p className="text-sm text-[#6E7882] mt-1">
            Gestiona los colaboradores de la empresa, sus roles y su estado.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="company-btn-primary">
          <Plus className="w-4 h-4" />
          Agregar Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="company-card px-5 py-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-[#1E5AA8]/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#1E5AA8]" />
          </span>
          <div>
            <p className="text-xs text-[#6E7882]">Total usuarios</p>
            <p className="text-lg font-bold text-[#0D2B4D] leading-none">{users.length}</p>
          </div>
        </div>
        <div className="company-card px-5 py-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </span>
          <div>
            <p className="text-xs text-[#6E7882]">Activos</p>
            <p className="text-lg font-bold text-[#0D2B4D] leading-none">{activeCount}</p>
          </div>
        </div>
        <div className="company-card px-5 py-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-[#55C7E8]/15 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#0D6D87]" />
          </span>
          <div>
            <p className="text-xs text-[#6E7882]">Departamentos</p>
            <p className="text-lg font-bold text-[#0D2B4D] leading-none">
              {departments.length}
            </p>
          </div>
        </div>
      </div>

      <div className="company-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex w-full sm:max-w-sm items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 focus-within:border-[#1E5AA8] focus-within:ring-2 focus-within:ring-[#1E5AA8]/15">
            <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o departamento..."
              className="w-full bg-transparent px-2 py-2 text-sm text-[#0D2B4D] placeholder:text-[#94A3B8] focus:outline-none"
            />
          </div>
          <span className="text-xs text-[#6E7882]">
            {filtered.length} de {users.length} usuarios
          </span>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#6E7882]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando directorio...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-[#6E7882]">No se encontraron usuarios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#6E7882]">
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Correo</th>
                  <th className="px-5 py-3 font-semibold">Departamento</th>
                  <th className="px-5 py-3 font-semibold">Rol</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#1E5AA8]/10 text-[#1E5AA8] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(user.full_name, user.email)}
                        </span>
                        <span className="text-sm font-semibold text-[#0D2B4D]">
                          {user.full_name || 'Sin nombre'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#475569]">
                        <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#475569]">
                      {user.department_name || 'Sin asignar'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`company-badge ${
                          user.role === 'company_admin'
                            ? 'bg-[#1E5AA8]/10 text-[#1E5AA8]'
                            : 'bg-[#F1F5F9] text-[#475569]'
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`company-badge ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          user.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Activar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar usuario"
        description="Crea una cuenta para un colaborador de la empresa."
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="company-btn-outline"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="company-btn-primary"
              disabled={saving}
            >
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Nombre completo *
            </label>
            <input
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              className="company-input"
              placeholder="Ej. Ana Martínez"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="company-input"
              placeholder="ana@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Contraseña temporal *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="company-input"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                Departamento
              </label>
              <select
                value={form.department_id}
                onChange={(event) =>
                  setForm({ ...form, department_id: event.target.value })
                }
                className="company-input"
              >
                <option value="">Sin asignar</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                Rol
              </label>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({
                    ...form,
                    role: event.target.value as 'user' | 'company_admin',
                  })
                }
                className="company-input"
              >
                <option value="user">Empleado</option>
                <option value="company_admin">Administrador de empresa</option>
              </select>
            </div>
          </div>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </CompanyModal>
    </div>
  );
}
