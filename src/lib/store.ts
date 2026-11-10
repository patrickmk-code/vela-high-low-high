// Lokale Speicherung: alles bleibt auf diesem Gerät (localStorage, Audio in IndexedDB).
import { addDays, todayKey } from './dates';

export type Step = 'high1' | 'low' | 'ask' | 'high2';
export type Via = 'voz' | 'texto' | 'sugerencia';

export interface Moment {
  id: string;
  text: string;
  via: Via;
  audioId?: string;
}

export interface DayEntry {
  date: string;
  high1: Moment[];
  low: Moment[];
  ask: Moment[];
  high2: Moment[];
  mirrors: Partial<Record<Step, string>>;
  done: boolean;
  updatedAt: number;
}

export interface Upcoming {
  id: string;
  date: string;
  title: string;
}

export interface PatternItem {
  name: string;
  count?: number;
  frequency: string;
  when: string;
  description: string;
  quotes: string[];
}

export interface PatternQuestion {
  src: 'highs' | 'lows' | 'filo';
  theme: string;
  q: string;
  why: string;
}

export interface Patterns {
  sources: PatternItem[];
  drains: PatternItem[];
  ideas: string[];
  mirror?: string;
  questions?: PatternQuestion[];
}

export interface Reflection {
  id: string;
  date: string;
  k: string;
  c: string;
  q: string;
  a: string;
}

export interface Settings {
  onboarded: boolean;
  remindAsked: boolean;
  remindOn: boolean;
  remindTime: string;
  breathSeconds: number;
  prefer: 'voz' | 'texto';
}

export interface AppData {
  version: 1;
  settings: Settings;
  days: Record<string, DayEntry>;
  special: Record<string, boolean>;
  upcoming: Upcoming[];
  ideas: { on: Record<string, boolean>; hidden: Record<string, boolean> };
  patterns: { signature: string; result: Patterns; at: number } | null;
  /** Eigene Ergänzungen zur Energiekarte */
  energy: { s: string[]; d: string[] };
  /** Introspección: Antworten und Fortschritt je Tag */
  reflections: Reflection[];
  inward: { seen: boolean; date: string; done: number; theme: string };
  /** In Patrones gemerkte Frage für die Nacht */
  savedQuestion: string | null;
}

const KEY = 'vela.datos.v1';

export function emptyData(): AppData {
  return {
    version: 1,
    settings: { onboarded: false, remindAsked: false, remindOn: false, remindTime: '21:30', breathSeconds: 8, prefer: 'voz' },
    days: {},
    special: {},
    upcoming: [],
    ideas: { on: {}, hidden: {} },
    patterns: null,
    energy: { s: [], d: [] },
    reflections: [],
    inward: { seen: false, date: '', done: 0, theme: 'todo' },
    savedQuestion: null,
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const base = emptyData();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      ideas: { ...base.ideas, ...(parsed.ideas || {}) },
      energy: { ...base.energy, ...(parsed.energy || {}) },
      inward: { ...base.inward, ...(parsed.inward || {}) },
      reflections: parsed.reflections || [],
    } as AppData;
  } catch {
    return emptyData();
  }
}

export function saveData(d: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function clearData() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function emptyDay(date: string): DayEntry {
  return { date, high1: [], low: [], ask: [], high2: [], mirrors: {}, done: false, updatedAt: Date.now() };
}

export function hasContent(e: DayEntry | undefined): boolean {
  return !!e && (e.high1.length + e.low.length + e.high2.length + e.ask.length > 0);
}

export function completedCount(d: AppData): number {
  return Object.values(d.days).filter((e) => e.done && hasContent(e)).length;
}

export function patternSignature(d: AppData): string {
  const done = Object.values(d.days).filter((e) => e.done && hasContent(e));
  const latest = done.reduce((m, e) => Math.max(m, e.updatedAt), 0);
  return `${done.length}:${latest}`;
}

/** Kompakte Textform der letzten 60 Abende – Grundlage für die Muster-Analyse. */
export function entriesForAnalysis(d: AppData): string[] {
  return Object.values(d.days)
    .filter((e) => e.done && hasContent(e))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60)
    .map((e) => {
      const t = (ms: Moment[]) => ms.map((m) => m.text.trim()).filter(Boolean).map((s) => s.slice(0, 220)).join(' / ');
      const wd = new Date(e.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
      return `${e.date} (${wd}) | HIGH: ${t(e.high1) || '—'} | LOW: ${t(e.low) || '—'} | LE HABRÍA AYUDADO: ${t(e.ask) || '—'} | HIGH: ${t(e.high2) || '—'}`;
    });
}

// ---------- Beispieldaten (zum Ausprobieren von Kalender, Highs und Mustern) ----------
const SAMPLE: [string, string, string, string][] = [
  ['Desayuno largo con música', 'Llovió todo el día y no salí', 'Salir aunque sea un rato', 'Llamar a la abuela'],
  ['Un café con Marta', 'Mucho tráfico al volver', 'Poner un podcast', 'Empezar un libro nuevo'],
  ['Terminé el proyecto a tiempo', 'Dolor de cabeza por la tarde', 'Una pausa corta fuera', 'Cena tranquila en casa'],
  ['En el lago, por fin al aire libre', 'Prisas por la mañana', 'Levantarme diez minutos antes', 'Ver una peli'],
  ['Paseo al atardecer por el parque', 'Una discusión en el trabajo', 'Hablar con alguien', 'Ya llega el fin de semana'],
  ['Cena con amigos', 'Dormí poco', 'Acostarme antes', 'La excursión del domingo'],
  ['Excursión a la montaña', 'Cansancio al volver', 'Un baño caliente', 'Una semana tranquila'],
  ['Cociné algo nuevo con calma', 'Tres reuniones seguidas', 'Bloquear un rato solo para mí', 'Plan con amigos el viernes'],
  ['Un paseo al sol a mediodía', 'Prisas con un encargo urgente', 'Decir que no a algo', 'Concierto con Ana'],
  ['Risas con mi hermana por teléfono', 'Dormí mal otra vez', 'Apagar el móvil antes', 'Mañana libre'],
  ['Concierto con Ana', 'Lunes con prisas desde temprano', 'Una pausa corta fuera', 'Fin de semana en la sierra'],
  ['Caminar sin rumbo por el barrio', 'Demasiado tiempo con pantallas', 'Leer antes de dormir', 'Cena con amigos el sábado'],
  ['Comida con la familia', 'Cansancio después del trabajo', 'Acostarme antes', 'Un plan tranquilo el domingo'],
  ['Música de camino a casa', 'Una reunión que se alargó', 'Decir que no a algo', 'Café con Lucía mañana'],
];

export function withSampleData(d: AppData): AppData {
  const today = todayKey();
  const days = { ...d.days };
  SAMPLE.forEach((s, i) => {
    const date = addDays(today, -(SAMPLE.length - i) - 1);
    if (days[date]) return;
    const mk = (text: string): Moment => ({ id: uid(), text, via: 'texto' });
    days[date] = { date, high1: [mk(s[0])], low: [mk(s[1])], ask: [mk(s[2])], high2: [mk(s[3])], mirrors: {}, done: true, updatedAt: Date.now() - i };
  });
  // „Vor einem Jahr“
  const yearAgo = addDays(today, -365);
  if (!days[yearAgo]) {
    days[yearAgo] = { ...emptyDay(yearAgo), high1: [{ id: uid(), text: 'Una tarde en el lago con amigos', via: 'texto' }], done: true };
  }
  const upcoming = d.upcoming.length ? d.upcoming : [
    { id: uid(), date: addDays(today, 4), title: 'Por fin viernes: tarde libre' },
    { id: uid(), date: addDays(today, 5), title: 'Concierto con Ana' },
    { id: uid(), date: addDays(today, 19), title: 'Escapada a la costa' },
  ];
  return { ...d, days, upcoming, special: { ...d.special, [addDays(today, -3)]: true } };
}
