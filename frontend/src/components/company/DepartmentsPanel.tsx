import { useEffect, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { CompanyModal } from './CompanyModal';
import {
  companyApi,
  getApiErrorMessage,
  type Department,
  type DepartmentPayload,
} from '../../lib/companyApi';

export function DepartmentsPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentPayload>({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setDepartments(await companyApi.listDepartments());
    } catch {
      setError('No se pudieron cargar los departamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setForm({ name: department.name, description: department.description || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('El nombre del departamento es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await companyApi.updateDepartment(editing.id, {
          name: form.name.trim(),
          description: form.description?.trim() || null,
        });
      } else {
        await companyApi.createDepartment({
          name: form.name.trim(),
          description: form.description?.trim() || null,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo guardar el departamento.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department: Department) => {
    const confirmed = window.confirm(
      `¿Eliminar el departamento "${department.name}"? Los colaboradores quedarán sin departamento.`,
    );
    if (!confirmed) return;
    try {
      await companyApi.deleteDepartment(department.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar el departamento.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2B4D]">Departamentos</h1>
          <p className="text-sm text-[#6E7882] mt-1">
            Organiza a tu equipo y revisa el avance de cada área.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="company-btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo departamento
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#6E7882]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Cargando departamentos...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((department) => (
            <article key={department.id} className="company-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-[#0D2B4D]/5 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[#1E5AA8]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#0D2B4D] truncate">
                      {department.name}
                    </h2>
                    <p className="text-xs text-[#6E7882] truncate">
                      {department.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(department)}
                    className="p-2 rounded-lg text-[#1E5AA8] hover:bg-[#1E5AA8]/10"
                    aria-label={`Editar ${department.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(department)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                    aria-label={`Eliminar ${department.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-[#475569]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
                  {department.employee_count} empleados
                </span>
                <span>{department.courses_assigned} cursos</span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[#6E7882] mb-1.5">
                  <span>Progreso promedio</span>
                  <span className="font-semibold text-[#0D2B4D]">
                    {department.average_progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#55C7E8] transition-all"
                    style={{ width: `${Math.min(100, department.average_progress)}%` }}
                  />
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl border-2 border-dashed border-[#CBD5E1] bg-white/60 p-5 min-h-[168px] flex flex-col items-center justify-center gap-2 text-[#6E7882] hover:border-[#1E5AA8] hover:text-[#1E5AA8] transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-semibold">Agregar departamento</span>
          </button>
        </div>
      )}

      <CompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar departamento' : 'Nuevo departamento'}
        description="Define el nombre del área que agrupará a los colaboradores."
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
              onClick={handleSave}
              className="company-btn-primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear departamento'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Nombre *
            </label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="company-input"
              placeholder="Ej. Operaciones"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Descripción
            </label>
            <textarea
              value={form.description || ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="company-input min-h-24 resize-y"
              placeholder="Responsabilidades del departamento"
            />
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
