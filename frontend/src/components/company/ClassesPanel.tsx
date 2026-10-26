import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  Film,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { CompanyModal } from './CompanyModal';
import {
  companyApi,
  getApiErrorMessage,
  type CourseClass,
  type CourseModule,
  type CourseWithClasses,
  type Department,
} from '../../lib/companyApi';

interface ClassFormState {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_minutes: string;
  has_evaluation: boolean;
}

const emptyClassForm: ClassFormState = {
  title: '',
  description: '',
  video_url: '',
  thumbnail_url: '',
  duration_minutes: '',
  has_evaluation: false,
};

const emptyModuleForm = {
  course_id: '',
  title: '',
  description: '',
};

export function ClassesPanel() {
  const [courses, setCourses] = useState<CourseWithClasses[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<CourseClass | null>(null);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [classForm, setClassForm] = useState<ClassFormState>(emptyClassForm);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [classesData, departmentsData] = await Promise.all([
        companyApi.listClasses(),
        companyApi.listDepartments(),
      ]);
      setCourses(classesData);
      setDepartments(departmentsData);
    } catch {
      setError('No se pudieron cargar las clases de la empresa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalClasses = useMemo(
    () => courses.reduce((total, course) => total + course.modules.reduce(
      (sum, module) => sum + module.classes.length,
      0,
    ), 0),
    [courses],
  );

  const toggle = (moduleId: string) => {
    setExpanded((previous) => ({ ...previous, [moduleId]: !previous[moduleId] }));
  };

  const openCreateClass = (moduleId: string) => {
    setEditingClass(null);
    setTargetModuleId(moduleId);
    setClassForm(emptyClassForm);
    setFormError('');
    setClassModalOpen(true);
  };

  const openEditClass = (moduleId: string, classItem: CourseClass) => {
    setEditingClass(classItem);
    setTargetModuleId(moduleId);
    setClassForm({
      title: classItem.title,
      description: classItem.description || '',
      video_url: classItem.video_url || '',
      thumbnail_url: classItem.thumbnail_url || '',
      duration_minutes: classItem.duration_minutes ? String(classItem.duration_minutes) : '',
      has_evaluation: classItem.has_evaluation,
    });
    setFormError('');
    setClassModalOpen(true);
  };

  const openCreateModule = (courseId: string) => {
    setModuleForm({ course_id: courseId, title: '', description: '' });
    setFormError('');
    setModuleModalOpen(true);
  };

  const handleSaveClass = async () => {
    if (!classForm.title.trim()) {
      setFormError('El título de la clase es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = {
      module_id: targetModuleId,
      title: classForm.title.trim(),
      description: classForm.description.trim() || null,
      video_url: classForm.video_url.trim() || null,
      thumbnail_url: classForm.thumbnail_url.trim() || null,
      duration_minutes: classForm.duration_minutes
        ? Number(classForm.duration_minutes)
        : null,
      has_evaluation: classForm.has_evaluation,
    };
    try {
      if (editingClass) {
        await companyApi.updateClass(editingClass.id, payload);
      } else {
        await companyApi.createClass(payload);
      }
      setClassModalOpen(false);
      setExpanded((previous) => ({ ...previous, [targetModuleId]: true }));
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo guardar la clase.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      setFormError('El título del módulo es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await companyApi.createModule({
        course_id: moduleForm.course_id,
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || undefined,
      });
      setModuleModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'No se pudo crear el módulo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classItem: CourseClass) => {
    if (!window.confirm(`¿Eliminar la clase "${classItem.title}"?`)) return;
    try {
      await companyApi.deleteClass(classItem.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar la clase.'));
    }
  };

  const handleDeleteModule = async (module: CourseModule) => {
    if (!window.confirm(`¿Eliminar el módulo "${module.title}" y sus clases?`)) return;
    try {
      await companyApi.deleteModule(module.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar el módulo.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2B4D]">Gestión de Clases</h1>
          <p className="text-sm text-[#6E7882] mt-1">
            Organiza los módulos y clases de los programas de capacitación.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="min-w-[220px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6E7882] mb-1.5">
              Departamento
            </label>
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="company-input"
            >
              <option value="">Todos los departamentos</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-[#6E7882] sm:pb-2.5">
            {courses.length} programas · {totalClasses} clases
          </div>
        </div>
      </div>

      {selectedDepartment && (
        <div className="rounded-lg border border-[#55C7E8]/40 bg-[#55C7E8]/10 px-4 py-2.5 text-xs text-[#0D6D87]">
          Los programas del catálogo son compartidos. Filtrar por departamento asignará
          esta vista al área seleccionada cuando se habiliten las asignaciones por equipo.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#6E7882]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Cargando clases...
        </div>
      ) : (
        <div className="space-y-5">
          {courses.map((course) => (
            <section key={course.id} className="company-card overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={course.image_url || '/images/hero-corporate.jpg'}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#0D2B4D] truncate">
                      {course.title}
                    </h2>
                    <p className="text-xs text-[#6E7882]">
                      {course.modules.length} módulos ·{' '}
                      {course.modules.reduce((sum, module) => sum + module.classes.length, 0)} clases
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateModule(course.id)}
                  className="company-btn-outline !py-2 !px-3 text-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo módulo
                </button>
              </div>

              <div className="divide-y divide-[#F1F5F9]">
                {course.modules.length === 0 && (
                  <p className="px-5 py-6 text-sm text-[#6E7882]">
                    Este curso todavía no tiene módulos.
                  </p>
                )}

                {course.modules.map((module) => {
                  const isOpen = !!expanded[module.id];
                  return (
                    <div key={module.id}>
                      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 hover:bg-[#F8FAFC]">
                        <button
                          type="button"
                          onClick={() => toggle(module.id)}
                          className="flex flex-1 items-center gap-3 text-left min-w-0"
                          aria-expanded={isOpen}
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-[#1E5AA8] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                          )}
                          <span className="w-8 h-8 rounded-lg bg-[#1E5AA8]/10 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-[#1E5AA8]" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[#0D2B4D] truncate">
                              {module.title}
                            </span>
                            <span className="block text-xs text-[#6E7882]">
                              {module.classes.length} clases
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(module)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          aria-label={`Eliminar ${module.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-4">
                          <div className="space-y-2.5">
                            {module.classes.map((classItem) => (
                              <div
                                key={classItem.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3"
                              >
                                <div className="relative w-full sm:w-36 flex-shrink-0 overflow-hidden rounded-lg bg-[#0D2B4D]">
                                  <img
                                    src={
                                      classItem.thumbnail_url ||
                                      course.image_url ||
                                      '/images/hero-corporate.jpg'
                                    }
                                    alt=""
                                    className="aspect-video w-full object-cover opacity-90"
                                  />
                                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    {classItem.duration_minutes
                                      ? `${classItem.duration_minutes} min`
                                      : 'Clase'}
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-semibold text-[#0D2B4D]">
                                      {classItem.title}
                                    </h3>
                                    {classItem.has_evaluation && (
                                      <span className="company-badge bg-amber-100 text-amber-800">
                                        Evaluación
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-[#6E7882] line-clamp-2">
                                    {classItem.description || 'Sin descripción'}
                                  </p>
                                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#94A3B8]">
                                    <span className="inline-flex items-center gap-1">
                                      <Film className="w-3.5 h-3.5" />
                                      {classItem.video_url ? 'Video configurado' : 'Sin video'}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <Clock3 className="w-3.5 h-3.5" />
                                      {classItem.duration_minutes
                                        ? `${classItem.duration_minutes} min`
                                        : 'Duración pendiente'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => openEditClass(module.id, classItem)}
                                    className="p-2 rounded-lg text-[#1E5AA8] hover:bg-[#1E5AA8]/10"
                                    aria-label={`Editar ${classItem.title}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClass(classItem)}
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                                    aria-label={`Eliminar ${classItem.title}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => openCreateClass(module.id)}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#6E7882] hover:border-[#1E5AA8] hover:text-[#1E5AA8]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar clase
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <CompanyModal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title={editingClass ? 'Editar clase' : 'Nueva clase'}
        description="Completa la información del video y su evaluación."
        footer={
          <>
            <button
              type="button"
              onClick={() => setClassModalOpen(false)}
              className="company-btn-outline"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveClass}
              className="company-btn-primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar clase'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Título *
            </label>
            <input
              value={classForm.title}
              onChange={(event) => setClassForm({ ...classForm, title: event.target.value })}
              className="company-input"
              placeholder="Ej. Introducción a la prevención de riesgos"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Descripción
            </label>
            <textarea
              value={classForm.description}
              onChange={(event) =>
                setClassForm({ ...classForm, description: event.target.value })
              }
              className="company-input min-h-20 resize-y"
              placeholder="Contenido de la clase"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                URL del video
              </label>
              <input
                value={classForm.video_url}
                onChange={(event) =>
                  setClassForm({ ...classForm, video_url: event.target.value })
                }
                className="company-input"
                placeholder="/static/course-videos/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                Miniatura (URL)
              </label>
              <input
                value={classForm.thumbnail_url}
                onChange={(event) =>
                  setClassForm({ ...classForm, thumbnail_url: event.target.value })
                }
                className="company-input"
                placeholder="/images/courses/cursorg-001.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                Duración (min)
              </label>
              <input
                type="number"
                min={1}
                value={classForm.duration_minutes}
                onChange={(event) =>
                  setClassForm({ ...classForm, duration_minutes: event.target.value })
                }
                className="company-input"
                placeholder="15"
              />
            </div>
            <label className="flex items-center gap-2 sm:pt-7 text-sm text-[#475569]">
              <input
                type="checkbox"
                checked={classForm.has_evaluation}
                onChange={(event) =>
                  setClassForm({ ...classForm, has_evaluation: event.target.checked })
                }
                className="w-4 h-4 rounded border-[#CBD5E1] text-[#1E5AA8] focus:ring-[#1E5AA8]"
              />
              Incluye evaluación
            </label>
          </div>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </CompanyModal>

      <CompanyModal
        open={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title="Nuevo módulo"
        description="Agrupa varias clases dentro de un programa."
        footer={
          <>
            <button
              type="button"
              onClick={() => setModuleModalOpen(false)}
              className="company-btn-outline"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveModule}
              className="company-btn-primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Crear módulo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Título *
            </label>
            <input
              value={moduleForm.title}
              onChange={(event) =>
                setModuleForm({ ...moduleForm, title: event.target.value })
              }
              className="company-input"
              placeholder="Ej. Módulo 1: Fundamentos"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
              Descripción
            </label>
            <textarea
              value={moduleForm.description}
              onChange={(event) =>
                setModuleForm({ ...moduleForm, description: event.target.value })
              }
              className="company-input min-h-20 resize-y"
              placeholder="Objetivo del módulo"
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
