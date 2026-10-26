import type { ChatMessage } from '../../lib/communityApi';

const AVATAR_TONES = [
  'bg-[#0D2B4D] text-white',
  'bg-[#1E5AA8] text-white',
  'bg-[#14708A] text-white',
  'bg-[#3B557A] text-white',
  'bg-[#31506B] text-white',
];

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) {
    return words[0].slice(0, 2).toLocaleUpperCase('es-VE');
  }
  return `${words[0][0]}${words[words.length - 1][0]}`.toLocaleUpperCase('es-VE');
}

export function avatarTone(seed: string): string {
  const total = Array.from(seed).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return AVATAR_TONES[total % AVATAR_TONES.length];
}

const timeFormatter = new Intl.DateTimeFormat('es-VE', {
  hour: '2-digit',
  minute: '2-digit',
});

const longDateFormatter = new Intl.DateTimeFormat('es-VE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function capitalize(value: string): string {
  if (!value) return value;
  return `${value[0].toLocaleUpperCase('es-VE')}${value.slice(1)}`;
}

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return timeFormatter.format(date);
}

export function formatRoomActivity(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (startOfDay(date) === startOfDay(today)) {
    return `Hoy, ${timeFormatter.format(date)}`;
  }
  return `${shortDateFormatter.format(date)}, ${timeFormatter.format(date)}`;
}

export function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  if (day === today) return 'Hoy';
  if (day === today - 86_400_000) return 'Ayer';
  return capitalize(longDateFormatter.format(date));
}

export function isSameCalendarDay(first: string, second: string): boolean {
  const firstDate = new Date(first);
  const secondDate = new Date(second);
  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) {
    return false;
  }
  return startOfDay(firstDate) === startOfDay(secondDate);
}

export function isGroupedWithPrevious(
  message: ChatMessage,
  previous: ChatMessage | undefined,
): boolean {
  if (!previous) return false;
  if (previous.user_id !== message.user_id) return false;
  if (!isSameCalendarDay(previous.created_at, message.created_at)) return false;
  const gap =
    new Date(message.created_at).getTime() -
    new Date(previous.created_at).getTime();
  return gap >= 0 && gap < 5 * 60 * 1000;
}
