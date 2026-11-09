// Client für die Vela-Funktionen (Spiegel & Muster). Fällt ohne Netz/Schlüssel auf Vorlagen zurück.
import type { Patterns, Step } from './store';

const MT: Record<Step, string> = {
  high1: 'Hoy te sentó bien esto: {t}',
  low: 'Hoy te pesó esto: {t}',
  ask: 'Te habría venido bien: {t}',
  high2: 'Te llevas algo bonito: {t}',
};

/** Spiegel-Satz ohne KI – aus den eigenen Worten. */
export function templateMirror(step: Step, text: string): string {
  let t = text.trim();
  if (!t) return 'Lo guardé tal como lo dijiste, con tu voz.';
  t = t.replace(/[.!?…\s]+$/, '');
  if (t.length > 90) t = t.slice(0, 88) + ' …';
  t = t.charAt(0).toLowerCase() + t.slice(1);
  return MT[step].replace('{t}', t) + '.';
}

async function postJSON<T>(url: string, body: unknown, timeoutMs: number): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface MirrorContext {
  high1?: string;
  low?: string;
}

/** Kurzer Spiegel in Velas Stimme. Liefert { text, ai } – ai=false bei Vorlage. */
export async function mirror(step: Step, text: string, context: MirrorContext): Promise<{ text: string; ai: boolean }> {
  const t = text.trim();
  if (!t) return { text: templateMirror(step, t), ai: false };
  const res = await postJSON<{ text?: string }>('/api/mirror', { step, text: t.slice(0, 1500), context }, 15000);
  if (res?.text) return { text: res.text, ai: true };
  return { text: templateMirror(step, t), ai: false };
}

export type PatternsResult = { ok: true; patterns: Patterns } | { ok: false; reason: 'sin-conexion' | 'error' };

export async function analyzePatterns(entries: string[]): Promise<PatternsResult> {
  const res = await postJSON<{ patterns?: Patterns; error?: string }>('/api/patterns', { entries }, 90000);
  if (res?.patterns) return { ok: true, patterns: res.patterns };
  return { ok: false, reason: res ? 'error' : 'sin-conexion' };
}
