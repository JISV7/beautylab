import { useEffect, useState } from 'react';
import { Activity, BookOpen, Loader2, TrendingUp, Users } from 'lucide-react';
import { companyApi, type ActivityItem, type CompanySummary } from '../../lib/companyApi';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export function OverviewPanel() {
  const [summary, setSummary] = useState<CompanySummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([companyApi.getSummary(), companyApi.getActivity(8)])
      .then(([summaryData, activityData]) => {
        if (!active) return;
        setSummary(summaryData);
        setActivity(activityData);
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los indicadores de la empresa.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#6E7882]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Cargando panel...
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-card p-6 text-sm text-red-700 border-red-200 bg-red-50">{error}</div>
    );
  }

  const cards = [
    {
      id: 'employees',
      label: 'Empleados activos',
      value: summary?.active_employees ?? 0,
      hint: `${summary?.employees ?? 0} colaboradores registrados`,
      icon: Users,
    },
    {
      id: 'courses',
      label: 'Cursos asignados',
      value: summary?.courses_assigned ?? 0,
      hint: `${summary?.departments ?? 0} departamentos activos`,
      icon: BookOpen,
    },
    {
      id: 'completion',
      label: 'Tasa de finalización',
      value: `${summary?.completion_rate ?? 0}%`,
      hint: 'Promedio del equipo en programas asignados',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D2B4D]">Inicio</h1>
        <p className="text-sm text-[#6E7882] mt-1">
          Resumen operativo de {summary?.company_name || 'tu empresa'} y actividad reciente
          del equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className="company-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6E7882]">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#0D2B4D] leading-none">
                    {card.value}
                  </p>
                </div>
                <span className="w-10 h-10 rounded-xl bg-[#1E5AA8]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#1E5AA8]" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-xs text-[#6E7882]">{card.hint}</p>
            </article>
          );
        })}
      </div>

      <section className="company-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1E5AA8]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-[#0D2B4D]">Actividad reciente</h2>
          </div>
          <span className="text-xs text-[#6E7882]">{activity.length} eventos</span>
        </div>

        {activity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#6E7882]">
              Aún no hay actividad. Cuando tu equipo comience los cursos, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#6E7882]">
                  <th className="px-5 py-3 font-semibold">Colaborador</th>
                  <th className="px-5 py-3 font-semibold">Actividad</th>
                  <th className="px-5 py-3 font-semibold">Curso</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {activity.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-[#0D2B4D]">
                        {item.user_name}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="company-badge bg-[#55C7E8]/15 text-[#0D6D87]">
                        {item.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#475569]">{item.detail}</td>
                    <td className="px-5 py-3.5 text-xs text-[#6E7882]">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
