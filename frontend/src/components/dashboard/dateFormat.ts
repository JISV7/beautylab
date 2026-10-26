const shortWeekday = new Intl.DateTimeFormat('es-VE', { weekday: 'short' });
const shortMonthDay = new Intl.DateTimeFormat('es-VE', {
  day: 'numeric',
  month: 'short',
});
const longMonth = new Intl.DateTimeFormat('es-VE', { month: 'long' });
const timeOnly = new Intl.DateTimeFormat('es-VE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const fullDateTime = new Intl.DateTimeFormat('es-VE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatWeekday(value: string): string {
  return shortWeekday.format(parseLocalDate(value)).replace('.', '').toLowerCase();
}

export function formatShortDate(value: string): string {
  return shortMonthDay.format(parseLocalDate(value)).replace('.', '');
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return timeOnly.format(date);
}

export function formatFullDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return capitalize(fullDateTime.format(date));
}

export function formatRelativeDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / 86_400_000);

  if (diffDays === 0) return `Hoy, ${formatTime(date)}`;
  if (diffDays === 1) return `Ayer, ${formatTime(date)}`;
  if (diffDays > 1 && diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 0) return formatFullDateTime(value);
  return formatShortDate(localDateKey(date)) + ` ${date.getFullYear()}`;
}

export function formatWeekRange(firstDay: string, lastDay: string): string {
  const start = parseLocalDate(firstDay);
  const end = parseLocalDate(lastDay);
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate()} al ${end.getDate()} de ${longMonth.format(end)}`;
  }

  return `${formatShortDate(firstDay)} al ${formatShortDate(lastDay)}`;
}
