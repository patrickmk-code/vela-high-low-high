// Datums-Helfer (lokale Zeit, Schlüssel im Format YYYY-MM-DD)

export function keyOf(d: Date): string {
  const m = d.getMonth() + 1, day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Der „Abend“ gehört bis 4 Uhr morgens noch zum Vortag. */
export function todayKey(now = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return keyOf(d);
}

export function addDays(k: string, n: number): string {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86400000);
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const monthName = (m: number) => MONTHS[m];
export const monthShort = (m: number) => MONTHS_SHORT[m];

/** „lunes, 9 de noviembre“ */
export function longLabel(k: string): string {
  const d = parseKey(k);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** „Hoy“, „Ayer“, „Sábado“ (letzte Woche) oder „4 de noviembre“ */
export function relLabel(k: string, today: string): string {
  const diff = daysBetween(k, today);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const d = parseKey(k);
  if (diff > 1 && diff < 7) return cap(WEEKDAYS[d.getDay()]);
  const sameYear = d.getFullYear() === parseKey(today).getFullYear();
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}${sameYear ? '' : ' de ' + d.getFullYear()}`;
}

/** „en 4 días“ / „mañana“ / „hoy“ */
export function inDays(k: string, today: string): string {
  const n = daysBetween(today, k);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'mañana';
  return `en ${n} días`;
}

export function clockLabel(now = new Date()): string {
  const h = now.getHours(), m = now.getMinutes();
  return `${h}:${m < 10 ? '0' : ''}${m}`;
}
