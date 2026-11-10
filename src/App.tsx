import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Candle, type CandleCfg } from './Candle';
import { Icon } from './Icon';
import { sx } from './sx';
import { useLayout } from './useLayout';
import { COOL, F, GOLD, IN, JUMPS_FIRST, JUMPS_RECURRING, NIGHT_STEPS, SPOTIFY_URL, SUGG, isInputPhase, type InputPhase, type Phase } from './data';
import { addDays, cap, keyOf, longLabel, parseKey, todayKey } from './lib/dates';
import {
  DEMO_KEY, KEY, clearData, completedCount, emptyData, emptyDay, entriesForAnalysis, loadData, patternSignature, saveData, uid,
  type AppData, type DayEntry, type Moment, type Via,
} from './lib/store';
import { clearAudio, deleteAudio, playAudio, saveAudio, stopAudio } from './lib/audio';
import { VoiceCapture, sttSupported, voiceSupported, type VoiceError } from './lib/speech';
import { analyzePatterns, mirror as mirrorAI } from './lib/ai';
import { addReminderToCalendar, downloadFile } from './lib/reminder';
import { STARS, moonPhase } from './lib/sky';
import { AppCtx, type Answer, type Ctx, type DayKey, type UI } from './ctx';
import { GHOST, ITALIC, PRIMARY, Spiral } from './ui';
import { Patrones } from './screens/Patrones';
import { Diario, Highs } from './screens/HighsDiario';
import { Dentro, SupportSheet } from './screens/Dentro';
import { Ajustes } from './screens/Ajustes';

// ---------- Einstellungen über die URL ----------
const params = new URLSearchParams(window.location.search);
const RECURRING_DEMO = params.get('modo') === 'recurrente';
const URL_NOCHES = (() => {
  if (!params.has('noches')) return null;
  const n = Number(params.get('noches'));
  return Number.isFinite(n) && n >= 0 && n <= 60 ? Math.round(n) : null;
})();
const TEST = params.has('prueba') || RECURRING_DEMO || URL_NOCHES != null;
const START_DEMO = URL_NOCHES != null || RECURRING_DEMO;
const URL_BREATH = (() => {
  const n = Number(params.get('respira'));
  return Number.isFinite(n) && n >= 1 && n <= 30 ? n : null;
})();

const NO_ANSWERS = { high1: null, low: null, ask: null, high2: null };
const NO_MIRRORED = { high1: false, low: false, ask: false, high2: false };
const TABS: Phase[] = ['home', 'highs', 'patterns', 'review', 'inward'];
const TAB_W: Partial<Record<Phase, number>> = { home: 92, highs: 104, patterns: 128, review: 108, inward: 112 };
const TAB_LABEL: Partial<Record<Phase, string>> = { home: 'Hoy', highs: 'Highs', patterns: 'Patrones', review: 'Diario', inward: 'Dentro' };

function initialPhase(d: AppData): Phase {
  if (RECURRING_DEMO) return 'lock';
  if (URL_NOCHES != null && URL_NOCHES > 0) return 'home';
  return d.settings.onboarded ? 'home' : 'intro';
}

function blankUI(d: AppData): UI {
  const t = todayKey();
  const td = parseKey(t);
  return {
    phase: initialPhase(d), prog: 0, typing: false, rec: false, recSec: 0, liveText: '', breathing: false, relight: false, ritualDate: null, leaving: false,
    answers: { ...NO_ANSWERS }, mirrorText: {}, mirrored: { ...NO_MIRRORED }, reflecting: null, askHelp: false, notice: null,
    adding: null, draft: '', dayOpen: false, selDay: t, calMonth: [td.getFullYear(), td.getMonth()],
    patIdx: 0, patOpen: -1, patSel: 0, patState: 'idle', enAdding: '', enDraft: '', reflIdx: 0, supOpen: false,
    inStage: 'home', inQ: 0, inAns: '', playing: null, speaking: false,
    upOpen: false, upTitle: '', upDate: addDays(t, 1), confirmDelete: false, toast: null,
    demoNights: URL_NOCHES ?? (RECURRING_DEMO ? 3 : null),
  };
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
const r2 = (n: number) => Math.round(n * 100) / 100;
const vibrate = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* nicht unterstützt */ } };
const momentLabel = (m: Moment) => m.text || (m.audioId ? 'Nota de voz' : '');
const WEEKDAY_UP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const VOICE_MSG: Record<VoiceError, string> = {
  'sin-permiso': 'Vela no tiene permiso para usar el micrófono. Puedes activarlo en los ajustes del navegador, o escribir.',
  'sin-micro': 'No encuentro un micrófono. Puedes escribirlo.',
  'no-soportado': 'Este navegador no permite hablar con Vela. Puedes escribirlo.',
};

const H1 = "margin: 0; font-family: 'Fraunces', serif; font-weight: 300";
const BACK_BTN = 'width: 44px; height: 44px; border-radius: 22px; border: none; background: rgba(245,239,228,0.07); color: #CDBFAE; display: flex; align-items: center; justify-content: center; cursor: pointer';
const LINK_BTN = 'min-height: 44px; padding: 0 16px; border: none; background: transparent; color: #E6DACB; font-size: 15px; cursor: pointer; font-family: inherit';
const OPTION = 'width: 240px; height: 50px; border: none; border-bottom: 1px solid rgba(245,239,228,0.08); background: transparent; color: #E6DACB; font-size: 16px; letter-spacing: 0.01em; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-decoration: none; font-family: inherit';
const EYEBROW = 'margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #CDBFAE';
const INPUT = "height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.2); background: rgba(245,239,228,0.05); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; min-width: 0";

export default function App() {
  const layout = useLayout();
  const [data, setDataRaw] = useState<AppData>(() => loadData(START_DEMO ? DEMO_KEY : KEY));
  const [st, setSt] = useState<UI>(() => blankUI(data));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, setTick] = useState(0);

  const stRef = useRef(st); stRef.current = st;
  const dataRef = useRef(data); dataRef.current = data;
  const timers = useRef<number[]>([]);
  const recTimer = useRef<number | null>(null);
  const lightTimer = useRef<number | null>(null);
  const holding = useRef(false);
  const progRef = useRef(0);
  const lastTick = useRef(0);
  const voice = useRef<VoiceCapture | null>(null);
  const committed = useRef<Record<InputPhase, string | null>>({ ...NO_ANSWERS });
  const firstSave = useRef(true);
  const starting = useRef(false);
  const stepAt = useRef(0);

  const update = useCallback((p: Partial<UI> | ((s: UI) => Partial<UI>)) => {
    setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  }, []);
  const setData = useCallback((fn: (d: AppData) => AppData) => setDataRaw(fn), []);
  const toast = useCallback((msg: string) => update({ toast: msg }), [update]);

  // ---------- Speichern ----------
  const storeKey = st.demoNights != null ? DEMO_KEY : KEY;
  const storeKeyRef = useRef(storeKey);
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    if (storeKeyRef.current !== storeKey) return; // gerade gewechselt – nicht in den falschen Speicher schreiben
    if (!saveData(data, storeKey)) update({ toast: 'No se pudo guardar en este dispositivo.' });
  }, [data, storeKey, update]);
  // Wechsel echt ↔ Test: jeweils eigenen Speicher laden
  useEffect(() => {
    if (storeKeyRef.current === storeKey) return;
    storeKeyRef.current = storeKey;
    committed.current = { ...NO_ANSWERS };
    setDataRaw(loadData(storeKey));
  }, [storeKey]);
  useEffect(() => {
    if (!st.toast) return;
    const t = window.setTimeout(() => update({ toast: null }), 3200);
    return () => clearTimeout(t);
  }, [st.toast, update]);

  const breathSeconds = URL_BREATH ?? data.settings.breathSeconds;
  const today = todayKey();
  const todayEntry: DayEntry | undefined = data.days[today];
  const ritualDay = () => stRef.current.ritualDate ?? todayKey();
  const dayKey = st.ritualDate ?? today;
  const dayEntry: DayEntry | undefined = data.days[dayKey];
  const demo = st.demoNights != null;
  const nights = st.demoNights ?? completedCount(data);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearRecTimer = () => { if (recTimer.current != null) { clearInterval(recTimer.current); recTimer.current = null; } };
  const cancelVoice = () => { voice.current?.cancel(); voice.current = null; clearRecTimer(); };
  const stopSpeak = () => { try { window.speechSynthesis?.cancel(); } catch { /* egal */ } };
  const clearAll = () => {
    cancelVoice(); stopAudio(); stopSpeak();
    if (lightTimer.current != null) { clearInterval(lightTimer.current); lightTimer.current = null; }
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    holding.current = false;
    progRef.current = 0;
  };
  useEffect(() => () => clearAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (ph: Phase) => {
    stepAt.current = Date.now();
    cancelVoice(); stopAudio(); stopSpeak();
    const typingDefault = isInputPhase(ph) && dataRef.current.settings.prefer === 'texto' && !stRef.current.mirrored[ph];
    update({ phase: ph, rec: false, liveText: '', typing: typingDefault, askHelp: false, dayOpen: false, notice: null, adding: null, playing: null, speaking: false, upOpen: false, confirmDelete: false, patOpen: -1, patIdx: 0, enAdding: '', inStage: ph === 'inward' ? 'home' : stRef.current.inStage });
  };
  // Tabwechsel: Inhalt blendet 0.28 s aus, dann weich ein
  const tabGo = (ph: Phase) => {
    if (ph === stRef.current.phase || stRef.current.leaving) return;
    update({ leaving: true });
    later(() => { go(ph); update({ leaving: false }); document.querySelectorAll('.scroller').forEach((el) => { el.scrollTop = 0; }); }, 280);
  };

  // ---------- Daten schreiben ----------
  const updateDay = (date: string, fn: (e: DayEntry) => DayEntry) => {
    setDataRaw((d) => {
      const e = d.days[date] ?? emptyDay(date);
      return { ...d, days: { ...d.days, [date]: { ...fn(e), updatedAt: Date.now() } } };
    });
  };
  const setSettings = (patch: Partial<AppData['settings']>) => setDataRaw((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const commitAnswer = (k: InputPhase, a: Answer, mirrorText: string) => {
    const id = committed.current[k] ?? uid();
    committed.current[k] = id;
    const m: Moment = { id, text: a.text, via: a.via, ...(a.audioId ? { audioId: a.audioId } : {}) };
    updateDay(ritualDay(), (e) => {
      const list = [...e[k]];
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) list[i] = m; else list.push(m);
      return { ...e, [k]: list, mirrors: { ...e.mirrors, [k]: mirrorText } };
    });
  };
  const uncommit = (k: InputPhase) => {
    const id = committed.current[k];
    if (!id) return;
    committed.current[k] = null;
    const gone = dataRef.current.days[ritualDay()]?.[k].find((x) => x.id === id);
    if (gone?.audioId) deleteAudio(gone.audioId);
    updateDay(ritualDay(), (e) => {
      const mirrors = { ...e.mirrors };
      delete mirrors[k];
      return { ...e, [k]: e[k].filter((x) => x.id !== id), mirrors };
    });
  };

  // ---------- Spiegel (Lo que escuché) ----------
  const reflect = async (k: InputPhase, a: Answer) => {
    update((s) => ({ reflecting: k, answers: { ...s.answers, [k]: a }, typing: false, askHelp: false, notice: null }));
    const started = Date.now();
    const s = stRef.current;
    const ctx = { high1: k !== 'high1' ? s.answers.high1?.text : undefined, low: k === 'ask' || k === 'high2' ? s.answers.low?.text : undefined };
    const res = await mirrorAI(k, a.text, ctx);
    const wait = Math.max(0, 1600 - (Date.now() - started));
    later(() => {
      commitAnswer(k, a, res.text);
      update((x) => ({ mirrorText: { ...x.mirrorText, [k]: res.text }, mirrored: { ...x.mirrored, [k]: true }, reflecting: x.reflecting === k ? null : x.reflecting }));
    }, wait);
  };

  // ---------- Anzünden: Finger irgendwo auf dem Screen, ein Atemzug ----------
  const startTick = () => {
    if (lightTimer.current != null) return;
    lastTick.current = Date.now();
    lightTimer.current = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      const p = progRef.current + (holding.current ? dt / (breathSeconds * 1000) : -dt / 900);
      if (p >= 1) {
        clearInterval(lightTimer.current!); lightTimer.current = null; holding.current = false;
        progRef.current = 1;
        committed.current = { ...NO_ANSWERS };
        update({ prog: 1, phase: 'lit', answers: { ...NO_ANSWERS }, mirrorText: {}, mirrored: { ...NO_MIRRORED }, relight: false, ritualDate: todayKey() });
        vibrate(40);
        later(() => { progRef.current = 0; update({ prog: 0 }); go('high1'); }, 2600);
        return;
      }
      if (p <= 0 && !holding.current) {
        clearInterval(lightTimer.current!); lightTimer.current = null;
        progRef.current = 0;
        update({ prog: 0, phase: 'home' });
        return;
      }
      progRef.current = Math.max(0, p);
      update({ prog: progRef.current });
    }, 40);
  };
  const homeDone = (s: UI) => s.phase === 'home' && !!dataRef.current.days[todayKey()]?.done && !s.relight;
  const holdDown = () => {
    const s = stRef.current;
    if (homeDone(s) || s.leaving || (s.phase !== 'home' && s.phase !== 'lighting')) return;
    if (!holding.current) vibrate(10);
    holding.current = true;
    if (s.phase === 'home') update({ phase: 'lighting' });
    startTick();
  };
  const holdUp = () => { holding.current = false; };
  const onHoldDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* egal */ }
    holdDown();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!holding.current) holdDown(); } };
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => { if (e.key === ' ' || e.key === 'Enter') holdUp(); };

  // ---------- Einsprechen ----------
  const stopRecording = async () => {
    const k = stRef.current.phase;
    const capture = voice.current;
    voice.current = null;
    clearRecTimer();
    if (!capture || !isInputPhase(k)) { update({ rec: false }); return; }
    update({ rec: false, reflecting: k });
    const res = await capture.stop();
    const text = res.transcript.trim();
    if (!text && !res.audio) { update({ reflecting: null, liveText: '', notice: 'No te he oído bien. ¿Lo intentas otra vez o prefieres escribir?' }); return; }
    let audioId: string | undefined;
    if (res.audio) { const id = uid(); if (await saveAudio(id, res.audio)) audioId = id; }
    if (!text && !sttSupported()) toast('Tu voz se ha guardado. Este navegador no transcribe; puedes añadir unas palabras en «Tu día».');
    update({ liveText: '' });
    reflect(k, { text, via: 'voz', audioId, seconds: res.seconds });
  };
  const toggleRec = async () => {
    if (starting.current) return;
    const s = stRef.current;
    if (s.rec) { stopRecording(); return; }
    if (!isInputPhase(s.phase)) return;
    stopAudio();
    const capture = new VoiceCapture(
      { onTranscript: (t) => update({ liveText: t }), onError: (e) => { cancelVoice(); update({ rec: false, typing: true, notice: VOICE_MSG[e] }); } },
      () => { if (stRef.current.rec) stopRecording(); },
    );
    voice.current = capture;
    starting.current = true;
    update({ rec: true, recSec: 0, typing: false, liveText: '', notice: null });
    let ok = false;
    try { ok = await capture.start(); } finally { starting.current = false; }
    if (voice.current !== capture) { capture.cancel(); return; }
    if (!ok) { voice.current = null; update({ rec: false }); return; }
    clearRecTimer();
    recTimer.current = window.setInterval(() => update((x) => ({ recSec: x.recSec + 1 })), 1000);
  };
  const doneTyping = (text: string) => {
    const k = stRef.current.phase;
    if (!isInputPhase(k) || !text.trim()) return;
    reflect(k, { text: text.trim(), via: 'texto' });
  };

  // ---------- weitere Aktionen ----------
  const commitAdd = () => {
    const s = stRef.current;
    const key = s.adding, t = s.draft.trim();
    if (key && t) updateDay(ritualDay(), (e) => ({ ...e, [key]: [...e[key], { id: uid(), text: t, via: 'texto' as Via }] }));
    update({ adding: null, draft: '' });
  };
  const play = async (audioId: string) => {
    stopSpeak();
    if (stRef.current.playing === audioId) { stopAudio(); update({ playing: null }); return; }
    update({ playing: audioId, speaking: false });
    const ok = await playAudio(audioId, () => update({ playing: null }));
    if (!ok) update({ playing: null, toast: 'Esta grabación ya no está en el dispositivo.' });
  };
  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) { toast('Este navegador no puede leer en voz alta.'); return; }
    if (stRef.current.speaking) { synth.cancel(); update({ speaking: false }); return; }
    stopAudio();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES'; u.rate = 0.9; u.pitch = 1;
    const v = synth.getVoices().find((x) => x.lang.startsWith('es'));
    if (v) u.voice = v;
    u.onend = () => update({ speaking: false });
    u.onerror = () => update({ speaking: false });
    update({ speaking: true, playing: null });
    synth.cancel(); synth.speak(u);
  };
  const jump = (ph: Phase) => {
    clearAll();
    setSheetOpen(false);
    update({ prog: 0, reflecting: null, breathing: false, relight: false, ritualDate: null, leaving: false, supOpen: false });
    go(ph);
  };
  const setNights = (n: number) => {
    setSheetOpen(false);
    update((s) => ({ demoNights: n, patIdx: 0, patOpen: -1, patSel: 0, inStage: 'home', phase: n < 14 && s.phase === 'inward' ? 'patterns' : s.phase }));
    if (stRef.current.demoNights != null) setDataRaw((d) => ({ ...d, inward: { ...d.inward, done: 0, date: '', seen: false } }));
    else { saveData(dataRef.current, KEY); const dd = loadData(DEMO_KEY); setDataRaw({ ...dd, inward: { ...dd.inward, done: 0, date: '', seen: false } }); storeKeyRef.current = DEMO_KEY; }
  };
  const reset = () => {
    clearAll(); committed.current = { ...NO_ANSWERS };
    if (stRef.current.demoNights != null) { clearData(DEMO_KEY); const fresh = loadData(DEMO_KEY); setDataRaw(fresh); setSt({ ...blankUI(fresh), demoNights: stRef.current.demoNights }); }
    else setSt(blankUI(dataRef.current));
  };
  const blowOut = () => {
    go('sleep');
    vibrate([20, 60, 30]);
    later(() => { update({ relight: false, ritualDate: null }); go('home'); }, 4200);
  };
  const finishDay = () => {
    updateDay(ritualDay(), (e) => ({ ...e, done: true }));
    go(dataRef.current.settings.remindAsked || RECURRING_DEMO ? 'now' : 'remind');
  };
  const exportData = () => downloadFile(`vela-${todayKey()}.json`, JSON.stringify(dataRef.current, null, 2), 'application/json');
  const deleteAll = async () => {
    clearAll(); clearData(KEY); clearData(DEMO_KEY); await clearAudio();
    const fresh = emptyData();
    committed.current = { ...NO_ANSWERS };
    setDataRaw(fresh);
    setSt({ ...blankUI(fresh), phase: 'intro', demoNights: null });
  };

  // ---------- Muster laden (Claude) ----------
  const doneCount = completedCount(data);
  const sig = patternSignature(data);
  const patternsFresh = !!data.patterns && data.patterns.signature === sig;
  useEffect(() => {
    if (demo || st.phase !== 'patterns' || doneCount < 7 || patternsFresh || st.patState !== 'idle') return;
    update({ patState: 'loading' });
    analyzePatterns(entriesForAnalysis(dataRef.current)).then((r) => {
      if (r.ok) {
        setDataRaw((d) => ({ ...d, patterns: { signature: patternSignature(d), result: r.patterns, at: Date.now() } }));
        update({ patState: 'idle' });
      } else update({ patState: 'error' });
    });
  }, [demo, st.phase, doneCount, patternsFresh, st.patState, update]);

  // Sperrbildschirm-Uhr
  useEffect(() => {
    if (st.phase !== 'lock') return;
    const t = window.setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, [st.phase]);

  // ---------- Abgeleitete Werte ----------
  const ph = st.phase;
  const prog = st.prog;
  const inputPh: InputPhase | null = isInputPhase(ph) ? ph : null;
  const isHome = ph === 'home';
  const isTab = ph === 'highs' || ph === 'patterns' || ph === 'review' || ph === 'inward' || ph === 'settings';
  const isDone = isHome && !!todayEntry?.done && !st.relight;
  let f = F[ph] ?? F.home!;
  if (isDone) f = F.sleep!;
  let [scale, , halo, warmHalo] = f;
  const cool = f[1];
  let ember = 0;
  let lightA = scale > 0 ? 0.6 : 0.06;
  if (ph === 'lighting') {
    const ex = prog < 0.5 ? 0 : (prog - 0.5) * 2;
    scale = ex; halo = 0.6 + 0.4 * prog; warmHalo = 0.25 + 0.75 * prog; lightA = 0.06 + 0.54 * ex;
    ember = Math.min(1, prog * 2);
  }
  const coolBg = ph === 'low' || ph === 'ask';
  const cfg: CandleCfg = { scale: r2(scale), fop: scale > 0.02 ? 1 : 0, halo: r2(halo), warmHalo: r2(warmHalo * (1 - cool)), coolHalo: cool ? 1 : 0, ember: r2(ember), lightA: r2(lightA) };
  const warmBg = r2(Math.min(1, scale));
  const bg = ph === 'stay' || ph === 'sleep' || isDone ? '#211B26' : '#2B2430';
  const skyOp = ph === 'stay' || ph === 'sleep' || ph === 'blow' ? 0.75 : 1;

  let early = ph === 'intro' || (isHome && !isDone) || ph === 'lighting' || ph === 'lit';
  if (isTab) early = !isDone;
  const bigPh = ph === 'stay' || ph === 'journal' || ph === 'blow' || ph === 'sleep';
  const short = layout.H < 760;
  const CT: [number, number] = early ? [150, 0.75] : bigPh ? [180, 1.3] : ph === 'now' ? [318, 1] : ph === 'mirror' || isDone ? [360, 0.55]
    : ph === 'remind' && short ? [280, 0.45] : short ? [240, 0.5] : [280, 0.6];
  const glowY = early ? 41 : bigPh ? 62 : ph === 'now' ? 68 : ph === 'mirror' || isDone ? 58 : 51;
  const showC = !isTab && ph !== 'lock';
  const showNav = isHome || ph === 'highs' || ph === 'patterns' || ph === 'review' || (ph === 'inward' && (st.inStage === 'home' || st.inStage === 'refl'));
  const five = nights >= 14;
  const canHold = (isHome && !isDone) || ph === 'lighting';
  const dotIdx = inputPh ? IN[inputPh].dot : -1;

  // Datum + Mond hängen an den Nächten (Testmodus) bzw. am heutigen Tag
  const headDate = demo ? new Date(2026, 10, 9 + nights, 21, 30) : new Date();
  const moon = moonPhase(headDate);
  const dateLabel = `${WEEKDAY_UP[headDate.getDay()]}, ${headDate.getDate()} de ${MONTHS[headDate.getMonth()]}`;

  const { mobile, s: k, W, H, v } = layout;
  const T = (n: number) => Math.round(n * v);
  const colLeft = (W - 390) / 2;
  const glowPx = Math.round((glowY / 100) * 844 * v);

  // ---------- Heute-Abschnitte ----------
  const sections = (e: DayEntry | undefined) => (['high1', 'low', 'high2'] as DayKey[]).map((key) => {
    const low = key === 'low';
    const items: Moment[] = e ? [...e[key]] : [];
    const extra: Moment[] = low && e ? e.ask.map((m) => ({ ...m, text: m.text ? 'Te habría ayudado: ' + m.text : '' })) : [];
    return { key, low, label: low ? 'Low' : 'High', fill: low ? 'transparent' : GOLD, ring: low ? '#CDBFAE' : GOLD, glow: low ? 0 : 8, items: [...items, ...extra].filter((m) => momentLabel(m)) };
  });
  const todaySections = sections(dayEntry);
  const doneLines = sections(todayEntry).filter((s) => s.items.length).map((s) => ({ ring: s.ring, text: momentLabel(s.items[0]) }));
  const itemCount = todaySections.reduce((n, s) => n + s.items.length, 0);

  const playBtn = (id: string, size = 30) => (
    <button type="button" aria-label={st.playing === id ? 'Pausar' : 'Escuchar tu voz'} onClick={(e) => { e.stopPropagation(); play(id); }}
      style={sx(`width: ${size}px; height: ${size}px; border-radius: ${size / 2}px; border: 1.5px solid rgba(230,205,163,0.45); background: rgba(230,205,163,0.08); color: #F6E3C0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0`)}>
      <Icon name={st.playing === id ? 'pause-bold' : 'play-bold'} size={Math.round(size * 0.42)} />
    </button>
  );
  const guard = (fn: () => void) => () => { if (Date.now() - stepAt.current < 450) return; fn(); };

  // ---------- Erzähl-Screens ----------
  const renderInput = () => {
    if (!inputPh) return null;
    const d = IN[inputPh];
    const accent = coolBg ? COOL : '#E6CDA3';
    const answer = st.answers[inputPh];
    const mirrored = st.mirrored[inputPh];
    const refl = st.reflecting === inputPh;
    const help = inputPh === 'ask' && st.askHelp && !mirrored && !refl;
    const idle = !st.rec && !st.typing && !refl && !mirrored && !help;
    const showMic = idle || st.rec;
    const showTyping = st.typing && !mirrored && !refl;
    const showMirror = mirrored && !refl;
    const canVoice = voiceSupported();
    const soft = coolBg ? '159,180,200' : '230,205,163';
    return (
      <>
        <div className="softin2" style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
          {d.eb && <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{d.eb}</p>}
          <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>{d.t}</h1>
          <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>{d.s}</p>
        </div>
        <div className="softin2" style={sx('position: absolute; left: 28px; right: 28px; bottom: 40px; display: flex; flex-direction: column; align-items: center; gap: 18px')}>
          {st.notice && (idle || showTyping) && <p role="status" style={sx('margin: 0; padding: 10px 14px; border-radius: 16px; background: rgba(245,239,228,0.07); font-size: 13px; line-height: 1.45; color: #E6DACB; text-align: center')}>{st.notice}</p>}
          {showMic && canVoice && (
            <>
              <div style={sx('position: relative; width: 92px; height: 92px')}>
                {st.rec && <span className="recbreath" style={sx(`position: absolute; left: -22px; top: -22px; width: 136px; height: 136px; border-radius: 50%; background: radial-gradient(circle, rgba(${soft},0.35) 0%, rgba(43,36,48,0) 70%)`)} />}
                <button type="button" aria-label={st.rec ? 'Detener grabación' : 'Iniciar grabación'} aria-pressed={st.rec} onClick={guard(toggleRec)}
                  style={sx(`position: relative; width: 92px; height: 92px; border-radius: 46px; border: 1.5px solid ${accent}; background: ${st.rec ? accent : `rgba(${soft},0.12)`}; color: ${st.rec ? '#2B2430' : accent}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .8s ease, color .8s ease`)}>
                  {st.rec ? <span style={sx('width: 20px; height: 20px; border-radius: 5px; background: #2B2430')} /> : <Icon name="microphone-3-linear" size={32} />}
                </button>
              </div>
              <p role={st.rec ? 'status' : undefined} style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>{st.rec ? `Te escucho … ${Math.floor(st.recSec / 60)}:${pad(st.recSec % 60)}` : 'Toca y cuéntamelo'}</p>
              {st.rec ? (
                <p data-testid="transcripcion" aria-live="polite" style={sx(`${ITALIC}; min-height: 44px; max-height: 44px; overflow: hidden; font-size: 15px; line-height: 1.45; color: #E6DACB; text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical`)}>
                  {st.liveText ? '… ' + st.liveText.split(' ').slice(-14).join(' ') : ''}
                </p>
              ) : (
                <div style={sx('display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap')}>
                  <button type="button" onClick={guard(() => { cancelVoice(); update({ typing: true, notice: null }); })} style={sx(LINK_BTN)}>Prefiero escribir</button>
                  {inputPh === 'ask' && (
                    <>
                      <span aria-hidden="true" style={sx('color: rgba(205,191,174,0.5)')}>·</span>
                      <button type="button" onClick={guard(() => { cancelVoice(); update({ askHelp: true, typing: false, notice: null }); })} style={sx('min-height: 44px; padding: 0 12px; border: none; background: transparent; color: #CDBFAE; font-size: 15px; cursor: pointer; font-family: inherit')}>No lo sé</button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {idle && !canVoice && (
            <>
              <button type="button" onClick={() => update({ typing: true })} style={sx(PRIMARY + '; width: 100%')}>Escribirlo</button>
              {inputPh === 'ask' && <button type="button" onClick={() => update({ askHelp: true })} style={sx(LINK_BTN)}>No lo sé</button>}
            </>
          )}
          {help && (
            <>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #E6DACB; text-align: center')}>Está bien no saberlo. Quizás algo de esto:</p>
              <div style={sx('display: flex; flex-wrap: wrap; gap: 8px; justify-content: center')}>
                {SUGG.map((lab) => <button key={lab} type="button" onClick={() => reflect('ask', { text: lab, via: 'sugerencia' })} style={sx('height: 42px; padding: 0 18px; border-radius: 21px; border: 1px solid rgba(245,239,228,0.22); background: rgba(245,239,228,0.05); color: #F5EFE4; font-size: 14px; cursor: pointer; font-family: inherit')}>{lab}</button>)}
              </div>
              <button type="button" onClick={() => d.skipTo && go(d.skipTo)} style={sx(LINK_BTN + '; color: #CDBFAE; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgba(205,191,174,0.4)')}>Seguir sin respuesta</button>
            </>
          )}
          {showTyping && <TypingBox key={inputPh} label={d.t} accent={accent} initial={answer?.via === 'texto' ? answer.text : ''} onDone={doneTyping} onSpeak={canVoice ? () => update({ typing: false, notice: null }) : undefined} onDontKnow={inputPh === 'ask' ? () => update({ typing: false, askHelp: true }) : undefined} />}
          {refl && (
            <>
              <div aria-hidden="true" style={sx('height: 40px; display: flex; gap: 8px; align-items: center')}><span className="thinkdot" /><span className="thinkdot" /><span className="thinkdot" /></div>
              <p role="status" style={sx('margin: 0 0 60px; font-size: 14px; color: #CDBFAE')}>Un momento …</p>
            </>
          )}
          {showMirror && (
            <>
              <div style={sx(`width: 100%; padding: 18px 20px; border-radius: 22px; border: 1px solid ${coolBg ? 'rgba(159,180,200,0.32)' : 'rgba(242,180,90,0.32)'}; background: rgba(40,33,48,0.82); -webkit-backdrop-filter: blur(16px) saturate(130%); backdrop-filter: blur(16px) saturate(130%); display: flex; flex-direction: column; gap: 8px`)}>
                <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 10px')}>
                  <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #CDBFAE')}>Lo que escuché</p>
                  {answer?.audioId && playBtn(answer.audioId, 28)}
                </div>
                <p data-testid="mirror-text" style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 19px; line-height: 1.45; color: #F5EFE4")}>{st.mirrorText[inputPh]}</p>
              </div>
              <div style={sx('display: flex; gap: 16px; justify-content: center; align-items: center')}>
                <button type="button" onClick={() => { stopAudio(); uncommit(inputPh); update((s) => ({ answers: { ...s.answers, [inputPh]: null }, mirrored: { ...s.mirrored, [inputPh]: false }, typing: dataRef.current.settings.prefer === 'texto', askHelp: false, playing: null })); }} style={sx('min-height: 48px; padding: 0 14px; border: none; background: transparent; color: #E6DACB; font-size: 15px; cursor: pointer; font-family: inherit')}>Repetir</button>
                <button type="button" onClick={guard(() => go(d.next))} style={sx(`height: 48px; min-width: 160px; padding: 0 32px; border-radius: 24px; border: 1px solid ${accent}; background: ${accent}; color: #2B2430; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit`)}>Seguir</button>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  // ---------- Tu día ----------
  const renderMirror = () => (
    <>
      <div style={sx(`position: absolute; left: 24px; right: 24px; top: 96px; max-height: ${st.dayOpen ? Math.min(580, H - 220) : Math.min(300, H - 400)}px; overflow-y: auto; padding: 22px 22px 0 20px; border-radius: 26px; background: ${st.dayOpen ? 'rgba(40,33,48,0.97)' : 'linear-gradient(160deg, rgba(245,239,228,0.09) 0%, rgba(245,239,228,0.03) 100%)'}; -webkit-backdrop-filter: blur(16px) saturate(130%); backdrop-filter: blur(16px) saturate(130%); transition: max-height .7s ease, background .7s ease; border: 1px solid rgba(245,239,228,0.1); box-shadow: 0 24px 50px -24px rgba(0,0,0,0.6); z-index: 1`)}>
        <div style={sx('display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 14px')}>
          <h1 style={sx(H1 + '; font-size: 26px; line-height: 1')}>Tu día</h1>
          <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.04em; color: #CDBFAE')}>{cap(longLabel(dayKey))}</p>
        </div>
        <div style={sx('position: relative; display: flex; flex-direction: column; gap: 18px; padding-left: 26px')}>
          <span aria-hidden="true" style={sx('position: absolute; left: 5px; top: 8px; bottom: 8px; width: 1px; background: linear-gradient(180deg, rgba(242,180,90,0.6), rgba(205,191,174,0.25) 50%, rgba(242,180,90,0.6))')} />
          {todaySections.map((sec) => (
            <div key={sec.key} data-testid={'dia-' + sec.key} style={sx('position: relative; display: flex; flex-direction: column; gap: 6px')}>
              <span aria-hidden="true" style={sx(`position: absolute; left: -26px; top: 6px; width: 11px; height: 11px; border-radius: 6px; background: ${sec.fill}; border: 1.5px solid ${sec.ring}; box-shadow: 0 0 ${sec.glow}px rgba(242,180,90,0.55)`)} />
              <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
                <p style={sx(EYEBROW)}>{sec.label}</p>
                <button type="button" aria-label={'Añadir ' + sec.label} onClick={() => update({ adding: sec.key, draft: '' })} style={sx('height: 28px; padding: 0 12px; border-radius: 14px; border: 1px solid rgba(245,239,228,0.14); background: transparent; color: #CDBFAE; font-size: 12px; cursor: pointer; font-family: inherit')}>+ Añadir</button>
              </div>
              {sec.items.length === 0 && st.adding !== sec.key && <p style={sx(ITALIC + '; font-size: 15px; color: rgba(205,191,174,0.6)')}>{sec.low ? 'Hoy no lo nombraste. Está bien así.' : 'Aún nada.'}</p>}
              {sec.items.map((m) => (
                <div key={m.id + m.text} style={sx('display: flex; gap: 8px; align-items: flex-start')}>
                  <span aria-hidden="true" style={sx(`margin-top: 11px; width: 6px; height: 1px; flex-shrink: 0; background: #CDBFAE; opacity: ${sec.items.length > 1 ? 1 : 0}`)} />
                  <p style={sx(ITALIC + '; font-size: 17px; line-height: 1.4; color: #F5EFE4; flex-grow: 1')}>{momentLabel(m)}</p>
                  {m.audioId && playBtn(m.audioId, 28)}
                </div>
              ))}
              {st.adding === sec.key && (
                <div style={sx('display: flex; gap: 8px; align-items: center; margin-top: 2px')}>
                  <input type="text" aria-label={'Añadir ' + sec.label} placeholder="Algo más …" value={st.draft} autoFocus enterKeyHint="done" onChange={(e) => update({ draft: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitAdd(); } if (e.key === 'Escape') update({ adding: null, draft: '' }); }} style={sx(INPUT + '; flex-grow: 1')} />
                  <button type="button" onClick={commitAdd} style={sx('height: 40px; padding: 0 16px; border-radius: 20px; border: none; background: #E6CDA3; color: #2B2430; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit')}>OK</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={sx(`position: sticky; bottom: 0; margin: 0 -22px 0 -20px; padding: 26px 0 14px; display: flex; justify-content: center; background: linear-gradient(180deg, rgba(40,33,48,0) 0%, ${st.dayOpen ? 'rgba(40,33,48,1)' : 'rgba(40,33,48,0.92)'} 55%)`)}>
          {(itemCount > 3 || st.dayOpen) && (
            <button type="button" aria-expanded={st.dayOpen} onClick={() => update((s) => ({ dayOpen: !s.dayOpen }))} style={sx('height: 34px; padding: 0 16px; border-radius: 17px; border: 1px solid rgba(245,239,228,0.16); background: rgba(43,36,48,0.6); color: #E6DACB; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit')}>
              {st.dayOpen ? 'Ver menos' : 'Ver todo'}<Icon name="alt-arrow-down-linear" size={14} style={{ transform: `rotate(${st.dayOpen ? 180 : 0}deg)`, transition: 'transform .4s' }} />
            </button>
          )}
        </div>
      </div>
      <div style={sx('position: absolute; left: 28px; right: 28px; bottom: 28px; display: flex; flex-direction: column; gap: 14px')}>
        <button type="button" onClick={() => update({ breathing: true })} style={sx('width: 100%; height: 50px; border-radius: 25px; border: 1px solid rgba(245,239,228,0.25); background: transparent; color: #F5EFE4; font-size: 15px; cursor: pointer; font-family: inherit')}>Respirar un momento</button>
        <button type="button" onClick={finishDay} style={sx(PRIMARY + '; width: 100%')}>Seguir</button>
      </div>
    </>
  );

  // ---------- Kontext für die Reiter ----------
  const ctx: Ctx = { data, setData, ui: st, update, today, nights, demo, go, tabGo, toast, playBtn, speak, retryPatterns: () => update({ patState: 'idle' }) };

  const jumps: [string, Phase][] = RECURRING_DEMO ? JUMPS_RECURRING : JUMPS_FIRST;
  const testTools = (
    <>
      <p className="testbar-title">Ir directamente a</p>
      <div className="testbar-row">{jumps.map(([label, target]) => <button key={label} type="button" className="jump" aria-pressed={target === ph} onClick={() => jump(target)}>{label}</button>)}</div>
      <p className="testbar-title" style={{ marginTop: 6 }}>Noches con Vela</p>
      <div className="testbar-row">
        {NIGHT_STEPS.map((n) => <button key={n} type="button" className="jump night" aria-pressed={st.demoNights === n} onClick={() => setNights(n)}>{n}</button>)}
        <button type="button" className="jump" aria-pressed={st.demoNights == null} onClick={() => { update({ demoNights: null }); setSheetOpen(false); }}>Mis noches ({doneCount})</button>
      </div>
      <div className="testbar-links">
        <a href="/?prueba=1">Modo prueba</a>
        <a href="/?modo=recurrente">Notificación</a>
        <a href="/?noches=14">Noche 14</a>
        <a href="/">App normal</a>
        <span>Respiración: {breathSeconds} s</span>
      </div>
      <p className="credit">Iconos: <a href="https://www.figma.com/community/file/1166831539721848736" target="_blank" rel="noopener noreferrer">Solar</a> de 480 Design, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></p>
    </>
  );

  // Navbar-Geometrie (Pille gleitet)
  const navTabs = TABS.filter((t) => t !== 'inward' || five);
  const inW = five ? 50 : 56;
  const navActive: Phase = ph === 'highs' || ph === 'patterns' || ph === 'review' || ph === 'inward' ? ph : ph === 'settings' ? 'review' : 'home';
  let navX = 6;
  for (const t of navTabs) { if (t === navActive) break; navX += inW + 4; }

  const navIcon = (t: Phase, on: boolean) => {
    if (t === 'home') return <Icon name={on ? 'moon-stars-bold-duotone' : 'moon-stars-linear'} size={24} />;
    if (t === 'highs') return <Icon name={on ? 'star-shine-bold-duotone' : 'star-shine-linear'} size={24} />;
    if (t === 'patterns') return <Icon name={on ? 'target-bold-duotone' : 'target-linear'} size={24} />;
    if (t === 'review') return <Icon name={on ? 'calendar-bold-duotone' : 'calendar-linear'} size={24} />;
    return <Spiral size={24} />;
  };

  // ---------- Bühne (Telefon) ----------
  const stage = (
    <AppCtx.Provider value={ctx}>
      <div className="stage" style={{ position: 'relative', width: W, height: H, overflow: 'hidden', borderRadius: mobile ? 0 : 44, background: bg, transition: 'background 1.6s ease', fontFamily: "'Nunito Sans', sans-serif", color: '#F5EFE4', transform: `scale(${k})`, transformOrigin: '0 0' }}>
        {/* Nachthimmel mit Sternen */}
        <div aria-hidden="true" className="sky" style={sx(`position: absolute; inset: 0; background: linear-gradient(to top, #050409 0%, rgba(6,5,11,0.97) 8%, rgba(9,7,15,0.88) 16%, rgba(14,11,21,0.72) 24%, rgba(20,16,28,0.56) 32%, rgba(26,21,36,0.48) 40%, rgba(30,25,44,0.56) 47%, rgba(34,29,52,0.72) 54%, rgba(36,31,56,0.88) 61%, #231F3A 68%, #1C1931 76%, #15132A 84%, #0F0D21 92%, #0A0918 100%); opacity: ${skyOp}; transition: opacity 1.6s ease; pointer-events: none`)}>
          <div style={{ position: 'absolute', left: colLeft, top: 0, width: 390, height: H }}>
            {STARS.map((s, i) => (
              <span key={i} style={sx(`position: absolute; left: ${s.x}px; top: ${Math.round(s.y * v)}px; width: ${s.s}px; height: ${s.s}px; opacity: ${s.o}`)}>
                <span className="twk" style={sx(`display: block; width: 100%; height: 100%; border-radius: 50%; background: #F7EEDC; box-shadow: 0 0 ${s.g}px rgba(247,238,220,0.6); animation-duration: ${s.d}s; animation-delay: ${s.dl}s`)} />
              </span>
            ))}
          </div>
        </div>
        {/* Warmer Raum-Glow um die Flamme */}
        <div aria-hidden="true" style={sx(`position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 50% ${glowPx}px, rgba(242,180,90,0.34) 0%, rgba(192,138,107,0.14) ${Math.round(0.3 * 844 * v)}px, rgba(43,36,48,0) ${Math.round(0.64 * 844 * v)}px); opacity: ${showC && !st.leaving ? warmBg : 0}; transition: opacity 1.6s ease`)} />
        {ph === 'inward' && <div aria-hidden="true" style={sx(`position: absolute; left: 50%; top: ${T(250)}px; width: 420px; height: 420px; margin-left: -210px; border-radius: 50%; background: radial-gradient(circle, rgba(201,182,228,0.16) 0%, rgba(201,182,228,0) 65%); pointer-events: none`)} />}
        {ph === 'lock' && <div aria-hidden="true" style={sx('position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% 0%, #3A3140 0%, #241E29 55%, #1A1620 100%)')} />}

        <div style={{ position: 'absolute', left: colLeft, width: 390, top: 0, height: H }}>
          <Candle cfg={cfg} top={Math.round(CT[0] * v)} scale={r2(CT[1] * v * (showC ? 1 : 0.92))} opacity={showC && !st.leaving ? 1 : 0} ringOp={ph === 'lighting' ? 1 : 0} ringOff={Math.round((1 - prog) * 1000) / 1000} showWickHint={isHome && !isDone && nights < 3} />

          {ph === 'lock' && (
            <>
              <div style={sx('position: absolute; left: 0; right: 0; top: 96px; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #F5EFE4')}>
                <p style={sx('margin: 0; font-size: 16px; font-weight: 600; color: #E6DACB')}>{cap(longLabel(keyOf(headDate)))}</p>
                <p style={sx('margin: 0; font-size: 84px; font-weight: 300; line-height: 1; letter-spacing: -0.02em')}>{demo ? '21:30' : `${headDate.getHours()}:${pad(headDate.getMinutes())}`}</p>
              </div>
              <button type="button" onClick={() => go('home')} aria-label="Abrir notificación de Vela" style={sx(`position: absolute; left: 14px; right: 14px; top: ${T(300)}px; padding: 14px 16px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.12); background: rgba(245,239,228,0.1); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); color: #F5EFE4; display: flex; gap: 12px; align-items: flex-start; text-align: left; cursor: pointer; font-family: inherit`)}>
                <img src="/icons/icon-192.png" alt="" aria-hidden="true" width={38} height={38} style={sx('width: 38px; height: 38px; border-radius: 22%; flex-shrink: 0')} />
                <span style={sx('display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1')}>
                  <span style={sx('display: flex; justify-content: space-between; font-size: 13px; color: #CDBFAE')}><span style={sx('font-weight: 700; letter-spacing: 0.04em')}>VELA</span><span>ahora</span></span>
                  <span style={sx('font-size: 15px; font-weight: 700')}>El día se va apagando.</span>
                  <span style={sx('font-size: 15px; line-height: 1.4; color: #E6DACB')}>¿Quieres cerrarlo con tres momentos?</span>
                </span>
              </button>
              <p className="fadehint" style={sx(`position: absolute; left: 0; right: 0; top: ${T(420)}px; margin: 0; text-align: center; font-size: 13px; color: #CDBFAE`)}>Toca la notificación</p>
            </>
          )}

          {/* Kopfzeile mit Datum und Mond */}
          {(ph === 'intro' || isHome || ph === 'lighting' || ph === 'lit') && (
            <div style={sx('position: absolute; top: 46px; left: 24px; right: 18px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; z-index: 1')}>
              <div style={sx('display: flex; flex-direction: column; gap: 3px')}>
                <p data-testid="fecha" style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>{dateLabel}</p>
                <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(205,191,174,0.7)')}>{moon.name} · {moon.pct} %</p>
              </div>
              <div role="img" aria-label={moon.aria} style={sx('position: relative; width: 88px; height: 88px; display: flex; align-items: center; justify-content: center')}>
                <span className="mglow" aria-hidden="true" style={sx(`position: absolute; inset: -18px; border-radius: 50%; background: radial-gradient(circle, rgba(243,230,207,0.22) 0%, rgba(243,230,207,0.05) 50%, rgba(243,230,207,0) 72%); opacity: ${moon.glow}`)} />
                <svg aria-hidden="true" width="78" height="78" viewBox="-22 -22 44 44" style={{ position: 'relative', overflow: 'visible' }}>
                  <defs>
                    <radialGradient id="dSurf" cx="0.42" cy="0.38" r="0.75"><stop offset="0" stopColor="#FBF3E4" /><stop offset="0.6" stopColor="#E9DAC0" /><stop offset="1" stopColor="#CDB99B" /></radialGradient>
                    <clipPath id="dLit"><path d={moon.d19} /></clipPath>
                    <filter id="dSoft" x="-0.2" y="-0.2" width="1.4" height="1.4"><feGaussianBlur stdDeviation="0.5" /></filter>
                  </defs>
                  <circle r="19" fill="rgba(243,230,207,0.06)" stroke="rgba(245,239,228,0.32)" strokeWidth="0.5" />
                  <g filter="url(#dSoft)"><path d={moon.d19} fill="url(#dSurf)" /></g>
                  <g clipPath="url(#dLit)" fill="#B9A487"><circle cx="-5.1" cy="-6.6" r="3.3" opacity="0.28" /><circle cx="5.8" cy="-2.2" r="2.2" opacity="0.22" /><circle cx="1.5" cy="7.3" r="4" opacity="0.2" /><circle cx="9.5" cy="8" r="1.5" opacity="0.25" /><circle cx="-8.8" cy="5.1" r="1.8" opacity="0.2" /><circle cx="11" cy="-9.5" r="1.3" opacity="0.25" /></g>
                </svg>
              </div>
            </div>
          )}

          {inputPh && (
            <div style={sx('position: absolute; top: 54px; left: 24px; right: 24px; height: 44px; display: flex; justify-content: center; align-items: center; z-index: 2')}>
              {IN[inputPh].back && <button type="button" aria-label="Atrás" onClick={() => go(IN[inputPh].back!)} style={sx('position: absolute; left: 0; top: 0; ' + BACK_BTN)}><Icon name="alt-arrow-left-linear" size={20} /></button>}
              {IN[inputPh].skip && <button type="button" onClick={() => go(IN[inputPh].skipTo!)} style={sx('position: absolute; right: 0; top: 0; height: 44px; padding: 0 4px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer; font-family: inherit')}>{IN[inputPh].skip}</button>}
              <div role="img" aria-label={'Paso ' + (dotIdx + 1) + ' de 3'} style={sx('display: flex; gap: 8px; align-items: center')}>
                {[0, 1, 2].map((i) => { const on = i === dotIdx, dn = i < dotIdx, c = i === 1 ? COOL : GOLD; return <span key={i} style={sx(`width: ${on ? 24 : 8}px; height: 8px; border-radius: 4px; background: ${on || dn ? c : 'transparent'}; border: 1.5px solid ${on || dn ? c : 'rgba(245,239,228,0.35)'}; transition: all .8s`)} />; })}
              </div>
            </div>
          )}

          {ph === 'intro' && (
            <div className="softin" style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; bottom: 36px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px`)}>
              <h1 style={sx(H1 + '; font-size: 32px; line-height: 1.2')}>Hola, soy Vela.</h1>
              <p style={sx('margin: 0; font-size: 16px; line-height: 1.55; color: #CDBFAE')}>Cada noche, tres momentos: algo bueno, algo difícil y otra vez algo bueno. No hace falta más.</p>
              <div style={sx('flex-grow: 1')} />
              <button type="button" onClick={() => { setSettings({ onboarded: true }); navigator.storage?.persist?.().catch(() => undefined); go('home'); }} style={sx(PRIMARY + '; width: 100%; min-height: 58px; border-radius: 29px; font-size: 17px; flex-shrink: 0')}>Enciende tu primera luz</button>
              <p style={sx('margin: 0; font-size: 13px; color: #CDBFAE')}>Tus momentos son solo tuyos.</p>
            </div>
          )}

          {isHome && !isDone && !st.leaving && (
            <div className="tabin" style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; pointer-events: none`)}>
              <h1 style={sx(H1 + '; font-size: 30px; line-height: 1.22')}>{todayEntry?.done ? 'Aquí sigo, si quieres más.' : 'Qué bien que estés aquí.'}</h1>
              <p style={sx('margin: -8px 0 0; font-size: 17px; line-height: 1.5; color: #CDBFAE')}>¿Cómo ha ido tu día?</p>
              {!(five && !data.inward.seen && H < 800) && <p style={sx('margin: 0; padding: 8px 16px; border-radius: 16px; background: rgba(245,239,228,0.07); font-size: 14px; color: #E6DACB')}>Deja el dedo en la pantalla</p>}
            </div>
          )}

          {isDone && !st.leaving && (
            <div className="tabin" style={sx('position: absolute; left: 28px; right: 28px; top: 150px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; z-index: 6')}>
              <h1 style={sx(H1 + '; font-size: 30px')}>Que descanses.</h1>
              {doneLines.length > 0 && (
                <div style={sx('width: 100%; padding: 16px 18px; border-radius: 20px; background: rgba(245,239,228,0.06); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); text-align: left; display: flex; flex-direction: column; gap: 10px')}>
                  <p style={sx('margin: 0; font-size: 13px; font-weight: 700; color: #E6DACB')}>Tu día</p>
                  {doneLines.map((m, i) => <div key={i} style={sx('display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 1.45; color: #F5EFE4')}><span style={sx(`width: 8px; height: 8px; border-radius: 4px; margin-top: 6px; flex-shrink: 0; background: ${m.ring}`)} />{m.text}</div>)}
                </div>
              )}
              <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Mañana por la noche te espera tu luz.</p>
              <div style={sx('display: flex; gap: 10px; justify-content: center; flex-wrap: wrap')}>
                <button type="button" onClick={() => go('mirror')} style={sx(GHOST)}>Ver tu día</button>
                <button type="button" onClick={() => update({ relight: true })} style={sx(GHOST)}>Volver al inicio</button>
              </div>
            </div>
          )}

          {ph === 'lighting' && (
            <div aria-live="polite" style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; pointer-events: none`)}>
              <h1 style={sx(H1 + '; font-size: 30px; line-height: 1.22')}>{prog < 0.5 ? 'Inhala conmigo.' : 'Y exhala despacio.'}</h1>
              <p style={sx('margin: 0; font-size: 15px; color: #CDBFAE')}>Deja el dedo en la pantalla.</p>
            </div>
          )}
          {ph === 'lit' && <div className="softin" style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; text-align: center`)}><h1 style={sx(H1 + '; font-size: 30px')}>Tu luz está encendida.</h1></div>}

          {renderInput()}
          {ph === 'mirror' && renderMirror()}

          {ph === 'remind' && (
            <div className="softin" style={sx('position: absolute; left: 28px; right: 28px; top: 112px; bottom: 28px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
              <h1 style={sx(H1 + '; font-size: 28px')}>Qué bien que hayas venido.</h1>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>¿Quieres que mañana por la noche te lo recuerde con suavidad?</p>
              <div style={sx('display: flex; gap: 10px; margin-top: 6px')}>
                {['21:00', '21:30', '22:00'].map((tm) => { const on = data.settings.remindTime === tm; return <button key={tm} type="button" aria-pressed={on} onClick={() => setSettings({ remindTime: tm })} style={sx(`min-width: 84px; height: 46px; border-radius: 23px; border: 1px solid ${on ? '#E6CDA3' : 'rgba(245,239,228,0.22)'}; background: ${on ? 'rgba(230,205,163,0.18)' : 'transparent'}; color: #F5EFE4; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit`)}>{tm}</button>; })}
              </div>
              <p style={sx('margin: 0; font-size: 13px; color: #CDBFAE')}>Solo una vez por la noche. Puedes cambiarlo cuando quieras.</p>
              <div style={sx('flex-grow: 1')} />
              <button type="button" onClick={() => { addReminderToCalendar(dataRef.current.settings.remindTime); setSettings({ remindAsked: true, remindOn: true }); toast('Abre el archivo para añadirlo a tu calendario.'); go('now'); }} style={sx(PRIMARY + '; width: 100%; flex-shrink: 0')}>Sí, por favor</button>
              <button type="button" onClick={() => { setSettings({ remindAsked: true }); go('now'); }} style={sx('min-height: 44px; border: none; background: transparent; color: #E6DACB; font-size: 15px; cursor: pointer; font-family: inherit')}>Mejor no</button>
            </div>
          )}

          {ph === 'now' && (
            <>
              <button type="button" aria-label="Volver a tu día" onClick={() => go('mirror')} style={sx('position: absolute; left: 24px; top: 54px; z-index: 2; ' + BACK_BTN)}><Icon name="alt-arrow-left-linear" size={20} /></button>
              <div className="softin" style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px')}>
                <h1 style={sx(H1 + '; font-size: 28px')}>Tu día ya puede descansar.</h1>
                <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>Quédate todo el tiempo que quieras. O sigue hacia donde te lleve el momento.</p>
              </div>
              <div className="softin2" style={sx(`position: absolute; left: 0; right: 0; top: ${T(290)}px; display: flex; flex-direction: column; align-items: center`)}>
                <button type="button" onClick={() => go('stay')} style={sx(OPTION)}><span style={sx('color: #E6CDA3; display: flex')}><Icon name="fire-linear" size={18} /></span>Quedarme con la vela</button>
                <button type="button" onClick={() => go('journal')} style={sx(OPTION)}><span style={sx('color: #E6CDA3; display: flex')}><Icon name="notebook-linear" size={18} /></span>Escribir en mi diario</button>
                <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer" style={sx(OPTION)}><span style={sx('color: #E6CDA3; display: flex')}><Icon name="music-notes-linear" size={18} /></span>Escuchar música tranquila</a>
                <button type="button" onClick={() => go('blow')} style={sx(OPTION + '; border-bottom: none')}><span style={sx('color: #E6CDA3; display: flex')}><Icon name="moon-sleep-linear" size={18} /></span>Irme a dormir</button>
              </div>
            </>
          )}

          {ph === 'stay' && <p className="fadehint" style={sx('position: absolute; left: 0; right: 0; top: 140px; margin: 0; text-align: center; font-size: 13px; color: #CDBFAE; pointer-events: none')}>Toca en cualquier lugar para volver</p>}
          {ph === 'journal' && (
            <>
              <div className="softin" style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; pointer-events: none')}>
                <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>Coge tu libreta y tu bolígrafo.</h1>
                <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>Escribe lo que aún quiera salir. Vela te acompaña.</p>
              </div>
              <p className="fadehint" style={sx(`position: absolute; left: 0; right: 0; top: ${T(400)}px; margin: 0; text-align: center; font-size: 13px; color: #CDBFAE; pointer-events: none`)}>Toca en cualquier lugar para volver</p>
            </>
          )}
          {ph === 'blow' && (
            <>
              <div className="softin" style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
                <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>Cuando quieras, apágala.</h1>
                <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>Toca la llama.</p>
              </div>
              <button type="button" aria-label="Apagar la vela" onClick={blowOut} style={sx(`position: absolute; left: 115px; top: ${T(300)}px; width: 160px; height: ${T(240)}px; border-radius: 80px; border: none; background: transparent; cursor: pointer`)} />
            </>
          )}
          {ph === 'sleep' && <div className="softin" style={sx('position: absolute; left: 32px; right: 32px; top: 120px; text-align: center')}><h1 style={sx(H1 + '; font-size: 32px')}>Que descanses.</h1></div>}
        </div>

        {/* Reiter (eigener Scroll) */}
        {isTab && (
          <div key={ph} style={{ position: 'absolute', left: colLeft, width: 390, top: 0, height: H, opacity: st.leaving ? 0 : 1, transition: 'opacity .28s ease' }}>
            {ph === 'highs' && <Highs />}
            {ph === 'patterns' && <Patrones />}
            {ph === 'review' && <Diario />}
            {ph === 'inward' && <Dentro />}
            {ph === 'settings' && <Ajustes onExport={exportData} onDeleteAll={deleteAll} />}
          </div>
        )}

        {(ph === 'stay' || ph === 'journal') && <button type="button" aria-label="Volver a las opciones" onClick={() => go('now')} style={sx('position: absolute; inset: 0; border: none; background: transparent; cursor: pointer')} />}

        {/* Halte-Fläche: Finger irgendwo auf dem Screen */}
        {canHold && (
          <button type="button" className="wick" aria-label="Encender la vela: deja el dedo en la pantalla" onPointerDown={onHoldDown} onPointerUp={holdUp} onPointerCancel={holdUp} onLostPointerCapture={holdUp} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onContextMenu={(e) => e.preventDefault()}
            style={sx(`position: absolute; left: 0; right: 0; top: 0; bottom: ${isHome ? 96 : 0}px; z-index: 5; border: none; background: transparent; cursor: pointer`)} />
        )}

        {showNav && (
          <>
            <div aria-hidden="true" style={sx('position: absolute; left: 0; right: 0; bottom: 0; height: 220px; background: linear-gradient(to top, rgba(6,5,10,1) 0%, rgba(6,5,10,0.94) 22%, rgba(6,5,10,0.72) 42%, rgba(6,5,10,0.42) 62%, rgba(6,5,10,0.16) 82%, rgba(6,5,10,0) 100%); pointer-events: none; z-index: 3')} />
            <nav aria-label="Navegación principal" style={sx('position: absolute; left: 50%; bottom: 26px; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; padding: 6px; border-radius: 32px; background: rgba(36,31,48,0.62); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); border: 1px solid rgba(245,239,228,0.1); box-shadow: 0 18px 40px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(245,239,228,0.06); z-index: 7')}>
              <span aria-hidden="true" style={sx(`position: absolute; top: 6px; left: ${navX}px; width: ${TAB_W[navActive]}px; height: 48px; border-radius: 24px; background: #E6CDA3; box-shadow: 0 6px 18px -8px rgba(230,205,163,0.55); transition: left .65s cubic-bezier(0.4, 0, 0.2, 1), width .65s cubic-bezier(0.4, 0, 0.2, 1)`)} />
              {navTabs.map((t) => {
                const on = t === navActive;
                const pulse = t === 'inward' && !on && isHome && !isDone && !data.inward.seen;
                return (
                  <button key={t} type="button" aria-current={on ? 'page' : undefined} aria-label={TAB_LABEL[t]} onClick={() => tabGo(t)} className={pulse ? 'navpulse' : undefined}
                    style={sx(`position: relative; z-index: 1; height: 48px; width: ${on ? TAB_W[t] : inW}px; padding: 0; border-radius: 24px; border: none; background: transparent; color: ${on ? '#2B2430' : t === 'inward' ? '#DCCDF0' : '#CDBFAE'}; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: ${on ? 8 : 0}px; cursor: pointer; overflow: hidden; font-family: inherit; transition: width .65s cubic-bezier(0.4, 0, 0.2, 1), color .5s ease, gap .65s cubic-bezier(0.4, 0, 0.2, 1)`)}>
                    {navIcon(t, on)}
                    <span aria-hidden="true" style={sx(`display: inline-block; max-width: ${on ? 80 : 0}px; opacity: ${on ? 1 : 0}; overflow: hidden; white-space: nowrap; transition: max-width .65s cubic-bezier(0.4, 0, 0.2, 1), opacity .45s ease ${on ? 0.2 : 0}s`)}>{TAB_LABEL[t]}</span>
                  </button>
                );
              })}
            </nav>
          </>
        )}

        {/* Hinweis ab 14 Nächten: Introspección (Stern fällt zum Dentro-Punkt) */}
        {isHome && !isDone && five && !st.leaving && !data.inward.seen && (
          <>
            <span aria-hidden="true" className="starfall" style={sx(`position: absolute; left: ${colLeft + 192}px; top: ${H - 110}px; width: 6px; height: 6px; border-radius: 3px; z-index: 8; background: #F4EEFF; box-shadow: 0 0 10px 3px rgba(220,205,245,0.9); pointer-events: none`)} />
            <button type="button" onClick={() => tabGo('inward')} className="softin" style={sx(`position: absolute; left: 0; right: 0; margin: 0 auto; width: max-content; bottom: 116px; z-index: 6; height: 38px; padding: 0 14px 0 10px; border-radius: 19px; border: 1px solid rgba(201,182,228,0.45); background: rgba(58,44,88,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #F4EEFF; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit; white-space: nowrap; box-shadow: 0 0 20px -4px rgba(201,182,228,0.6)`)}>
              <span aria-hidden="true" className="orb" style={sx('width: 8px; height: 8px; border-radius: 4px; background: #EDE3F8; box-shadow: 0 0 8px 2px rgba(201,182,228,0.8)')} />Nuevo · Introspección, aquí abajo
            </button>
          </>
        )}

        {st.breathing && (
          <div style={sx('position: absolute; inset: 0; background: #221D28; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; z-index: 9')}>
            <div style={sx('position: relative; width: 240px; height: 240px; display: flex; align-items: center; justify-content: center')}>
              <div className="breath" style={sx('position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(242,180,90,0.5) 0%, rgba(242,180,90,0.14) 55%, rgba(242,180,90,0) 72%)')} />
              <p className="bin" style={sx(H1 + '; position: absolute; font-size: 24px')}>Inhala</p>
              <p className="bout" style={sx(H1 + '; position: absolute; font-size: 24px')}>Exhala</p>
            </div>
            <button type="button" onClick={() => update({ breathing: false })} style={sx('min-width: 160px; height: 50px; border-radius: 25px; border: 1px solid rgba(245,239,228,0.25); background: transparent; color: #F5EFE4; font-size: 15px; cursor: pointer; font-family: inherit')}>Listo</button>
          </div>
        )}

        {st.supOpen && <SupportSheet onClose={() => update({ supOpen: false })} />}

        {st.toast && <div role="status" style={sx('position: absolute; left: 20px; right: 20px; bottom: 120px; z-index: 10; padding: 12px 16px; border-radius: 16px; background: rgba(46,39,56,0.97); border: 1px solid rgba(245,239,228,0.12); color: #F5EFE4; font-size: 14px; line-height: 1.45; text-align: center; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.6)')}>{st.toast}</div>}

        {TEST && ph !== 'intro' && (
          <button type="button" aria-label="Reiniciar prototipo" title="Reiniciar prototipo" onClick={reset} style={sx('position: absolute; left: 8px; top: 6px; z-index: 8; width: 40px; height: 40px; border-radius: 22px; border: none; background: transparent; color: rgba(245,239,228,0.45); display: flex; align-items: center; justify-content: center; cursor: pointer')}>
            <Icon name="restart-linear" size={18} />
          </button>
        )}
        {demo && !mobile && <span style={sx('position: absolute; right: 14px; top: 12px; z-index: 8; padding: 3px 8px; border-radius: 10px; background: rgba(201,182,228,0.16); color: #E9DCFA; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; pointer-events: none')}>Prueba</span>}
        {mobile && TEST && (
          <button type="button" onClick={() => setSheetOpen(true)} aria-haspopup="dialog" aria-label="Pantallas de prueba" style={sx('position: absolute; left: 50%; margin-left: -22px; top: 6px; z-index: 8; width: 44px; height: 32px; border-radius: 16px; border: none; background: rgba(245,239,228,0.07); color: rgba(245,239,228,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer')}>
            <Icon name="hamburger-menu-linear" size={16} />
          </button>
        )}
      </div>
    </AppCtx.Provider>
  );

  if (mobile) {
    return (
      <div className="page-mobile">
        <div style={{ width: W * k, height: H * k }}>{stage}</div>
        {sheetOpen && (
          <>
            <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
            <div className="sheet" role="dialog" aria-label="Pantallas del prototipo">
              <div style={sx('display: flex; justify-content: flex-end')}><button type="button" onClick={() => setSheetOpen(false)} style={sx('height: 36px; padding: 0 14px; border-radius: 18px; border: 1px solid #D6D0C8; background: transparent; color: #2B2430; font-size: 13px; font-weight: 600; cursor: pointer')}>Cerrar</button></div>
              {testTools}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page-desktop">
      <div style={{ width: W * k, height: H * k, flexShrink: 0, borderRadius: 44 * k, boxShadow: '0 30px 80px -30px rgba(43,36,48,0.55)' }}>{stage}</div>
      <div className="testbar">
        {TEST ? testTools : (
          <>
            <p className="testbar-title">Vela · High Low High</p>
            <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #6B5F57')}>Abre esta página en tu móvil y añádela a la pantalla de inicio para usar Vela como una app.</p>
            <div className="testbar-links"><a href="/?prueba=1">Modo prueba</a><a href="/?noches=14">Ver con 14 noches</a><a href="/?modo=recurrente">Notificación</a></div>
          </>
        )}
      </div>
    </div>
  );
}

// Eigenes Eingabefeld, damit Tippen nicht die ganze App neu rendert.
function TypingBox({ label, accent, initial, onDone, onSpeak, onDontKnow }: { label: string; accent: string; initial: string; onDone: (t: string) => void; onSpeak?: () => void; onDontKnow?: () => void }) {
  const [text, setText] = useState(initial);
  const has = !!text.trim();
  return (
    <>
      <textarea aria-label={label} placeholder="Escribe sin más …" value={text} autoFocus onChange={(e) => setText(e.target.value)}
        style={sx("width: 100%; height: 100px; padding: 16px 18px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.16); background: rgba(40,33,48,0.88); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; line-height: 1.55; resize: none")} />
      <button type="button" onClick={() => onDone(text)} disabled={!has} style={sx(`height: 48px; min-width: 180px; padding: 0 32px; border-radius: 24px; border: 1px solid ${has ? accent : 'rgba(245,239,228,0.25)'}; background: ${has ? accent : 'transparent'}; color: ${has ? '#2B2430' : '#F5EFE4'}; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .8s ease, color .8s ease, border-color .8s ease`)}>Listo</button>
      {(onSpeak || onDontKnow) && (
        <div style={sx('display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap')}>
          {onSpeak && <button type="button" onClick={onSpeak} style={sx(LINK_BTN)}>Prefiero hablar</button>}
          {onSpeak && onDontKnow && <span aria-hidden="true" style={sx('color: rgba(205,191,174,0.5)')}>·</span>}
          {onDontKnow && <button type="button" onClick={onDontKnow} style={sx('min-height: 44px; padding: 0 12px; border: none; background: transparent; color: #CDBFAE; font-size: 15px; cursor: pointer; font-family: inherit')}>No lo sé</button>}
        </div>
      )}
    </>
  );
}
