// Einfache Auswertungen direkt auf dem Gerät (ohne KI): Wörter, Wochentage, Lows in Folge.
import type { AppData, DayEntry } from './store';
import { hasContent } from './store';
import { parseKey } from './dates';

const STOP = new Set(('a al algo algún alguna algunas alguno algunos ante antes aquel aquella aquellas aquello aquellos aquí así aun aunque bajo bien cada casi como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta está estaba estaban estado estar estas este esto estos estoy fue fueron ha había han hasta hay hice hizo hoy la las le les lo los me mi mis mucho muchos muy más nada ni no nos nosotros o otra otras otro otros para pero poco por porque que qué se ser si sí sido sin sobre solo son su sus también tan tanto te tengo tenía ti todo todos tu tus tuve tuvo un una uno unos unas y ya yo él día días hacer hace mañana tarde noche rato vez veces momento cosa cosas bueno buena mal mejor tener sentí siento estuve fui ir me mí ese esa algo aún después luego bastante'.split(' ')));

function words(text: string): string[] {
  return text.toLowerCase()
    .normalize('NFC')
    .replace(/[^a-záéíóúüñ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

/** Häufigste Wörter, gezählt einmal pro Abend. */
export function topWords(entries: DayEntry[], kind: 'high' | 'low', n = 3): [string, number][] {
  const count = new Map<string, number>();
  for (const e of entries) {
    const ms = kind === 'high' ? [...e.high1, ...e.high2] : e.low;
    const seen = new Set(ms.flatMap((m) => words(m.text)));
    seen.forEach((w) => count.set(w, (count.get(w) || 0) + 1));
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

export function doneEntries(d: AppData): DayEntry[] {
  return Object.values(d.days).filter((e) => e.done && hasContent(e)).sort((a, b) => a.date.localeCompare(b.date));
}

/** Highs/Lows je Wochentag (Mo–So). */
export function weekBars(entries: DayEntry[]): [number, number][] {
  const out: [number, number][] = Array.from({ length: 7 }, () => [0, 0]);
  for (const e of entries) {
    const wd = (parseKey(e.date).getDay() + 6) % 7;
    out[wd][0] += e.high1.length + e.high2.length > 0 ? 1 : 0;
    out[wd][1] += e.low.length > 0 ? 1 : 0;
  }
  return out;
}

/** Gibt es zuletzt mindestens 3 Abende in Folge mit einem Low und ohne zweites High? */
export function lowStreak(entries: DayEntry[]): boolean {
  const last = entries.slice(-3);
  return last.length === 3 && last.every((e) => e.low.length > 0 && e.high1.length + e.high2.length === 0);
}

export const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
