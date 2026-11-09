// Sprachaufnahmen der Momente – lokal in IndexedDB.
import { createStore, del, get, set, clear } from 'idb-keyval';

const store = createStore('vela-audio', 'clips');

export async function saveAudio(id: string, blob: Blob): Promise<boolean> {
  try { await set(id, blob, store); return true; } catch { return false; }
}

export async function getAudio(id: string): Promise<Blob | undefined> {
  try { return await get<Blob>(id, store); } catch { return undefined; }
}

export async function deleteAudio(id: string) {
  try { await del(id, store); } catch { /* egal */ }
}

export async function clearAudio() {
  try { await clear(store); } catch { /* egal */ }
}

let current: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

/** Spielt eine Aufnahme ab. Liefert false, wenn es sie nicht (mehr) gibt. */
export async function playAudio(id: string, onEnd?: () => void): Promise<boolean> {
  stopAudio();
  const blob = await getAudio(id);
  if (!blob) return false;
  currentUrl = URL.createObjectURL(blob);
  current = new Audio(currentUrl);
  current.onended = () => { stopAudio(); onEnd?.(); };
  try { await current.play(); return true; } catch { stopAudio(); return false; }
}

export function stopAudio() {
  if (current) { current.pause(); current.onended = null; current = null; }
  if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null; }
}
