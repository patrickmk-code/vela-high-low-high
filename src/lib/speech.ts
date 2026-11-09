// Einsprechen: Spracherkennung (Web Speech API, Spanisch) + Tonaufnahme (MediaRecorder) parallel.
// Beides ist optional – fehlt eins, funktioniert das andere trotzdem; fehlt beides, bleibt Tippen.

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

function getRecognitionCtor(): (new () => SR) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const sttSupported = () => !!getRecognitionCtor();
export const recordSupported = () => typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
export const voiceSupported = () => sttSupported() || recordSupported();

export type VoiceError = 'sin-permiso' | 'sin-micro' | 'no-soportado';

export interface VoiceResult {
  transcript: string;
  audio: Blob | null;
  seconds: number;
}

export interface VoiceCallbacks {
  onTranscript?: (text: string) => void;
  onError?: (e: VoiceError) => void;
}

const MAX_SECONDS = 120;

export class VoiceCapture {
  private rec: SR | null = null;
  private media: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private finals: string[] = [];
  private interim = '';
  private active = false;
  private startedAt = 0;
  private limitTimer: number | null = null;
  private cb: VoiceCallbacks;
  private onAutoStop?: () => void;

  constructor(cb: VoiceCallbacks, onAutoStop?: () => void) {
    this.cb = cb;
    this.onAutoStop = onAutoStop;
  }

  get transcript() {
    return [...this.finals, this.interim].join(' ').replace(/\s+/g, ' ').trim();
  }

  async start(): Promise<boolean> {
    if (!voiceSupported()) { this.cb.onError?.('no-soportado'); return false; }
    this.active = true;
    this.startedAt = Date.now();
    this.finals = []; this.interim = ''; this.chunks = [];

    let micOk = false;
    // 1) Tonaufnahme
    if (recordSupported()) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported?.(m));
        this.media = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
        this.media.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
        this.media.start(1000);
        micOk = true;
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') { this.active = false; this.cb.onError?.('sin-permiso'); return false; }
        // kein Mikrofon o. Ä. – Spracherkennung vielleicht trotzdem möglich
      }
    }
    if (!this.active) return false;

    // 2) Spracherkennung
    const Ctor = getRecognitionCtor();
    if (Ctor) {
      try {
        this.rec = new Ctor();
        this.rec.lang = 'es-ES';
        this.rec.continuous = true;
        this.rec.interimResults = true;
        this.rec.maxAlternatives = 1;
        this.rec.onresult = (ev: any) => {
          let interim = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            const t = r[0]?.transcript ?? '';
            if (r.isFinal) this.finals.push(t.trim()); else interim += t;
          }
          this.interim = interim.trim();
          this.cb.onTranscript?.(this.transcript);
        };
        this.rec.onerror = (ev: any) => {
          if (ev?.error === 'not-allowed' && !micOk) { this.cb.onError?.('sin-permiso'); this.stop(); }
        };
        // iOS/Chrome beenden die Erkennung nach Pausen – solange wir aufnehmen, neu starten
        this.rec.onend = () => {
          if (this.interim) { this.finals.push(this.interim); this.interim = ''; }
          if (this.active && this.rec) { try { this.rec.start(); } catch { /* läuft schon */ } }
        };
        this.rec.start();
        micOk = true;
      } catch {
        this.rec = null;
      }
    }

    if (!micOk) { this.active = false; this.cb.onError?.('sin-micro'); return false; }
    this.limitTimer = window.setTimeout(() => this.onAutoStop?.(), MAX_SECONDS * 1000);
    return true;
  }

  stop(): Promise<VoiceResult> {
    this.active = false;
    if (this.limitTimer) { clearTimeout(this.limitTimer); this.limitTimer = null; }
    const seconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));

    // Letzte Erkennungsergebnisse kommen nach stop() noch kurz nach – etwas warten.
    const sttDone = new Promise<void>((resolve) => {
      if (!this.rec) return resolve();
      const r = this.rec;
      const t = window.setTimeout(resolve, 1200);
      r.onend = () => { clearTimeout(t); resolve(); };
      try { r.stop(); } catch { clearTimeout(t); resolve(); }
    });
    const mediaDone = new Promise<Blob | null>((resolve) => {
      const m = this.media;
      if (!m || m.state === 'inactive') return resolve(this.chunks.length ? new Blob(this.chunks, { type: this.chunks[0].type }) : null);
      m.onstop = () => resolve(this.chunks.length ? new Blob(this.chunks, { type: m.mimeType || this.chunks[0].type }) : null);
      try { m.stop(); } catch { resolve(null); }
    });

    return Promise.all([sttDone, mediaDone]).then(([, audio]) => {
      if (this.interim) { this.finals.push(this.interim); this.interim = ''; }
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = null; this.media = null; this.rec = null;
      return { transcript: this.transcript, audio, seconds };
    });
  }

  /** Abbrechen ohne Ergebnis (z. B. beim Verlassen des Screens). */
  cancel() {
    this.active = false;
    if (this.limitTimer) { clearTimeout(this.limitTimer); this.limitTimer = null; }
    try { this.rec?.abort?.(); } catch { /* egal */ }
    try { if (this.media && this.media.state !== 'inactive') this.media.stop(); } catch { /* egal */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null; this.media = null; this.rec = null;
  }
}
