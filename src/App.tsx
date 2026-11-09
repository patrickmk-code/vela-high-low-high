import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Candle, type CandleCfg } from './Candle';
import { Icon } from './Icon';
import { sx } from './sx';
import { useLayout } from './useLayout';
import { COOL, F, GOLD, IN, JUMPS_FIRST, JUMPS_RECURRING, SPOTIFY_URL, SUGG, isInputPhase, type InputPhase, type Phase } from './data';
import { addDays, cap, clockLabel, inDays, keyOf, longLabel, monthName, monthShort, parseKey, relLabel, todayKey } from './lib/dates';
import {
  clearData, completedCount, emptyData, emptyDay, entriesForAnalysis, hasContent, loadData, patternSignature, saveData, uid, withSampleData,
  type AppData, type DayEntry, type Moment, type PatternItem, type Via,
} from './lib/store';
import { clearAudio, deleteAudio, playAudio, saveAudio, stopAudio } from './lib/audio';
import { VoiceCapture, sttSupported, voiceSupported, type VoiceError } from './lib/speech';
import { analyzePatterns, mirror as mirrorAI } from './lib/ai';
import { addReminderToCalendar, downloadFile } from './lib/reminder';

// ---------- Einstellungen über die URL ----------
const params = new URLSearchParams(window.location.search);
const RECURRING_DEMO = params.get('modo') === 'recurrente';
const TEST = params.has('prueba') || RECURRING_DEMO;
const URL_BREATH = (() => {
  const n = Number(params.get('respira'));
  return Number.isFinite(n) && n >= 1 && n <= 30 ? n : null;
})();
const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const IS_STANDALONE = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

type DayKey = 'high1' | 'low' | 'high2';
type PatView = null | 'src' | 'drain' | 'more';

interface Answer {
  text: string;
  via: Via;
  audioId?: string;
  seconds?: number;
}

interface UI {
  phase: Phase;
  prog: number;
  typing: boolean;
  rec: boolean;
  recSec: number;
  liveText: string;
  breathing: boolean;
  relight: boolean;
  answers: Record<InputPhase, Answer | null>;
  mirrorText: Partial<Record<InputPhase, string>>;
  mirrored: Record<InputPhase, boolean>;
  reflecting: InputPhase | null;
  askHelp: boolean;
  notice: string | null;
  adding: DayKey | null;
  draft: string;
  dayOpen: boolean;
  revTab: 'cal' | 'pat';
  selDay: string;
  calMonth: [number, number];
  patView: PatView;
  patItem: number | null;
  patState: 'idle' | 'loading' | 'error';
  playing: string | null;
  upOpen: boolean;
  upTitle: string;
  upDate: string;
  confirmDelete: boolean;
  toast: string | null;
}

const NO_ANSWERS = { high1: null, low: null, ask: null, high2: null };
const NO_MIRRORED = { high1: false, low: false, ask: false, high2: false };

function initialPhase(d: AppData): Phase {
  if (RECURRING_DEMO) return 'lock';
  return d.settings.onboarded ? 'home' : 'intro';
}

function blankUI(d: AppData): UI {
  const t = todayKey();
  const td = parseKey(t);
  return {
    phase: initialPhase(d), prog: 0, typing: false, rec: false, recSec: 0, liveText: '', breathing: false, relight: false,
    answers: { ...NO_ANSWERS }, mirrorText: {}, mirrored: { ...NO_MIRRORED }, reflecting: null, askHelp: false, notice: null,
    adding: null, draft: '', dayOpen: false,
    revTab: 'cal', selDay: t, calMonth: [td.getFullYear(), td.getMonth()], patView: null, patItem: null, patState: 'idle',
    playing: null, upOpen: false, upTitle: '', upDate: addDays(t, 1), confirmDelete: false, toast: null,
  };
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
const r2 = (n: number) => Math.round(n * 100) / 100;
const vibrate = (ms: number | number[]) => {
  try { navigator.vibrate?.(ms); } catch { /* nicht unterstützt */ }
};
const momentLabel = (m: Moment) => m.text || (m.audioId ? 'Nota de voz' : '');

const VOICE_MSG: Record<VoiceError, string> = {
  'sin-permiso': 'Vela no tiene permiso para usar el micrófono. Puedes activarlo en los ajustes del navegador, o escribir.',
  'sin-micro': 'No encuentro un micrófono. Puedes escribirlo.',
  'no-soportado': 'Este navegador no permite hablar con Vela. Puedes escribirlo.',
};

// Wiederkehrende Stilbausteine
const H1 = "margin: 0; font-family: 'Fraunces', serif; font-weight: 300";
const BACK_BTN = 'width: 44px; height: 44px; border-radius: 22px; border: none; background: rgba(245,239,228,0.07); color: #CDBFAE; display: flex; align-items: center; justify-content: center; cursor: pointer';
const LINK_BTN = 'min-height: 44px; padding: 0 16px; border: none; background: transparent; color: #E6DACB; font-size: 15px; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgba(230,218,203,0.4); cursor: pointer';
const PRIMARY = 'width: 100%; height: 52px; border-radius: 26px; border: none; background: #F2B45A; color: #2B2430; font-size: 16px; font-weight: 700; cursor: pointer';
const GHOST = 'height: 44px; padding: 0 18px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.2); background: transparent; color: #E6DACB; font-size: 14px; cursor: pointer';
const OPTION = 'width: 240px; height: 50px; border: none; border-bottom: 1px solid rgba(245,239,228,0.08); background: transparent; color: #E6DACB; font-size: 16px; letter-spacing: 0.01em; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-decoration: none';
const EYEBROW = 'margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #CDBFAE';
const SECTION = 'margin: 4px 0 0; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE';
const CARD = 'padding: 18px; border-radius: 22px; background: rgba(245,239,228,0.05); display: flex; flex-direction: column; gap: 12px; flex-shrink: 0';
const INPUT = "height: 44px; padding: 0 14px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.2); background: rgba(245,239,228,0.05); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; min-width: 0";
const ITALIC = "margin: 0; font-family: 'Fraunces', serif; font-style: italic; font-weight: 300";

export default function App() {
  const layout = useLayout();
  const [data, setData] = useState<AppData>(loadData);
  const [st, setSt] = useState<UI>(() => blankUI(data));
  const [sheetOpen, setSheetOpen] = useState(false);

  const stRef = useRef(st);
  stRef.current = st;
  const dataRef = useRef(data);
  dataRef.current = data;
  const timers = useRef<number[]>([]);
  const recTimer = useRef<number | null>(null);
  const lightTimer = useRef<number | null>(null);
  const holding = useRef(false);
  const progRef = useRef(0);
  const lastTick = useRef(0);
  const voice = useRef<VoiceCapture | null>(null);
  const committed = useRef<Record<InputPhase, string | null>>({ ...NO_ANSWERS });
  const firstSave = useRef(true);

  const update = useCallback((p: Partial<UI> | ((s: UI) => Partial<UI>)) => {
    setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  }, []);

  // ---------- Speichern ----------
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    if (!saveData(data)) update({ toast: 'No se pudo guardar en este dispositivo.' });
  }, [data, update]);

  useEffect(() => {
    if (!st.toast) return;
    const t = window.setTimeout(() => update({ toast: null }), 3200);
    return () => clearTimeout(t);
  }, [st.toast, update]);

  const breathSeconds = URL_BREATH ?? data.settings.breathSeconds;
  const today = todayKey();
  const todayEntry: DayEntry | undefined = data.days[today];

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearRecTimer = () => { if (recTimer.current != null) { clearInterval(recTimer.current); recTimer.current = null; } };
  const cancelVoice = () => { voice.current?.cancel(); voice.current = null; clearRecTimer(); };
  const clearAll = () => {
    cancelVoice();
    stopAudio();
    if (lightTimer.current != null) { clearInterval(lightTimer.current); lightTimer.current = null; }
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    holding.current = false;
    progRef.current = 0;
  };

  useEffect(() => () => clearAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (ph: Phase) => {
    cancelVoice();
    stopAudio();
    const typingDefault = isInputPhase(ph) && dataRef.current.settings.prefer === 'texto' && !stRef.current.mirrored[ph];
    update({ phase: ph, rec: false, liveText: '', typing: typingDefault, askHelp: false, dayOpen: false, patView: null, patItem: null, notice: null, adding: null, playing: null, upOpen: false, confirmDelete: false });
  };

  // ---------- Daten schreiben ----------
  const updateDay = (date: string, fn: (e: DayEntry) => DayEntry) => {
    setData((d) => {
      const e = d.days[date] ?? emptyDay(date);
      return { ...d, days: { ...d.days, [date]: { ...fn(e), updatedAt: Date.now() } } };
    });
  };
  const setSettings = (patch: Partial<AppData['settings']>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const commitAnswer = (k: InputPhase, a: Answer, mirrorText: string) => {
    const id = committed.current[k] ?? uid();
    committed.current[k] = id;
    const m: Moment = { id, text: a.text, via: a.via, ...(a.audioId ? { audioId: a.audioId } : {}) };
    updateDay(todayKey(), (e) => {
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
    const gone = dataRef.current.days[todayKey()]?.[k].find((x) => x.id === id);
    if (gone?.audioId) deleteAudio(gone.audioId);
    updateDay(todayKey(), (e) => {
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
    const wait = Math.max(0, 1400 - (Date.now() - started));
    later(() => {
      commitAnswer(k, a, res.text);
      update((x) => ({
        mirrorText: { ...x.mirrorText, [k]: res.text },
        mirrored: { ...x.mirrored, [k]: true },
        reflecting: x.reflecting === k ? null : x.reflecting,
      }));
    }, wait);
  };

  // ---------- Anzünden: Docht halten, ein Atemzug ----------
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
        update({ prog: 1, phase: 'lit', answers: { ...NO_ANSWERS }, mirrorText: {}, mirrored: { ...NO_MIRRORED }, relight: false });
        vibrate(40);
        later(() => { progRef.current = 0; update({ prog: 0 }); go('high1'); }, 1700);
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
    if (homeDone(s) || (s.phase !== 'home' && s.phase !== 'lighting')) return;
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
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!holding.current) holdDown(); }
  };
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
    if (!text && !res.audio) {
      update({ reflecting: null, liveText: '', notice: 'No te he oído bien. ¿Lo intentas otra vez o prefieres escribir?' });
      return;
    }
    let audioId: string | undefined;
    if (res.audio) {
      const id = uid();
      if (await saveAudio(id, res.audio)) audioId = id;
    }
    if (!text && !sttSupported()) {
      update({ toast: 'Tu voz se ha guardado. Este navegador no transcribe; puedes añadir unas palabras en «Tu día».' });
    }
    update({ liveText: '' });
    reflect(k, { text, via: 'voz', audioId, seconds: res.seconds });
  };

  const toggleRec = async () => {
    const s = stRef.current;
    if (s.rec) { stopRecording(); return; }
    if (!isInputPhase(s.phase)) return;
    stopAudio();
    const capture = new VoiceCapture(
      {
        onTranscript: (t) => update({ liveText: t }),
        onError: (e) => { cancelVoice(); update({ rec: false, typing: true, notice: VOICE_MSG[e] }); },
      },
      () => { if (stRef.current.rec) stopRecording(); },
    );
    voice.current = capture;
    update({ rec: true, recSec: 0, typing: false, liveText: '', notice: null });
    clearRecTimer();
    recTimer.current = window.setInterval(() => update((x) => ({ recSec: x.recSec + 1 })), 1000);
    const ok = await capture.start();
    if (!ok && voice.current === capture) { voice.current = null; clearRecTimer(); update({ rec: false }); }
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
    if (key && t) updateDay(todayKey(), (e) => ({ ...e, [key]: [...e[key], { id: uid(), text: t, via: 'texto' as Via }] }));
    update({ adding: null, draft: '' });
  };
  const play = async (audioId: string) => {
    if (stRef.current.playing === audioId) { stopAudio(); update({ playing: null }); return; }
    update({ playing: audioId });
    const ok = await playAudio(audioId, () => update({ playing: null }));
    if (!ok) update({ playing: null, toast: 'Esta grabación ya no está en el dispositivo.' });
  };
  const jump = (ph: Phase) => {
    clearAll();
    setSheetOpen(false);
    update({ prog: 0, reflecting: null, breathing: false, relight: false });
    go(ph);
  };
  const reset = () => { clearAll(); committed.current = { ...NO_ANSWERS }; setSt(blankUI(dataRef.current)); };
  const blowOut = () => {
    go('sleep');
    vibrate([20, 60, 30]);
    later(() => { update({ relight: false }); go('home'); }, 4200);
  };
  const finishDay = () => {
    updateDay(todayKey(), (e) => ({ ...e, done: true }));
    go(dataRef.current.settings.remindAsked ? 'now' : 'remind');
  };
  const exportData = () => {
    downloadFile(`vela-${todayKey()}.json`, JSON.stringify(dataRef.current, null, 2), 'application/json');
  };
  const deleteAll = async () => {
    clearAll();
    clearData();
    await clearAudio();
    const fresh = emptyData();
    committed.current = { ...NO_ANSWERS };
    setData(fresh);
    setSt(blankUI(fresh));
  };

  // ---------- Muster laden ----------
  const doneCount = completedCount(data);
  const sig = patternSignature(data);
  const patterns = data.patterns?.result ?? null;
  const patternsFresh = !!data.patterns && data.patterns.signature === sig;
  useEffect(() => {
    if (st.phase !== 'review' || st.revTab !== 'pat' || doneCount < 7 || patternsFresh || st.patState !== 'idle') return;
    update({ patState: 'loading' });
    analyzePatterns(entriesForAnalysis(dataRef.current)).then((r) => {
      if (r.ok) {
        setData((d) => ({ ...d, patterns: { signature: patternSignature(d), result: r.patterns, at: Date.now() } }));
        update({ patState: 'idle' });
      } else {
        update({ patState: 'error' });
      }
    });
  }, [st.phase, st.revTab, doneCount, patternsFresh, st.patState, update]);

  // ---------- Abgeleitete Werte (Kerze, Licht) ----------
  const ph = st.phase;
  const prog = st.prog;
  const inputPh: InputPhase | null = isInputPhase(ph) ? ph : null;
  const isHome = ph === 'home';
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
  const cfg: CandleCfg = {
    scale: r2(scale), fop: scale > 0.02 ? 1 : 0, halo: r2(halo),
    warmHalo: r2(warmHalo * (1 - cool)), coolHalo: cool ? 1 : 0,
    warmF: 1, goldF: 0, coolF: 0, ember: r2(ember), lightA: r2(lightA),
  };
  const warmBg = r2(Math.min(1, scale));
  const bg = ph === 'stay' || ph === 'sleep' || isDone ? '#211B26' : '#2B2430';

  const early = ph === 'intro' || (isHome && !isDone) || ph === 'lighting' || ph === 'lit';
  const bigPh = ph === 'stay' || ph === 'journal' || ph === 'blow' || ph === 'sleep';
  const CT: [number, number] = early ? [150, 0.75] : bigPh ? [200, 1.3] : ph === 'now' ? [318, 1] : ph === 'mirror' || isDone ? [360, 0.55] : [280, 0.6];
  const glowY = early ? 41 : bigPh ? 62 : ph === 'now' ? 68 : ph === 'mirror' || isDone ? 58 : 51;
  const showCandle = ph !== 'review' && ph !== 'highs' && ph !== 'lock' && ph !== 'settings';
  const showNav = isHome || ph === 'review' || ph === 'highs';
  const tabPh = ph === 'review' || ph === 'highs' ? ph : 'home';
  const dotIdx = inputPh ? IN[inputPh].dot : -1;

  const { mobile, s: k, W, H, v } = layout;
  const T = (n: number) => Math.round(n * v);
  const colLeft = (W - 390) / 2;
  const glowPx = Math.round((glowY / 100) * 844 * v);

  // ---------- Heute-Abschnitte ----------
  const sections = (e: DayEntry | undefined) => (['high1', 'low', 'high2'] as DayKey[]).map((key) => {
    const low = key === 'low';
    const items: Moment[] = e ? [...e[key]] : [];
    const extra: Moment[] = low && e ? e.ask.map((m) => ({ ...m, text: m.text ? 'Te habría ayudado: ' + m.text : '' })) : [];
    return {
      key, low, label: low ? 'Low' : 'High', fill: low ? 'transparent' : GOLD, ring: low ? '#CDBFAE' : GOLD, glow: low ? 0 : 8,
      items: [...items, ...extra].filter((m) => momentLabel(m)),
    };
  });
  const todaySections = sections(todayEntry);
  const itemCount = todaySections.reduce((n, s) => n + s.items.length, 0);

  const playBtn = (id: string, size = 30) => (
    <button
      type="button"
      aria-label={st.playing === id ? 'Pausar' : 'Escuchar tu voz'}
      onClick={(e) => { e.stopPropagation(); play(id); }}
      style={sx(`width: ${size}px; height: ${size}px; border-radius: ${size / 2}px; border: 1.5px solid rgba(245,239,228,0.4); background: transparent; color: #F5EFE4; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0`)}
    >
      <Icon name={st.playing === id ? 'pause-bold' : 'play-bold'} size={Math.round(size * 0.42)} />
    </button>
  );

  // ---------- Erzähl-Screens ----------
  const renderInput = () => {
    if (!inputPh) return null;
    const d = IN[inputPh];
    const accent = coolBg ? COOL : GOLD;
    const answer = st.answers[inputPh];
    const mirrored = st.mirrored[inputPh];
    const refl = st.reflecting === inputPh;
    const help = inputPh === 'ask' && st.askHelp && !mirrored && !refl;
    const idle = !st.rec && !st.typing && !refl && !mirrored && !help;
    const showMic = idle || st.rec;
    const showTyping = st.typing && !mirrored && !refl;
    const showMirror = mirrored && !refl;
    const canVoice = voiceSupported();
    return (
      <>
        <div style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
          {d.eb && <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{d.eb}</p>}
          <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>{d.t}</h1>
          <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>{d.s}</p>
        </div>
        <div style={sx('position: absolute; left: 28px; right: 28px; bottom: 40px; display: flex; flex-direction: column; align-items: center; gap: 18px')}>
          {st.notice && (idle || showTyping) && (
            <p role="status" style={sx('margin: 0; padding: 10px 14px; border-radius: 16px; background: rgba(245,239,228,0.07); font-size: 13px; line-height: 1.45; color: #E6DACB; text-align: center')}>{st.notice}</p>
          )}
          {showMic && canVoice && (
            <>
              <div style={sx('position: relative; width: 92px; height: 92px')}>
                {st.rec && <span className="recbreath" style={sx(`position: absolute; left: -22px; top: -22px; width: 136px; height: 136px; border-radius: 50%; background: radial-gradient(circle, ${coolBg ? 'rgba(159,180,200,0.35)' : 'rgba(242,180,90,0.35)'} 0%, rgba(43,36,48,0) 70%)`)} />}
                <button
                  type="button"
                  aria-label={st.rec ? 'Detener grabación' : 'Iniciar grabación'}
                  aria-pressed={st.rec}
                  onClick={toggleRec}
                  style={sx(`position: relative; width: 92px; height: 92px; border-radius: 46px; border: 1.5px solid ${accent}; background: ${st.rec ? accent : coolBg ? 'rgba(159,180,200,0.12)' : 'rgba(242,180,90,0.12)'}; color: ${st.rec ? '#2B2430' : accent}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .8s ease, color .8s ease`)}
                >
                  {st.rec ? <span style={sx('width: 20px; height: 20px; border-radius: 5px; background: #2B2430')} /> : <Icon name="microphone-3-linear" size={32} />}
                </button>
              </div>
              <p role={st.rec ? 'status' : undefined} style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>
                {st.rec ? `Te escucho … ${Math.floor(st.recSec / 60)}:${pad(st.recSec % 60)}` : 'Toca y cuéntamelo'}
              </p>
              {st.rec ? (
                <p data-testid="transcripcion" aria-live="polite" style={sx(`${ITALIC}; min-height: 44px; max-height: 44px; overflow: hidden; font-size: 15px; line-height: 1.45; color: #E6DACB; text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical`)}>
                  {st.liveText ? '… ' + st.liveText.split(' ').slice(-14).join(' ') : ''}
                </p>
              ) : (
                <div style={sx('display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap')}>
                  <button type="button" onClick={() => { cancelVoice(); update({ typing: true, notice: null }); }} style={sx(LINK_BTN)}>Prefiero escribir</button>
                  {inputPh === 'ask' && (
                    <>
                      <span aria-hidden="true" style={sx('color: rgba(205,191,174,0.5)')}>·</span>
                      <button type="button" onClick={() => { cancelVoice(); update({ askHelp: true, typing: false, notice: null }); }} style={sx('min-height: 44px; padding: 0 12px; border: none; background: transparent; color: #CDBFAE; font-size: 15px; cursor: pointer')}>No lo sé</button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {idle && !canVoice && (
            <>
              <button type="button" onClick={() => update({ typing: true })} style={sx(PRIMARY)}>Escribirlo</button>
              {inputPh === 'ask' && <button type="button" onClick={() => update({ askHelp: true })} style={sx(LINK_BTN)}>No lo sé</button>}
            </>
          )}
          {help && (
            <>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #E6DACB; text-align: center')}>Está bien no saberlo. Quizás algo de esto:</p>
              <div style={sx('display: flex; flex-wrap: wrap; gap: 8px; justify-content: center')}>
                {SUGG.map((lab) => (
                  <button key={lab} type="button" onClick={() => reflect('ask', { text: lab, via: 'sugerencia' })} style={sx('height: 42px; padding: 0 18px; border-radius: 21px; border: 1px solid rgba(245,239,228,0.22); background: rgba(245,239,228,0.05); color: #F5EFE4; font-size: 14px; cursor: pointer')}>{lab}</button>
                ))}
              </div>
              <button type="button" onClick={() => d.skipTo && go(d.skipTo)} style={sx(LINK_BTN + '; color: #CDBFAE; text-decoration-color: rgba(205,191,174,0.4)')}>Seguir sin respuesta</button>
            </>
          )}
          {showTyping && <TypingBox key={inputPh} label={d.t} accent={accent} initial={answer?.via === 'texto' ? answer.text : ''} onDone={doneTyping} onSpeak={canVoice ? () => update({ typing: false, notice: null }) : undefined} />}
          {refl && (
            <>
              <div aria-hidden="true" style={sx('height: 40px; display: flex; gap: 8px; align-items: center')}><span className="thinkdot" /><span className="thinkdot" /><span className="thinkdot" /></div>
              <p role="status" style={sx('margin: 0 0 60px; font-size: 14px; color: #CDBFAE')}>Un momento …</p>
            </>
          )}
          {showMirror && (
            <>
              <div style={sx(`width: 100%; padding: 18px 20px; border-radius: 22px; border: 1px solid ${coolBg ? 'rgba(159,180,200,0.32)' : 'rgba(242,180,90,0.32)'}; background: rgba(245,239,228,0.05); display: flex; flex-direction: column; gap: 8px`)}>
                <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 10px')}>
                  <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #CDBFAE')}>Lo que escuché</p>
                  {answer?.audioId && playBtn(answer.audioId, 28)}
                </div>
                <p data-testid="mirror-text" style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 19px; line-height: 1.45; color: #F5EFE4")}>{st.mirrorText[inputPh]}</p>
              </div>
              <div style={sx('display: flex; gap: 16px; justify-content: center; align-items: center')}>
                <button
                  type="button"
                  onClick={() => { stopAudio(); uncommit(inputPh); update((s) => ({ answers: { ...s.answers, [inputPh]: null }, mirrored: { ...s.mirrored, [inputPh]: false }, typing: dataRef.current.settings.prefer === 'texto', askHelp: false, playing: null })); }}
                  style={sx('min-height: 48px; padding: 0 14px; border: none; background: transparent; color: #E6DACB; font-size: 15px; cursor: pointer')}
                >Repetir</button>
                <button type="button" onClick={() => go(d.next)} style={sx(`height: 48px; min-width: 160px; padding: 0 32px; border-radius: 24px; border: 1px solid ${accent}; background: ${accent}; color: #2B2430; font-size: 15px; font-weight: 700; cursor: pointer`)}>Seguir</button>
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
      <div style={sx(`position: absolute; left: 24px; right: 24px; top: 96px; max-height: ${st.dayOpen ? Math.min(580, H - 220) : Math.min(300, H - 400)}px; overflow-y: auto; padding: 22px 22px 0 20px; border-radius: 26px; background: ${st.dayOpen ? 'rgba(47,40,52,0.97)' : 'linear-gradient(160deg, rgba(245,239,228,0.09) 0%, rgba(245,239,228,0.03) 100%)'}; transition: max-height .7s ease, background .7s ease; border: 1px solid rgba(245,239,228,0.1); box-shadow: 0 24px 50px -24px rgba(0,0,0,0.6); z-index: 1; -webkit-overflow-scrolling: touch`)}>
        <div style={sx('display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 14px')}>
          <h1 style={sx(H1 + '; font-size: 26px; line-height: 1')}>Tu día</h1>
          <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.04em; color: #CDBFAE')}>{cap(longLabel(today))}</p>
        </div>
        <div style={sx('position: relative; display: flex; flex-direction: column; gap: 18px; padding-left: 26px')}>
          <span aria-hidden="true" style={sx('position: absolute; left: 5px; top: 8px; bottom: 8px; width: 1px; background: linear-gradient(180deg, rgba(242,180,90,0.6), rgba(205,191,174,0.25) 50%, rgba(242,180,90,0.6))')} />
          {todaySections.map((sec) => (
            <div key={sec.key} data-testid={'dia-' + sec.key} style={sx('position: relative; display: flex; flex-direction: column; gap: 6px')}>
              <span aria-hidden="true" style={sx(`position: absolute; left: -26px; top: 6px; width: 11px; height: 11px; border-radius: 6px; background: ${sec.fill}; border: 1.5px solid ${sec.ring}; box-shadow: 0 0 ${sec.glow}px rgba(242,180,90,0.55)`)} />
              <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
                <p style={sx(EYEBROW)}>{sec.label}</p>
                <button type="button" aria-label={'Añadir ' + sec.label} onClick={() => update({ adding: sec.key, draft: '' })} style={sx('height: 28px; padding: 0 12px; border-radius: 14px; border: 1px solid rgba(245,239,228,0.14); background: transparent; color: #CDBFAE; font-size: 12px; cursor: pointer')}>+ Añadir</button>
              </div>
              {sec.items.length === 0 && st.adding !== sec.key && (
                <p style={sx(ITALIC + '; font-size: 15px; color: rgba(205,191,174,0.6)')}>{sec.low ? 'Hoy no lo nombraste. Está bien así.' : 'Aún nada.'}</p>
              )}
              {sec.items.map((m) => (
                <div key={m.id + m.text} style={sx('display: flex; gap: 8px; align-items: flex-start')}>
                  <span aria-hidden="true" style={sx(`margin-top: 11px; width: 6px; height: 1px; flex-shrink: 0; background: #CDBFAE; opacity: ${sec.items.length > 1 ? 1 : 0}`)} />
                  <p style={sx(ITALIC + '; font-size: 17px; line-height: 1.4; color: #F5EFE4; flex-grow: 1')}>{momentLabel(m)}</p>
                  {m.audioId && playBtn(m.audioId, 28)}
                </div>
              ))}
              {st.adding === sec.key && (
                <div style={sx('display: flex; gap: 8px; align-items: center; margin-top: 2px')}>
                  <input
                    type="text"
                    aria-label={'Añadir ' + sec.label}
                    placeholder="Algo más …"
                    value={st.draft}
                    autoFocus
                    enterKeyHint="done"
                    onChange={(e) => update({ draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitAdd(); }
                      if (e.key === 'Escape') update({ adding: null, draft: '' });
                    }}
                    style={sx(INPUT + '; flex-grow: 1; height: 40px; border-radius: 20px')}
                  />
                  <button type="button" onClick={commitAdd} style={sx('height: 40px; padding: 0 16px; border-radius: 20px; border: none; background: #F2B45A; color: #2B2430; font-size: 13px; font-weight: 700; cursor: pointer')}>OK</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={sx(`position: sticky; bottom: 0; margin: 0 -22px 0 -20px; padding: 26px 0 14px; display: flex; justify-content: center; background: linear-gradient(180deg, rgba(47,40,52,0) 0%, ${st.dayOpen ? 'rgba(47,40,52,1)' : 'rgba(47,40,52,0.92)'} 55%)`)}>
          {(itemCount > 3 || st.dayOpen) && (
            <button type="button" aria-expanded={st.dayOpen} onClick={() => update((s) => ({ dayOpen: !s.dayOpen }))} style={sx('height: 34px; padding: 0 16px; border-radius: 17px; border: 1px solid rgba(245,239,228,0.16); background: rgba(43,36,48,0.6); color: #E6DACB; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer')}>
              {st.dayOpen ? 'Ver menos' : 'Ver todo'}
              <Icon name="alt-arrow-down-linear" size={14} style={{ transform: `rotate(${st.dayOpen ? 180 : 0}deg)`, transition: 'transform .4s' }} />
            </button>
          )}
        </div>
      </div>
      <div style={sx('position: absolute; left: 28px; right: 28px; bottom: 28px; display: flex; flex-direction: column; gap: 14px')}>
        <button type="button" onClick={() => update({ breathing: true })} style={sx('width: 100%; height: 50px; border-radius: 25px; border: 1px solid rgba(245,239,228,0.25); background: transparent; color: #F5EFE4; font-size: 15px; cursor: pointer')}>Respirar un momento</button>
        <button type="button" onClick={finishDay} style={sx(PRIMARY)}>Seguir</button>
      </div>
    </>
  );

  // ---------- Resumen ----------
  const renderReview = () => {
    const [cy, cm] = st.calMonth;
    const first = new Date(cy, cm, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cy, cm + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let n = 1; n <= daysInMonth; n++) cells.push(keyOf(new Date(cy, cm, n)));
    const tdate = parseKey(today);
    const isCurrentMonth = cy === tdate.getFullYear() && cm === tdate.getMonth();
    const moveMonth = (delta: number) => {
      const d = new Date(cy, cm + delta, 1);
      const sel = keyOf(d.getFullYear() === tdate.getFullYear() && d.getMonth() === tdate.getMonth() ? tdate : d);
      update({ calMonth: [d.getFullYear(), d.getMonth()], selDay: sel });
    };
    const selEntry = data.days[st.selDay];
    const selSpecial = !!data.special[st.selDay];
    const selFuture = st.selDay > today;
    const selSecs = sections(selEntry).filter((s) => s.items.length);

    const CHEV = <span style={sx('color: #9C8F86; display: flex')}><Icon name="alt-arrow-right-linear" size={18} /></span>;
    const audioFor = (quote: string) => {
      const t = quote.split(' · ')[0].replace(/[«»"]/g, '').trim().toLowerCase();
      for (const e of Object.values(data.days)) for (const m of [...e.high1, ...e.high2]) if (m.audioId && m.text.trim().toLowerCase() === t) return m.audioId;
      return undefined;
    };

    let pv: { backLabel: string; title: string; intro: string; list: { n: string; f: string; i: number }[]; item?: PatternItem; isSrc?: boolean } = { backLabel: 'Patrones', title: '', intro: '', list: [] };
    if (patterns && (st.patView === 'src' || st.patView === 'drain')) {
      const isSrc = st.patView === 'src';
      const arr = isSrc ? patterns.sources : patterns.drains;
      if (st.patItem == null) {
        pv = { ...pv, title: isSrc ? 'Tus fuentes de energía' : 'Lo que te quita energía', intro: isSrc ? 'Lo que vuelve una y otra vez en tus highs.' : 'Patrones en tus lows: qué te pesa y cuándo.', list: arr.map((it, i) => ({ n: it.name, f: it.frequency, i })) };
      } else if (arr[st.patItem]) {
        const it = arr[st.patItem];
        pv = { ...pv, backLabel: isSrc ? 'Fuentes de energía' : 'Lo que te quita energía', title: it.name, intro: it.description, item: it, isSrc };
      }
    }
    if (st.patView === 'more') pv = { ...pv, title: 'Ideas para ti', intro: 'Salen de lo que te da y te quita energía. Sin presión: quédate solo con lo que te encaje.' };
    const teaser = (arr: PatternItem[]) => {
      const names = arr.map((x) => x.name.toLowerCase());
      if (!names.length) return 'Aún no hay nada claro';
      const head = names.slice(0, 2).join(', ');
      return cap(head) + (names.length > 2 ? ` y ${names.length - 2} más` : '');
    };
    const ideas = patterns ? patterns.ideas.filter((t) => !data.ideas.hidden[t]) : [];

    return (
      <div style={sx('position: absolute; left: 20px; right: 20px; top: 104px; bottom: 100px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; -webkit-overflow-scrolling: touch')}>
        <h1 style={sx(H1 + '; font-size: 30px')}>Resumen</h1>
        <div role="tablist" aria-label="Vista del resumen" style={sx('display: flex; padding: 4px; border-radius: 22px; background: rgba(245,239,228,0.06); flex-shrink: 0')}>
          {([['cal', 'Calendario'], ['pat', 'Patrones']] as const).map(([id, label]) => {
            const on = st.revTab === id;
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => update({ revTab: id, patView: null, patItem: null })} style={sx(`flex: 1; height: 38px; border-radius: 19px; border: none; background: ${on ? 'rgba(242,180,90,0.9)' : 'transparent'}; color: ${on ? '#2B2430' : '#E6DACB'}; font-size: 14px; font-weight: 700; cursor: pointer`)}>{label}</button>
            );
          })}
        </div>

        {st.revTab === 'cal' && (
          <>
            <div style={sx('padding: 16px 14px; border-radius: 22px; background: rgba(245,239,228,0.05); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0')}>
              <div style={sx('display: flex; justify-content: space-between; align-items: center')}>
                <button type="button" aria-label="Mes anterior" onClick={() => moveMonth(-1)} style={sx('width: 36px; height: 36px; border-radius: 18px; border: none; background: transparent; color: #CDBFAE; cursor: pointer; display: flex; align-items: center; justify-content: center')}><Icon name="alt-arrow-left-linear" size={18} /></button>
                <p data-testid="cal-mes" style={sx('margin: 0; font-size: 15px; font-weight: 700; color: #F5EFE4')}>{monthName(cm)} {cy}</p>
                <button type="button" aria-label="Mes siguiente" disabled={isCurrentMonth} onClick={() => moveMonth(1)} style={sx(`width: 36px; height: 36px; border-radius: 18px; border: none; background: transparent; color: #CDBFAE; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: ${isCurrentMonth ? 0.25 : 1}`)}><Icon name="alt-arrow-right-linear" size={18} /></button>
              </div>
              <div style={sx('display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px')}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((wd, i) => (
                  <p key={i} style={sx('margin: 0; text-align: center; font-size: 11px; font-weight: 700; color: #9C8F86')}>{wd}</p>
                ))}
                {cells.map((dk, i) => {
                  if (!dk) return <div key={'b' + i} />;
                  const n = parseKey(dk).getDate();
                  const sel = st.selDay === dk, isToday = dk === today, has = hasContent(data.days[dk]), future = dk > today;
                  return (
                    <div key={dk} style={sx('display: flex; justify-content: center')}>
                      <button
                        type="button"
                        aria-label={`${n} de ${monthName(cm)}${has ? ', con momentos' : ''}${data.special[dk] ? ', día especial' : ''}`}
                        aria-pressed={sel}
                        onClick={() => update({ selDay: dk })}
                        style={sx(`position: relative; width: 40px; height: 40px; border-radius: 20px; border: 1px solid ${isToday && !sel ? '#F2B45A' : 'transparent'}; background: ${sel ? '#F2B45A' : 'transparent'}; color: ${sel ? '#2B2430' : future ? '#7F736C' : '#F5EFE4'}; font-size: 14px; font-weight: ${isToday ? 800 : 500}; cursor: pointer; padding: 0`)}
                      >
                        {n}
                        <span aria-hidden="true" style={sx(`position: absolute; left: 50%; bottom: 4px; margin-left: -2px; width: 4px; height: 4px; border-radius: 2px; background: ${sel ? '#2B2430' : '#F2B45A'}; opacity: ${has ? 1 : 0}`)} />
                        {data.special[dk] && <span aria-hidden="true" style={sx('position: absolute; right: -3px; top: -4px; color: #F2B45A')}><Icon name="star-bold" size={11} /></span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div data-testid="dia-seleccionado" style={sx('padding: 18px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.1); background: rgba(245,239,228,0.04); display: flex; flex-direction: column; gap: 12px; flex-shrink: 0')}>
              <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
                <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 20px")}>{longLabel(st.selDay)}</p>
                {!selFuture && (
                  <button
                    type="button"
                    aria-pressed={selSpecial}
                    onClick={() => setData((d) => ({ ...d, special: { ...d.special, [st.selDay]: !d.special[st.selDay] } }))}
                    style={sx(`height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid ${selSpecial ? '#F2B45A' : 'rgba(245,239,228,0.2)'}; background: ${selSpecial ? 'rgba(242,180,90,0.18)' : 'transparent'}; color: ${selSpecial ? '#FBE0A0' : '#E6DACB'}; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; flex-shrink: 0`)}
                  >
                    <Icon name={selSpecial ? 'star-bold' : 'star-linear'} size={14} />
                    {selSpecial ? 'Día especial' : 'Marcar especial'}
                  </button>
                )}
              </div>
              {selSecs.length > 0 ? selSecs.map((sec) => (
                <div key={sec.key} style={sx('display: flex; gap: 12px; align-items: flex-start')}>
                  <span aria-hidden="true" style={sx(`margin-top: 5px; width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; background: ${sec.fill}; border: 1.5px solid ${sec.ring}`)} />
                  <div style={sx('display: flex; flex-direction: column; gap: 4px; flex-grow: 1; min-width: 0')}>
                    <p style={sx("margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE")}>{sec.label}</p>
                    {sec.items.map((m) => (
                      <div key={m.id + m.text} style={sx('display: flex; gap: 10px; align-items: center')}>
                        <p style={sx(ITALIC + '; font-size: 16px; line-height: 1.4; flex-grow: 1')}>{momentLabel(m)}</p>
                        {m.audioId && playBtn(m.audioId, 26)}
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>
                  {selFuture ? 'Este día aún no ha llegado.' : st.selDay === today ? 'Esta noche aún no has encendido la vela.' : 'Este día no encendiste la vela. Está bien así.'}
                </p>
              )}
            </div>
          </>
        )}

        {st.revTab === 'pat' && doneCount < 7 && (
          <div style={sx(CARD + '; border: 1px solid rgba(242,180,90,0.25)')}>
            <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #F2B45A')}>Primeras huellas</p>
            <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 20px; line-height: 1.4")}>Tus patrones van creciendo con cada noche.</p>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>
              {doneCount === 0 ? 'Aún no hay noches guardadas.' : doneCount === 1 ? 'Llevas una noche.' : `Llevas ${doneCount} noches.`} Hacia la séptima, Vela empieza a ver lo que se repite: qué te da energía y qué te la quita.
            </p>
            <div aria-hidden="true" style={sx('display: flex; gap: 6px')}>
              {Array.from({ length: 7 }, (_, i) => <span key={i} style={sx(`width: 10px; height: 10px; border-radius: 5px; border: 1.5px solid #F2B45A; background: ${i < doneCount ? '#F2B45A' : 'transparent'}`)} />)}
            </div>
          </div>
        )}

        {st.revTab === 'pat' && doneCount >= 7 && !patterns && st.patState === 'loading' && (
          <div style={sx(CARD + '; align-items: center; text-align: center; padding: 28px 18px')}>
            <div aria-hidden="true" style={sx('height: 24px; display: flex; gap: 8px; align-items: center')}><span className="thinkdot" /><span className="thinkdot" /><span className="thinkdot" /></div>
            <p role="status" style={sx('margin: 0; font-size: 15px; color: #CDBFAE')}>Vela está mirando tus noches …</p>
          </div>
        )}

        {st.revTab === 'pat' && doneCount >= 7 && st.patState === 'error' && (
          <div style={sx(CARD)}>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #E6DACB')}>{patterns ? 'No pude actualizar tus patrones ahora. Te muestro los últimos.' : 'Ahora mismo no puedo mirar tus patrones. Necesito conexión a internet.'}</p>
            <button type="button" onClick={() => update({ patState: 'idle' })} style={sx(GHOST + '; align-self: flex-start; display: flex; align-items: center; gap: 8px')}><Icon name="refresh-linear" size={16} />Reintentar</button>
          </div>
        )}

        {st.revTab === 'pat' && doneCount >= 7 && patterns && !st.patView && (
          <div style={sx('display: flex; flex-direction: column; gap: 10px; flex-shrink: 0')}>
            {([
              { id: 'src' as const, title: 'Tus fuentes de energía', teaser: teaser(patterns.sources), icon: 'leaf-linear' as const, tint: 'rgba(242,180,90,0.14)', ring: GOLD },
              { id: 'drain' as const, title: 'Lo que te quita energía', teaser: teaser(patterns.drains), icon: 'battery-low-linear' as const, tint: 'rgba(205,191,174,0.12)', ring: '#CDBFAE' },
              { id: 'more' as const, title: 'Ideas para ti', teaser: 'Pequeñas cosas que podrían ayudarte', icon: 'lightbulb-minimalistic-linear' as const, tint: 'rgba(242,180,90,0.14)', ring: GOLD },
            ]).map((tl) => (
              <button key={tl.id} type="button" onClick={() => update({ patView: tl.id, patItem: null })} style={sx('width: 100%; padding: 18px 16px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.08); background: rgba(245,239,228,0.05); color: #F5EFE4; display: flex; gap: 14px; align-items: center; text-align: left; cursor: pointer')}>
                <span aria-hidden="true" style={sx(`width: 42px; height: 42px; border-radius: 14px; flex-shrink: 0; background: ${tl.tint}; color: ${tl.ring}; display: flex; align-items: center; justify-content: center`)}><Icon name={tl.icon} size={22} /></span>
                <span style={sx('display: flex; flex-direction: column; gap: 3px; flex-grow: 1; min-width: 0')}>
                  <span style={sx('font-size: 16px; font-weight: 700')}>{tl.title}</span>
                  <span style={sx('font-size: 13px; line-height: 1.4; color: #CDBFAE')}>{tl.teaser}</span>
                </span>
                {CHEV}
              </button>
            ))}
            {st.patState === 'loading' && <p role="status" style={sx('margin: 4px 0 0; font-size: 13px; color: #9C8F86; text-align: center')}>Actualizando con tus últimas noches …</p>}
          </div>
        )}

        {st.revTab === 'pat' && patterns && st.patView && (
          <div style={sx('display: flex; flex-direction: column; gap: 14px; flex-shrink: 0')}>
            <button type="button" onClick={() => (st.patItem != null ? update({ patItem: null }) : update({ patView: null }))} style={sx('align-self: flex-start; height: 36px; padding: 0 12px 0 4px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; display: flex; align-items: center; gap: 4px; cursor: pointer')}>
              <Icon name="alt-arrow-left-linear" size={18} />{pv.backLabel}
            </button>
            <div style={sx('display: flex; flex-direction: column; gap: 6px')}>
              <h2 style={sx(H1 + '; font-size: 26px; line-height: 1.2')}>{pv.title}</h2>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>{pv.intro}</p>
            </div>
            {(st.patView === 'src' || st.patView === 'drain') && st.patItem == null && (
              <div style={sx('display: flex; flex-direction: column; border-radius: 20px; background: rgba(245,239,228,0.05); overflow: hidden')}>
                {pv.list.map((li) => (
                  <button key={li.i} type="button" onClick={() => update({ patItem: li.i })} style={sx('width: 100%; padding: 16px; border: none; border-bottom: 1px solid rgba(245,239,228,0.06); background: transparent; color: #F5EFE4; display: flex; gap: 12px; align-items: center; text-align: left; cursor: pointer')}>
                    <span style={sx('display: flex; flex-direction: column; gap: 2px; flex-grow: 1')}>
                      <span style={sx('font-size: 16px; font-weight: 700')}>{li.n}</span>
                      <span style={sx('font-size: 13px; color: #CDBFAE')}>{li.f}</span>
                    </span>
                    {CHEV}
                  </button>
                ))}
              </div>
            )}
            {pv.item && (
              <>
                {pv.item.when && (
                  <div style={sx('padding: 16px 18px; border-radius: 20px; background: rgba(245,239,228,0.05); display: flex; flex-direction: column; gap: 4px')}>
                    <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>Cuándo</p>
                    <p style={sx('margin: 0; font-size: 15px; line-height: 1.5')}>{pv.item.when}</p>
                  </div>
                )}
                <p style={sx('margin: 4px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{pv.isSrc ? 'Tus momentos' : 'Lo que te ayudó'}</p>
                {pv.item.quotes.map((q, i) => {
                  const a = pv.isSrc ? audioFor(q) : undefined;
                  return (
                    <div key={i} style={sx('padding: 14px 16px; border-radius: 18px; background: rgba(245,239,228,0.05); display: flex; gap: 12px; align-items: center')}>
                      {a && playBtn(a)}
                      <span style={sx("font-family: 'Fraunces', serif; font-style: italic; font-weight: 300; font-size: 16px; line-height: 1.4")}>{q}</span>
                    </div>
                  );
                })}
              </>
            )}
            {st.patView === 'more' && ideas.length === 0 && <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Por ahora no hay más ideas. Vuelve en unos días.</p>}
            {st.patView === 'more' && ideas.map((t) => {
              const on = !!data.ideas.on[t];
              return (
                <div key={t} style={sx('padding: 18px; border-radius: 20px; border: 1px solid rgba(242,180,90,0.3); display: flex; flex-direction: column; gap: 14px')}>
                  <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 18px; line-height: 1.45")}>{t}</p>
                  <div style={sx('display: flex; gap: 10px')}>
                    <button type="button" aria-pressed={on} onClick={() => setData((d) => ({ ...d, ideas: { ...d.ideas, on: { ...d.ideas.on, [t]: !d.ideas.on[t] } } }))} style={sx(`height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid #F2B45A; background: ${on ? '#F2B45A' : 'transparent'}; color: ${on ? '#2B2430' : '#FBE0A0'}; font-size: 14px; font-weight: 700; cursor: pointer`)}>{on ? '✓ Lo intentaré' : 'Lo intentaré'}</button>
                    <button type="button" onClick={() => setData((d) => ({ ...d, ideas: { ...d.ideas, hidden: { ...d.ideas.hidden, [t]: true } } }))} style={sx('height: 40px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer')}>Ahora no</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---------- Highs ----------
  const renderHighs = () => {
    const upcoming = data.upcoming.filter((u) => u.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past: { date: string; m: Moment }[] = [];
    Object.values(data.days).sort((a, b) => b.date.localeCompare(a.date)).forEach((e) => {
      [...e.high2, ...e.high1].forEach((m) => { if (momentLabel(m)) past.push({ date: e.date, m }); });
    });
    const yearAgo = data.days[addDays(today, -365)];
    const yearMoment = yearAgo ? [...yearAgo.high1, ...yearAgo.high2].find((m) => momentLabel(m)) : undefined;
    const saveUpcoming = () => {
      const title = st.upTitle.trim();
      if (!title || !st.upDate || st.upDate < today) return;
      setData((d) => ({ ...d, upcoming: [...d.upcoming, { id: uid(), date: st.upDate, title }] }));
      update({ upOpen: false, upTitle: '', upDate: addDays(today, 1) });
    };
    return (
      <div style={sx('position: absolute; left: 20px; right: 20px; top: 104px; bottom: 100px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; -webkit-overflow-scrolling: touch')}>
        <h1 style={sx(H1 + '; font-size: 30px')}>Tus highs</h1>
        <div style={sx('display: flex; justify-content: space-between; align-items: center; margin-top: 4px')}>
          <p style={sx('margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #F2B45A')}>Lo que viene</p>
          {!st.upOpen && <button type="button" aria-label="Añadir algo que te hace ilusión" onClick={() => update({ upOpen: true })} style={sx('height: 30px; padding: 0 12px; border-radius: 15px; border: 1px solid rgba(242,180,90,0.35); background: transparent; color: #FBE0A0; font-size: 12px; cursor: pointer')}>+ Añadir</button>}
        </div>
        {st.upOpen && (
          <div style={sx(CARD + '; border: 1px solid rgba(242,180,90,0.3); gap: 10px')}>
            <input type="text" aria-label="Algo que te hace ilusión" placeholder="Algo que te hace ilusión …" value={st.upTitle} autoFocus onChange={(e) => update({ upTitle: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') saveUpcoming(); }} style={sx(INPUT)} />
            <input type="date" aria-label="Fecha" value={st.upDate} min={today} onChange={(e) => update({ upDate: e.target.value })} style={sx(INPUT + '; color-scheme: dark')} />
            <div style={sx('display: flex; gap: 10px')}>
              <button type="button" onClick={saveUpcoming} style={sx('height: 42px; padding: 0 20px; border-radius: 21px; border: none; background: #F2B45A; color: #2B2430; font-size: 14px; font-weight: 700; cursor: pointer')}>Guardar</button>
              <button type="button" onClick={() => update({ upOpen: false, upTitle: '' })} style={sx('height: 42px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer')}>Cancelar</button>
            </div>
          </div>
        )}
        {upcoming.length === 0 && !st.upOpen && <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #CDBFAE')}>Apunta aquí lo que te hace ilusión. La ilusión también es un high.</p>}
        {upcoming.map((up) => {
          const d = parseKey(up.date);
          return (
            <div key={up.id} data-testid="viene" style={sx('padding: 12px 8px 12px 14px; border-radius: 20px; border: 1px solid rgba(242,180,90,0.3); background: rgba(242,180,90,0.06); display: flex; gap: 14px; align-items: center; flex-shrink: 0')}>
              <div style={sx('width: 48px; height: 52px; border-radius: 14px; background: rgba(242,180,90,0.16); flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center')}>
                <span style={sx('font-size: 18px; font-weight: 700; color: #FBE0A0; line-height: 1')}>{d.getDate()}</span>
                <span style={sx('font-size: 11px; color: #E6DACB; text-transform: uppercase; letter-spacing: 0.06em')}>{monthShort(d.getMonth())}</span>
              </div>
              <div style={sx('display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1')}>
                <p style={sx('margin: 0; font-size: 15px; line-height: 1.35')}>{up.title}</p>
                <p style={sx('margin: 0; font-size: 12px; color: #CDBFAE')}>{inDays(up.date, today)}</p>
              </div>
              <button type="button" aria-label={'Quitar ' + up.title} onClick={() => setData((dd) => ({ ...dd, upcoming: dd.upcoming.filter((x) => x.id !== up.id) }))} style={sx('width: 40px; height: 40px; border: none; background: transparent; color: #9C8F86; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0')}><Icon name="close-circle-linear" size={20} /></button>
            </div>
          );
        })}
        <p style={sx(SECTION + '; margin-top: 14px')}>Lo que fue</p>
        {yearMoment && (
          <div style={sx('padding: 16px; border-radius: 20px; border: 1px solid rgba(242,180,90,0.35); display: flex; gap: 14px; align-items: center; flex-shrink: 0')}>
            {yearMoment.audioId ? playBtn(yearMoment.audioId, 40) : <span aria-hidden="true" style={sx('width: 40px; height: 40px; border-radius: 20px; background: #F2B45A; color: #2B2430; flex-shrink: 0; display: flex; align-items: center; justify-content: center')}><Icon name="star-shine-bold-duotone" size={20} /></span>}
            <div style={sx('display: flex; flex-direction: column; gap: 2px')}>
              <p style={sx('margin: 0; font-size: 12px; color: #F2B45A; font-weight: 700')}>Hace un año</p>
              <p style={sx('margin: 0; font-size: 15px')}>{momentLabel(yearMoment)}</p>
            </div>
          </div>
        )}
        {past.length === 0 && <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #CDBFAE')}>Aquí irán apareciendo tus highs, noche a noche.</p>}
        {past.slice(0, 60).map(({ date, m }) => (
          <div key={m.id} data-testid="fue" style={sx('padding: 14px 16px; border-radius: 20px; background: rgba(245,239,228,0.06); display: flex; gap: 14px; align-items: center; flex-shrink: 0')}>
            {m.audioId ? playBtn(m.audioId, 36) : <span aria-hidden="true" style={sx('width: 36px; height: 36px; border-radius: 18px; border: 1.5px solid rgba(242,180,90,0.4); color: #F2B45A; flex-shrink: 0; display: flex; align-items: center; justify-content: center')}><Icon name="star-linear" size={16} /></span>}
            <div style={sx('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
              <p style={sx('margin: 0; font-size: 12px; color: #CDBFAE')}>{relLabel(date, today)}</p>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.4')}>{momentLabel(m)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ---------- Ajustes ----------
  const renderSettings = () => {
    const s = data.settings;
    const chip = (on: boolean) => `min-width: 64px; height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid ${on ? GOLD : 'rgba(245,239,228,0.22)'}; background: ${on ? 'rgba(242,180,90,0.18)' : 'transparent'}; color: #F5EFE4; font-size: 14px; font-weight: 600; cursor: pointer`;
    const row = (title: string, children: ReactNode, hint?: string) => (
      <div style={sx(CARD)}>
        <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{title}</p>
        {children}
        {hint && <p style={sx('margin: 0; font-size: 13px; line-height: 1.5; color: #9C8F86')}>{hint}</p>}
      </div>
    );
    return (
      <>
        <button type="button" aria-label="Volver" onClick={() => go('home')} style={sx('position: absolute; left: 24px; top: 54px; z-index: 2; ' + BACK_BTN)}><Icon name="alt-arrow-left-linear" size={20} /></button>
        <div style={sx('position: absolute; left: 20px; right: 20px; top: 112px; bottom: 24px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; -webkit-overflow-scrolling: touch')}>
          <h1 style={sx(H1 + '; font-size: 30px')}>Ajustes</h1>
          {row('Recordatorio', (
            <>
              <div style={sx('display: flex; gap: 8px; flex-wrap: wrap')}>
                {['21:00', '21:30', '22:00', '22:30'].map((tm) => (
                  <button key={tm} type="button" aria-pressed={s.remindTime === tm} onClick={() => setSettings({ remindTime: tm })} style={sx(chip(s.remindTime === tm))}>{tm}</button>
                ))}
              </div>
              <button type="button" onClick={() => { addReminderToCalendar(s.remindTime); setSettings({ remindOn: true }); update({ toast: 'Abre el archivo para añadir el recordatorio a tu calendario.' }); }} style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px')}><Icon name="calendar-add-linear" size={18} />Añadir a mi calendario</button>
            </>
          ), s.remindOn ? `Cada noche a las ${s.remindTime}, como evento con aviso en tu calendario. Si cambias la hora, vuelve a añadirlo.` : 'Vela te lo recuerda con un evento en tu calendario, una vez por la noche.')}
          {row('Cómo prefieres contarlo', (
            <>
              <div style={sx('display: flex; gap: 8px')}>
                <button type="button" aria-pressed={s.prefer === 'voz'} onClick={() => setSettings({ prefer: 'voz' })} style={sx(chip(s.prefer === 'voz'))}>Hablar</button>
                <button type="button" aria-pressed={s.prefer === 'texto'} onClick={() => setSettings({ prefer: 'texto' })} style={sx(chip(s.prefer === 'texto'))}>Escribir</button>
              </div>
              {!voiceSupported() && <p style={sx('margin: 0; font-size: 13px; color: #9C8F86')}>Este navegador no permite usar el micrófono.</p>}
              {voiceSupported() && !sttSupported() && <p style={sx('margin: 0; font-size: 13px; line-height: 1.5; color: #9C8F86')}>Este navegador guarda tu voz, pero no la transcribe. Para el texto automático, usa Chrome o Safari.</p>}
            </>
          ))}
          {row('Encender la vela', (
            <div style={sx('display: flex; gap: 8px')}>
              {[3, 5, 8].map((n) => (
                <button key={n} type="button" aria-pressed={s.breathSeconds === n} onClick={() => setSettings({ breathSeconds: n })} style={sx(chip(s.breathSeconds === n))}>{n} s</button>
              ))}
            </div>
          ), 'Lo que dura un respiro con el dedo sobre la mecha.')}
          {row('Música tranquila', (
            <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer" style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none')}><Icon name="music-notes-linear" size={18} />Abrir piano tranquilo en Spotify</a>
          ))}
          {!IS_STANDALONE && row('Vela en tu pantalla de inicio', (
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #E6DACB; display: flex; gap: 10px; align-items: center')}><Icon name="smartphone-linear" size={20} />Úsala como una app, a pantalla completa.</p>
          ), IS_IOS ? 'En Safari: toca Compartir y luego «Añadir a pantalla de inicio».' : 'En Chrome: menú ⋮ y luego «Instalar app» o «Añadir a pantalla de inicio».')}
          {row('Privacidad', (
            <>
              <button type="button" onClick={exportData} style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px')}><Icon name="download-minimalistic-linear" size={18} />Exportar mis momentos</button>
              {!st.confirmDelete ? (
                <button type="button" onClick={() => update({ confirmDelete: true })} style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px; color: #CDBFAE')}><Icon name="trash-bin-minimalistic-linear" size={18} />Borrar todo</button>
              ) : (
                <div style={sx('display: flex; flex-direction: column; gap: 8px')}>
                  <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #E6DACB')}>¿Seguro? Se borrarán todas tus noches y grabaciones de este dispositivo.</p>
                  <div style={sx('display: flex; gap: 10px')}>
                    <button type="button" onClick={deleteAll} style={sx(GHOST + '; border-color: #CDBFAE')}>Sí, borrar</button>
                    <button type="button" onClick={() => update({ confirmDelete: false })} style={sx('height: 44px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer')}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          ), 'Tus momentos y tu voz se guardan solo en este dispositivo. Para el espejo y los patrones, el texto (nunca el audio) se envía a Claude, de Anthropic.')}
          {row('Probar Vela', (
            <button type="button" onClick={() => { setData((d) => withSampleData(d)); update({ toast: 'Noches de ejemplo añadidas.' }); }} style={sx(GHOST)}>Añadir noches de ejemplo</button>
          ), 'Añade diez noches de ejemplo para ver el calendario, los highs y los patrones. Puedes borrarlas con «Borrar todo».')}
          <p style={sx('margin: 4px 0 0; font-size: 11px; color: #7F736C; text-align: center')}>
            Iconos: <a href="https://www.figma.com/community/file/1166831539721848736" target="_blank" rel="noopener noreferrer" style={sx('color: inherit')}>Solar</a> de 480 Design, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" style={sx('color: inherit')}>CC BY 4.0</a>
          </p>
        </div>
      </>
    );
  };

  const jumps: [string, Phase][] = [...(RECURRING_DEMO ? JUMPS_RECURRING : JUMPS_FIRST), ['Ajustes', 'settings']];
  const qs = (opts: { modo?: boolean; prueba?: boolean }) => {
    const p = new URLSearchParams();
    if (opts.modo) p.set('modo', 'recurrente');
    if (opts.prueba) p.set('prueba', '1');
    if (params.get('respira')) p.set('respira', params.get('respira')!);
    const s = p.toString();
    return '/' + (s ? '?' + s : '');
  };
  const jumpButtons = (
    <div className="testbar-row">
      {jumps.map(([label, target]) => (
        <button key={target} type="button" className="jump" aria-pressed={target === ph} onClick={() => jump(target)}>{label}</button>
      ))}
    </div>
  );
  const modeLinks = (
    <div className="testbar-links">
      <a href={qs({ prueba: true })}>Modo prueba</a>
      <a href={qs({ modo: true })}>Notificación (demo)</a>
      <a href="/">App normal</a>
      <span>Respiración: {breathSeconds} s</span>
    </div>
  );
  const credit = (
    <p className="credit">
      Iconos: <a href="https://www.figma.com/community/file/1166831539721848736" target="_blank" rel="noopener noreferrer">Solar</a> de 480 Design,{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
    </p>
  );
  const doneLines = todaySections.filter((s) => s.items.length).map((s) => ({ ring: s.ring, text: momentLabel(s.items[0]) }));
  const now = new Date();

  // ---------- Bühne (Telefon) ----------
  const stage = (
    <div
      className="stage"
      style={{
        position: 'relative', width: W, height: H, overflow: 'hidden',
        borderRadius: mobile ? 0 : 44, background: bg, transition: 'background 1.6s ease',
        fontFamily: "'Nunito Sans', sans-serif", color: '#F5EFE4',
        transform: `scale(${k})`, transformOrigin: '0 0',
      }}
    >
      <div aria-hidden="true" style={sx(`position: absolute; inset: 0; background: radial-gradient(circle at 50% ${glowPx}px, rgba(242,180,90,0.34) 0%, rgba(192,138,107,0.14) ${Math.round(0.3 * 844 * v)}px, rgba(43,36,48,0) ${Math.round(0.64 * 844 * v)}px); opacity: ${showCandle ? warmBg : 0}; transition: opacity 1.6s ease`)} />

      {ph === 'lock' && (
        <div aria-hidden="true" style={sx('position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% 0%, #3A3140 0%, #241E29 55%, #1A1620 100%)')} />
      )}

      <div style={{ position: 'absolute', left: colLeft, width: 390, top: 0, height: H }}>
        {ph === 'lock' && (
          <>
            <div style={sx('position: absolute; left: 0; right: 0; top: 96px; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #F5EFE4')}>
              <p style={sx('margin: 0; font-size: 16px; font-weight: 600; color: #E6DACB')}>{longLabel(keyOf(now))}</p>
              <p style={sx('margin: 0; font-size: 84px; font-weight: 300; line-height: 1; letter-spacing: -0.02em')}>{clockLabel(now)}</p>
            </div>
            <button type="button" onClick={() => go('home')} aria-label="Abrir notificación de Vela" style={sx(`position: absolute; left: 14px; right: 14px; top: ${T(300)}px; padding: 14px 16px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.12); background: rgba(245,239,228,0.1); color: #F5EFE4; display: flex; gap: 12px; align-items: flex-start; text-align: left; cursor: pointer`)}>
              <span aria-hidden="true" style={sx('width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: #2B2430; display: flex; align-items: center; justify-content: center')}>
                <span style={sx('width: 10px; height: 16px; border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%; background: radial-gradient(circle at 50% 72%, #FFF1CF 0%, #F6C66E 45%, #F0A24E 100%)')} />
              </span>
              <span style={sx('display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1')}>
                <span style={sx('display: flex; justify-content: space-between; font-size: 13px; color: #CDBFAE')}><span style={sx('font-weight: 700; letter-spacing: 0.04em')}>VELA</span><span>ahora</span></span>
                <span style={sx('font-size: 15px; font-weight: 700')}>El día se va apagando.</span>
                <span style={sx('font-size: 15px; line-height: 1.4; color: #E6DACB')}>¿Quieres cerrarlo con tres momentos?</span>
              </span>
            </button>
            <p className="fadehint" style={sx(`position: absolute; left: 0; right: 0; top: ${T(420)}px; margin: 0; text-align: center; font-size: 13px; color: #CDBFAE`)}>Toca la notificación</p>
          </>
        )}

        {isHome && (
          <div style={sx('position: absolute; top: 54px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: center; z-index: 2')}>
            <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>{cap(longLabel(today))}</p>
            <button type="button" aria-label="Ajustes" onClick={() => go('settings')} style={sx(BACK_BTN)}><Icon name="tuning-2-linear" size={20} /></button>
          </div>
        )}

        {inputPh && (
          <div style={sx('position: absolute; top: 54px; left: 24px; right: 24px; height: 44px; display: flex; justify-content: center; align-items: center; z-index: 2')}>
            {IN[inputPh].back && (
              <button type="button" aria-label="Atrás" onClick={() => go(IN[inputPh].back!)} style={sx('position: absolute; left: 0; top: 0; ' + BACK_BTN)}><Icon name="alt-arrow-left-linear" size={20} /></button>
            )}
            {IN[inputPh].skip && (
              <button type="button" onClick={() => go(IN[inputPh].skipTo!)} style={sx('position: absolute; right: 0; top: 0; height: 44px; padding: 0 4px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer')}>{IN[inputPh].skip}</button>
            )}
            <div role="img" aria-label={'Paso ' + (dotIdx + 1) + ' de 3'} style={sx('display: flex; gap: 8px; align-items: center')}>
              {[0, 1, 2].map((i) => {
                const on = i === dotIdx, done = i < dotIdx, c = i === 1 ? COOL : GOLD;
                return <span key={i} style={sx(`width: ${on ? 24 : 8}px; height: 8px; border-radius: 4px; background: ${on || done ? c : 'transparent'}; border: 1.5px solid ${on || done ? c : 'rgba(245,239,228,0.35)'}; transition: all .8s`)} />;
              })}
            </div>
          </div>
        )}

        {showCandle && (
          <Candle
            cfg={cfg}
            top={Math.round(CT[0] * v)}
            scale={r2(CT[1] * v)}
            ringOp={ph === 'lighting' ? 1 : 0}
            ringOff={Math.round((1 - prog) * 1000) / 1000}
            showWickHint={isHome && !isDone && doneCount < 3}
            canHold={(isHome && !isDone) || ph === 'lighting'}
            onHoldDown={onHoldDown}
            onHoldUp={holdUp}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
        )}

        {ph === 'intro' && (
          <div style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; bottom: 36px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px`)}>
            <h1 style={sx(H1 + '; font-size: 32px; line-height: 1.2')}>Hola, soy Vela.</h1>
            <p style={sx('margin: 0; font-size: 16px; line-height: 1.55; color: #CDBFAE')}>Cada noche, tres momentos: algo bueno, algo difícil y otra vez algo bueno. No hace falta más.</p>
            <div style={sx('flex-grow: 1')} />
            <button
              type="button"
              onClick={() => { setSettings({ onboarded: true }); navigator.storage?.persist?.().catch(() => undefined); go('home'); }}
              style={sx('width: 100%; min-height: 58px; border-radius: 29px; border: none; background: #F2B45A; color: #2B2430; font-size: 17px; font-weight: 700; cursor: pointer; flex-shrink: 0')}
            >Enciende tu primera luz</button>
            <p style={sx('margin: 0; font-size: 13px; color: #CDBFAE')}>Tus momentos son solo tuyos.</p>
          </div>
        )}

        {isHome && !isDone && (
          <div style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; pointer-events: none`)}>
            <h1 style={sx(H1 + '; font-size: 30px; line-height: 1.22')}>{todayEntry?.done ? 'Aquí sigo, si quieres más.' : 'Aquí estoy, cuando quieras.'}</h1>
            <p style={sx('margin: 0; padding: 8px 16px; border-radius: 16px; background: rgba(245,239,228,0.07); font-size: 14px; color: #E6DACB')}>Mantén pulsada la mecha</p>
          </div>
        )}

        {isDone && (
          <div style={sx('position: absolute; left: 28px; right: 28px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px')}>
            <h1 style={sx(H1 + '; font-size: 30px')}>Que descanses.</h1>
            {doneLines.length > 0 && (
              <div style={sx('width: 100%; padding: 16px 18px; border-radius: 20px; background: rgba(245,239,228,0.06); text-align: left; display: flex; flex-direction: column; gap: 10px')}>
                <p style={sx('margin: 0; font-size: 13px; font-weight: 700; color: #E6DACB')}>Tu día</p>
                {doneLines.map((m, i) => (
                  <div key={i} style={sx('display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 1.45; color: #F5EFE4')}>
                    <span style={sx(`width: 8px; height: 8px; border-radius: 4px; margin-top: 6px; flex-shrink: 0; background: ${m.ring}`)} />{m.text}
                  </div>
                ))}
              </div>
            )}
            <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Mañana por la noche te espera tu luz.</p>
            <div style={sx('display: flex; gap: 10px; justify-content: center; flex-wrap: wrap')}>
              <button type="button" onClick={() => go('mirror')} style={sx(GHOST)}>Ver tu día</button>
              <button type="button" onClick={() => update({ relight: true })} style={sx(GHOST)}>Volver a encender</button>
            </div>
          </div>
        )}

        {ph === 'lighting' && (
          <div aria-live="polite" style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; pointer-events: none`)}>
            <h1 style={sx(H1 + '; font-size: 30px; line-height: 1.22')}>{prog < 0.5 ? 'Inhala conmigo.' : 'Y exhala despacio.'}</h1>
            <p style={sx('margin: 0; font-size: 15px; color: #CDBFAE')}>Deja el dedo sobre la mecha.</p>
          </div>
        )}

        {ph === 'lit' && (
          <div style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; text-align: center`)}>
            <h1 style={sx(H1 + '; font-size: 30px')}>Tu luz está encendida.</h1>
          </div>
        )}

        {renderInput()}
        {ph === 'mirror' && renderMirror()}

        {ph === 'remind' && (
          <div style={sx('position: absolute; left: 28px; right: 28px; top: 112px; bottom: 28px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
            <h1 style={sx(H1 + '; font-size: 28px')}>Qué bien que hayas venido.</h1>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>¿Quieres que mañana por la noche te lo recuerde con suavidad?</p>
            <div style={sx('display: flex; gap: 10px; margin-top: 6px')}>
              {['21:00', '21:30', '22:00'].map((tm) => {
                const on = data.settings.remindTime === tm;
                return <button key={tm} type="button" aria-pressed={on} onClick={() => setSettings({ remindTime: tm })} style={sx(`min-width: 84px; height: 46px; border-radius: 23px; border: 1px solid ${on ? GOLD : 'rgba(245,239,228,0.22)'}; background: ${on ? 'rgba(242,180,90,0.18)' : 'transparent'}; color: #F5EFE4; font-size: 15px; font-weight: 600; cursor: pointer`)}>{tm}</button>;
              })}
            </div>
            <p style={sx('margin: 0; font-size: 13px; color: #CDBFAE')}>Solo una vez por la noche. Puedes cambiarlo cuando quieras.</p>
            <div style={sx('flex-grow: 1')} />
            <button
              type="button"
              onClick={() => { addReminderToCalendar(dataRef.current.settings.remindTime); setSettings({ remindAsked: true, remindOn: true }); update({ toast: 'Abre el archivo para añadirlo a tu calendario.' }); go('now'); }}
              style={sx(PRIMARY + '; flex-shrink: 0')}
            >Sí, por favor</button>
            <button type="button" onClick={() => { setSettings({ remindAsked: true }); go('now'); }} style={sx('min-height: 44px; border: none; background: transparent; color: #E6DACB; font-size: 15px; cursor: pointer')}>Mejor no</button>
          </div>
        )}

        {ph === 'now' && (
          <>
            <button type="button" aria-label="Volver a tu día" onClick={() => go('mirror')} style={sx('position: absolute; left: 24px; top: 54px; z-index: 2; ' + BACK_BTN)}><Icon name="alt-arrow-left-linear" size={20} /></button>
            <div style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px')}>
              <h1 style={sx(H1 + '; font-size: 28px')}>Tu día ya puede descansar.</h1>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>Quédate todo el tiempo que quieras. O sigue hacia donde te lleve el momento.</p>
            </div>
            <div style={sx(`position: absolute; left: 0; right: 0; top: ${T(290)}px; display: flex; flex-direction: column; align-items: center`)}>
              <button type="button" onClick={() => go('stay')} style={sx(OPTION)}><span style={sx('color: #F2B45A; display: flex')}><Icon name="fire-linear" size={18} /></span>Quedarme con la vela</button>
              <button type="button" onClick={() => go('journal')} style={sx(OPTION)}><span style={sx('color: #F2B45A; display: flex')}><Icon name="notebook-linear" size={18} /></span>Escribir en mi diario</button>
              <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer" style={sx(OPTION)}><span style={sx('color: #F2B45A; display: flex')}><Icon name="music-notes-linear" size={18} /></span>Escuchar música tranquila</a>
              <button type="button" onClick={() => go('blow')} style={sx(OPTION + '; border-bottom: none')}><span style={sx('color: #F2B45A; display: flex')}><Icon name="moon-sleep-linear" size={18} /></span>Irme a dormir</button>
            </div>
          </>
        )}

        {ph === 'stay' && (
          <p className="fadehint" style={sx('position: absolute; left: 0; right: 0; top: 140px; margin: 0; text-align: center; font-size: 13px; color: #CDBFAE; pointer-events: none')}>Toca en cualquier lugar para volver</p>
        )}

        {ph === 'journal' && (
          <>
            <div style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; pointer-events: none')}>
              <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>Coge tu libreta y tu bolígrafo.</h1>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>Escribe lo que aún quiera salir. Vela te acompaña.</p>
            </div>
            <p className="fadehint" style={sx(`position: absolute; left: 0; right: 0; top: ${T(400)}px; margin: 0; text-align: center; font-size: 13px; color: #CDBFAE; pointer-events: none`)}>Toca en cualquier lugar para volver</p>
          </>
        )}

        {ph === 'blow' && (
          <>
            <div style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
              <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>Cuando quieras, apágala.</h1>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>Toca la llama.</p>
            </div>
            <button type="button" aria-label="Apagar la vela" onClick={blowOut} style={sx(`position: absolute; left: 115px; top: ${T(330)}px; width: 160px; height: ${T(240)}px; border-radius: 80px; border: none; background: transparent; cursor: pointer`)} />
          </>
        )}

        {ph === 'sleep' && (
          <div style={sx('position: absolute; left: 32px; right: 32px; top: 120px; text-align: center')}>
            <h1 style={sx(H1 + '; font-size: 32px')}>Que descanses.</h1>
          </div>
        )}

        {ph === 'review' && renderReview()}
        {ph === 'highs' && renderHighs()}
        {ph === 'settings' && renderSettings()}
      </div>

      {(ph === 'stay' || ph === 'journal') && (
        <button type="button" aria-label="Volver a las opciones" onClick={() => go('now')} style={sx('position: absolute; inset: 0; border: none; background: transparent; cursor: pointer')} />
      )}

      {showNav && (
        <nav aria-label="Navegación principal" style={sx(`position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; padding: 12px 24px 30px; border-top: 1px solid rgba(245,239,228,0.08); background: ${bg}; transition: background 1.6s ease; z-index: 3`)}>
          <div style={sx('display: flex; justify-content: space-around; width: 342px')}>
            {([
              { id: 'home' as const, label: 'Hoy', icon: 'moon-stars' as const },
              { id: 'review' as const, label: 'Resumen', icon: 'calendar-mark' as const },
              { id: 'highs' as const, label: 'Highs', icon: 'star-shine' as const },
            ]).map((tb) => {
              const on = tb.id === tabPh;
              return (
                <button key={tb.id} type="button" aria-current={on ? 'page' : undefined} onClick={() => go(tb.id)} style={sx(`min-width: 72px; min-height: 48px; border: none; background: transparent; color: ${on ? GOLD : '#CDBFAE'}; font-size: 12px; font-weight: ${on ? 700 : 400}; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer`)}>
                  <Icon name={on ? `${tb.icon}-bold-duotone` : `${tb.icon}-linear`} size={24} />
                  {tb.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {st.breathing && (
        <div style={sx('position: absolute; inset: 0; background: #221D28; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; z-index: 5')}>
          <div style={sx('position: relative; width: 240px; height: 240px; display: flex; align-items: center; justify-content: center')}>
            <div className="breath" style={sx('position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(242,180,90,0.5) 0%, rgba(242,180,90,0.14) 55%, rgba(242,180,90,0) 72%)')} />
            <p className="bin" style={sx(H1 + '; position: absolute; font-size: 24px')}>Inhala</p>
            <p className="bout" style={sx(H1 + '; position: absolute; font-size: 24px')}>Exhala</p>
          </div>
          <button type="button" onClick={() => update({ breathing: false })} style={sx('min-width: 160px; height: 50px; border-radius: 25px; border: 1px solid rgba(245,239,228,0.25); background: transparent; color: #F5EFE4; font-size: 15px; cursor: pointer')}>Listo</button>
        </div>
      )}

      {st.toast && (
        <div role="status" style={sx('position: absolute; left: 20px; right: 20px; top: 12px; z-index: 8; padding: 12px 16px; border-radius: 16px; background: rgba(58,49,64,0.97); border: 1px solid rgba(245,239,228,0.12); color: #F5EFE4; font-size: 14px; line-height: 1.45; text-align: center; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.6)')}>{st.toast}</div>
      )}

      {TEST && ph !== 'intro' && (
        <button type="button" aria-label="Reiniciar prototipo" title="Reiniciar prototipo" onClick={reset} style={sx('position: absolute; left: 50%; top: 6px; margin-left: -22px; width: 44px; height: 44px; border-radius: 22px; border: none; background: transparent; color: rgba(245,239,228,0.45); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 6')}>
          <Icon name="restart-linear" size={18} />
        </button>
      )}
      {mobile && TEST && (
        <button type="button" onClick={() => setSheetOpen(true)} aria-haspopup="dialog" style={sx('position: absolute; right: 10px; top: 10px; height: 32px; padding: 0 12px; border-radius: 16px; border: none; background: rgba(245,239,228,0.07); color: rgba(245,239,228,0.6); font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; z-index: 6')}>
          <Icon name="hamburger-menu-linear" size={14} />Pantallas
        </button>
      )}
    </div>
  );

  if (mobile) {
    return (
      <div className="page-mobile">
        <div style={{ width: W * k, height: H * k }}>{stage}</div>
        {sheetOpen && (
          <>
            <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
            <div className="sheet" role="dialog" aria-label="Pantallas del prototipo">
              <div style={sx('display: flex; justify-content: space-between; align-items: center')}>
                <p className="testbar-title">Ir directamente a</p>
                <button type="button" onClick={() => setSheetOpen(false)} style={sx('height: 36px; padding: 0 14px; border-radius: 18px; border: 1px solid #D6D0C8; background: transparent; color: #2B2430; font-size: 13px; font-weight: 600; cursor: pointer')}>Cerrar</button>
              </div>
              {jumpButtons}
              {modeLinks}
              {credit}
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
        <p className="testbar-title">{TEST ? 'Ir directamente a' : 'Vela · High Low High'}</p>
        {TEST ? jumpButtons : <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #6B5F57')}>Abre esta página en tu móvil y añádela a la pantalla de inicio para usar Vela como una app.</p>}
        {modeLinks}
        {credit}
      </div>
    </div>
  );
}

// Eigenes Eingabefeld, damit Tippen nicht die ganze App neu rendert.
function TypingBox({ label, accent, initial, onDone, onSpeak }: { label: string; accent: string; initial: string; onDone: (t: string) => void; onSpeak?: () => void }) {
  const [text, setText] = useState(initial);
  const has = !!text.trim();
  return (
    <>
      <textarea
        aria-label={label}
        placeholder="Escribe sin más …"
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        style={sx("width: 100%; height: 100px; padding: 16px 18px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.16); background: rgba(245,239,228,0.05); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; line-height: 1.55; resize: none")}
      />
      <button type="button" onClick={() => onDone(text)} disabled={!has} style={sx(`height: 48px; min-width: 180px; padding: 0 32px; border-radius: 24px; border: 1px solid ${has ? accent : 'rgba(245,239,228,0.25)'}; background: ${has ? accent : 'transparent'}; color: ${has ? '#2B2430' : '#F5EFE4'}; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .8s ease, color .8s ease, border-color .8s ease`)}>Listo</button>
      {onSpeak && <button type="button" onClick={onSpeak} style={sx(LINK_BTN)}>Prefiero hablar</button>}
    </>
  );
}
