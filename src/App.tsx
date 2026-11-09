import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Candle, type CandleCfg } from './Candle';
import { Icon } from './Icon';
import { sx } from './sx';
import { useLayout } from './useLayout';
import {
  COOL, DAYDATA, DEMO2, DRAIN, F, FALL, GOLD, IN, JUMPS_FIRST, JUMPS_RECURRING, MORE, MT, MV, PAST_HIGHS,
  SPOTIFY_URL, SRC, SUGG, UPCOMING, WD, isInputPhase, type InputPhase, type Phase,
} from './data';

// ---------- Einstellungen über die URL ----------
const params = new URLSearchParams(window.location.search);
const RECURRING = params.get('modo') === 'recurrente';
const BREATH_SECONDS = (() => {
  const n = Number(params.get('respira'));
  return Number.isFinite(n) && n >= 1 && n <= 30 ? n : 3;
})();

type DayKey = 'high1' | 'low' | 'high2';
type PatView = null | 'src' | 'drain' | 'more' | 'week';

interface State {
  phase: Phase;
  prog: number;
  texts: Record<InputPhase, string>;
  voice: Record<InputPhase, number>;
  typing: boolean;
  rec: boolean;
  recSec: number;
  firstTime: boolean;
  remindTime: string;
  done: boolean;
  breathing: boolean;
  mirrored: Record<InputPhase, boolean>;
  reflecting: InputPhase | null;
  askHelp: boolean;
  extras: Record<DayKey, string[]>;
  adding: DayKey | null;
  draft: string;
  dayOpen: boolean;
  revTab: 'cal' | 'pat';
  selDay: number;
  special: Record<number, boolean>;
  patView: PatView;
  patItem: number | null;
  moreOn: Record<number, boolean>;
  moreHidden: Record<number, boolean>;
}

function blank(): State {
  return {
    phase: RECURRING ? 'lock' : 'intro', prog: 0,
    texts: { high1: '', low: '', ask: '', high2: '' }, voice: { high1: 0, low: 0, ask: 0, high2: 0 },
    typing: false, rec: false, recSec: 0, firstTime: !RECURRING, remindTime: '21:30', done: false, breathing: false,
    mirrored: { high1: false, low: false, ask: false, high2: false }, reflecting: null, askHelp: false,
    extras: { high1: [], low: [], high2: [] }, adding: null, draft: '', dayOpen: false,
    revTab: 'cal', selDay: 9, special: { 7: true }, patView: null, patItem: null, moreOn: {}, moreHidden: {},
  };
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
const r2 = (n: number) => Math.round(n * 100) / 100;
const vibrate = (ms: number | number[]) => {
  try { navigator.vibrate?.(ms); } catch { /* nicht unterstützt */ }
};

function stopRecPatch(s: State): Partial<State> {
  if (s.rec && isInputPhase(s.phase)) return { rec: false, voice: { ...s.voice, [s.phase]: Math.max(s.recSec, 1) } };
  return { rec: false };
}

// Wiederkehrende Stilbausteine
const H1 = "margin: 0; font-family: 'Fraunces', serif; font-weight: 300";
const BACK_BTN = 'width: 44px; height: 44px; border-radius: 22px; border: none; background: rgba(245,239,228,0.07); color: #CDBFAE; display: flex; align-items: center; justify-content: center; cursor: pointer';
const LINK_BTN = 'min-height: 44px; padding: 0 16px; border: none; background: transparent; color: #E6DACB; font-size: 15px; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: rgba(230,218,203,0.4); cursor: pointer';
const PRIMARY = 'width: 100%; height: 52px; border-radius: 26px; border: none; background: #F2B45A; color: #2B2430; font-size: 16px; font-weight: 700; cursor: pointer';
const OPTION = 'width: 240px; height: 50px; border: none; border-bottom: 1px solid rgba(245,239,228,0.08); background: transparent; color: #E6DACB; font-size: 16px; letter-spacing: 0.01em; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-decoration: none';
const EYEBROW = 'margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #CDBFAE';

export default function App() {
  const layout = useLayout();
  const [st, setSt] = useState<State>(blank);
  const [sheetOpen, setSheetOpen] = useState(false);

  const stRef = useRef(st);
  stRef.current = st;
  const timers = useRef<number[]>([]);
  const recTimer = useRef<number | null>(null);
  const lightTimer = useRef<number | null>(null);
  const holding = useRef(false);
  const progRef = useRef(0);
  const lastTick = useRef(0);

  const update = useCallback((p: Partial<State> | ((s: State) => Partial<State>)) => {
    setSt((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  }, []);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearRecTimer = () => { if (recTimer.current != null) { clearInterval(recTimer.current); recTimer.current = null; } };
  const clearAll = () => {
    clearRecTimer();
    if (lightTimer.current != null) { clearInterval(lightTimer.current); lightTimer.current = null; }
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    holding.current = false;
    progRef.current = 0;
  };

  useEffect(() => () => clearAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (ph: Phase) => {
    clearRecTimer();
    update((s) => ({ ...stopRecPatch(s), phase: ph, typing: false, askHelp: false, dayOpen: false, patView: null, patItem: null }));
  };

  const reflect = (k: InputPhase) => {
    update({ reflecting: k });
    later(() => update((s) => ({ mirrored: { ...s.mirrored, [k]: true }, reflecting: s.reflecting === k ? null : s.reflecting })), 1600);
  };

  // ---------- Anzünden: Docht halten, ein Atemzug ----------
  const startTick = () => {
    if (lightTimer.current != null) return;
    lastTick.current = Date.now();
    lightTimer.current = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      const p = progRef.current + (holding.current ? dt / (BREATH_SECONDS * 1000) : -dt / 900);
      if (p >= 1) {
        clearInterval(lightTimer.current!); lightTimer.current = null; holding.current = false;
        progRef.current = 1;
        update({ prog: 1, phase: 'lit' });
        vibrate(40);
        later(() => { progRef.current = 0; update({ phase: 'high1', prog: 0 }); }, 1700);
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
  const holdDown = () => {
    const s = stRef.current;
    if (s.done || (s.phase !== 'home' && s.phase !== 'lighting')) return;
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

  // ---------- Aktionen ----------
  const toggleRec = () => {
    const s = stRef.current;
    if (s.rec) {
      const k = s.phase;
      clearRecTimer();
      update(stopRecPatch);
      if (isInputPhase(k)) reflect(k);
      return;
    }
    update({ rec: true, recSec: 0, typing: false });
    clearRecTimer();
    recTimer.current = window.setInterval(() => update((x) => ({ recSec: x.recSec + 1 })), 1000);
  };
  const doneTyping = () => {
    const s = stRef.current;
    if (!isInputPhase(s.phase) || !s.texts[s.phase].trim()) return;
    update({ typing: false });
    reflect(s.phase);
  };
  const commitAdd = () => {
    update((s) => {
      const k = s.adding, t = s.draft.trim();
      if (k && t) return { extras: { ...s.extras, [k]: [...s.extras[k], t] }, adding: null, draft: '' };
      return { adding: null, draft: '' };
    });
  };
  const jump = (ph: Phase) => {
    clearAll();
    setSheetOpen(false);
    update((s) => ({ ...stopRecPatch(s), phase: ph, prog: 0, typing: false, askHelp: false, dayOpen: false, done: false, reflecting: null, adding: null, breathing: false }));
  };
  const reset = () => { clearAll(); setSt(blank()); };
  const startOver = () => { clearAll(); setSt({ ...blank(), phase: 'home', firstTime: false }); };
  const blowOut = () => {
    go('sleep');
    vibrate([20, 60, 30]);
    later(() => update({ phase: 'home', done: true }), 4200);
  };

  // ---------- Abgeleitete Werte (entspricht renderVals() der Referenz) ----------
  const ph = st.phase;
  const prog = st.prog;
  const inputPh: InputPhase | null = isInputPhase(ph) ? ph : null;
  let f = F[ph] ?? F.home!;
  if (ph === 'home' && st.done) f = F.sleep!;
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
  const bg = ph === 'stay' || ph === 'sleep' || (ph === 'home' && st.done) ? '#211B26' : '#2B2430';

  const ln = (k: DayKey): string => {
    const t = (st.texts[k] || '').trim();
    if (t) return t.length > 72 ? t.slice(0, 70) + ' …' : t;
    if (st.voice[k] > 0) return FALL[k];
    return '';
  };
  const none = !ln('high1') && !ln('low') && !ln('high2');
  let itemCount = 0;
  const days = (['high1', 'low', 'high2'] as DayKey[]).map((k) => {
    const items: string[] = [];
    const base = ln(k) || (none ? FALL[k] : '');
    if (base) items.push(base);
    if ((none || st.voice[k] > 0) && DEMO2[k]) items.push(DEMO2[k]);
    st.extras[k].forEach((t) => items.push(t));
    itemCount += items.length;
    const low = k === 'low';
    return {
      k, label: low ? 'Low' : 'High', fill: low ? 'transparent' : GOLD, ring: low ? '#CDBFAE' : GOLD, glow: low ? 0 : 8,
      items, bulletOp: items.length > 1 ? 1 : 0, adding: st.adding === k, addAria: 'Añadir ' + (low ? 'Low' : 'High'),
    };
  });
  const todayLines = days.filter((d) => d.items.length).map((d) => ({ label: d.label, fill: d.fill, ring: d.ring, text: d.items[0] }));
  const linesFor = (n: number) => {
    if (n === 9) return todayLines;
    const dd = DAYDATA[n];
    if (!dd) return [];
    return [
      { label: 'High', fill: GOLD, ring: GOLD, text: dd[0] },
      { label: 'Low', fill: 'transparent', ring: '#CDBFAE', text: dd[1] },
      { label: 'High', fill: GOLD, ring: GOLD, text: dd[2] },
    ];
  };
  const selLines = linesFor(st.selDay);
  const selSpecial = !!st.special[st.selDay];

  const highsList: { d: string; t: string }[] = [];
  (['high1', 'high2'] as DayKey[]).forEach((k) => { const t = ln(k); if (t) highsList.push({ d: 'Hoy', t }); });
  highsList.push(...PAST_HIGHS);

  const mirrorFor = (k: InputPhase) => {
    let t = (st.texts[k] || '').trim();
    if (t) {
      t = t.replace(/[.!?…\s]+$/, '');
      if (t.length > 90) t = t.slice(0, 88) + ' …';
      return MT[k].replace('{t}', t) + '.';
    }
    return MV[k];
  };

  const isHome = ph === 'home';
  const early = ph === 'intro' || (isHome && !st.done) || ph === 'lighting' || ph === 'lit';
  const bigPh = ph === 'stay' || ph === 'journal' || ph === 'blow' || ph === 'sleep';
  const homeDone = isHome && st.done;
  const CT: [number, number] = early ? [150, 0.75] : bigPh ? [200, 1.3] : ph === 'now' ? [318, 1] : ph === 'mirror' || homeDone ? [360, 0.55] : [280, 0.6];
  const glowY = early ? 41 : bigPh ? 62 : ph === 'now' ? 68 : ph === 'mirror' || homeDone ? 58 : 51;
  const showCandle = ph !== 'review' && ph !== 'highs' && ph !== 'lock';
  const showNav = isHome || ph === 'review' || ph === 'highs';
  const tabPh = ph === 'review' || ph === 'highs' ? ph : 'home';
  const dotIdx = inputPh ? IN[inputPh].dot : -1;

  // ---------- Layout-Anpassung an kurze Bildschirme ----------
  const { mobile, s: k, W, H, v } = layout;
  const T = (n: number) => Math.round(n * v); // vertikale Positionen unterhalb der Kopfzeile
  const colLeft = (W - 390) / 2;
  const glowPx = Math.round((glowY / 100) * 844 * v);

  // ---------- Erzähl-Screens ----------
  let q: null | Record<string, unknown> = null;
  if (inputPh) {
    const d = IN[inputPh];
    const accent = coolBg ? COOL : GOLD;
    const txt = st.texts[inputPh].trim();
    const mirrored = st.mirrored[inputPh];
    const refl = st.reflecting === inputPh;
    const help = inputPh === 'ask' && st.askHelp && !mirrored && !refl;
    const idle = !st.rec && !st.typing && !refl && !mirrored && !help;
    q = {
      accent, txt, help, idle, mirrored, refl,
      accentSoft: coolBg ? 'rgba(159,180,200,0.35)' : 'rgba(242,180,90,0.35)',
      micBg: st.rec ? accent : coolBg ? 'rgba(159,180,200,0.12)' : 'rgba(242,180,90,0.12)',
      micFg: st.rec ? '#2B2430' : accent,
      mirrorBd: coolBg ? 'rgba(159,180,200,0.32)' : 'rgba(242,180,90,0.32)',
      d,
    };
  }

  const renderInput = () => {
    if (!inputPh || !q) return null;
    const d = IN[inputPh];
    const accent = q.accent as string;
    const txt = q.txt as string;
    const showMic = (q.idle as boolean) || st.rec;
    const showTyping = st.typing && !q.mirrored && !q.refl;
    const showMirror = (q.mirrored as boolean) && !q.refl;
    return (
      <>
        <div style={sx('position: absolute; left: 32px; right: 32px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px')}>
          {d.eb && <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{d.eb}</p>}
          <h1 style={sx(H1 + '; font-size: 28px; line-height: 1.25')}>{d.t}</h1>
          <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>{d.s}</p>
        </div>
        <div style={sx('position: absolute; left: 28px; right: 28px; bottom: 40px; display: flex; flex-direction: column; align-items: center; gap: 18px')}>
          {showMic && (
            <>
              <div style={sx('position: relative; width: 92px; height: 92px')}>
                {st.rec && <span className="recbreath" style={sx(`position: absolute; left: -22px; top: -22px; width: 136px; height: 136px; border-radius: 50%; background: radial-gradient(circle, ${q.accentSoft} 0%, rgba(43,36,48,0) 70%)`)} />}
                <button
                  type="button"
                  aria-label={st.rec ? 'Detener grabación' : 'Iniciar grabación'}
                  aria-pressed={st.rec}
                  onClick={toggleRec}
                  style={sx(`position: relative; width: 92px; height: 92px; border-radius: 46px; border: 1.5px solid ${accent}; background: ${q.micBg}; color: ${q.micFg}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .8s ease, color .8s ease`)}
                >
                  {st.rec ? <span style={sx('width: 20px; height: 20px; border-radius: 5px; background: #2B2430')} /> : <Icon name="microphone-3-linear" size={32} />}
                </button>
              </div>
              <p role={st.rec ? 'status' : undefined} style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>
                {st.rec ? 'Te escucho … 0:' + pad(st.recSec) : 'Toca y cuéntamelo'}
              </p>
              <div style={sx(`display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; visibility: ${st.rec ? 'hidden' : 'visible'}`)}>
                <button type="button" onClick={() => { clearRecTimer(); update((s) => ({ ...stopRecPatch(s), typing: !s.typing })); }} style={sx(LINK_BTN)}>Prefiero escribir</button>
                {inputPh === 'ask' && (
                  <>
                    <span aria-hidden="true" style={sx('color: rgba(205,191,174,0.5)')}>·</span>
                    <button type="button" onClick={() => { clearRecTimer(); update((s) => ({ ...stopRecPatch(s), askHelp: true, typing: false })); }} style={sx('min-height: 44px; padding: 0 12px; border: none; background: transparent; color: #CDBFAE; font-size: 15px; cursor: pointer')}>No lo sé</button>
                  </>
                )}
              </div>
            </>
          )}
          {(q.help as boolean) && (
            <>
              <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #E6DACB; text-align: center')}>Está bien no saberlo. Quizás algo de esto:</p>
              <div style={sx('display: flex; flex-wrap: wrap; gap: 8px; justify-content: center')}>
                {SUGG.map((lab) => (
                  <button key={lab} type="button" onClick={() => { update((s) => ({ texts: { ...s.texts, ask: lab }, askHelp: false })); reflect('ask'); }} style={sx('height: 42px; padding: 0 18px; border-radius: 21px; border: 1px solid rgba(245,239,228,0.22); background: rgba(245,239,228,0.05); color: #F5EFE4; font-size: 14px; cursor: pointer')}>{lab}</button>
                ))}
              </div>
              <button type="button" onClick={() => d.skipTo && go(d.skipTo)} style={sx(LINK_BTN + '; color: #CDBFAE; text-decoration-color: rgba(205,191,174,0.4)')}>Seguir sin respuesta</button>
            </>
          )}
          {showTyping && (
            <>
              <textarea
                aria-label={d.t}
                placeholder="Escribe sin más …"
                value={st.texts[inputPh]}
                autoFocus
                onChange={(e) => { const val = e.target.value; update((s) => ({ texts: { ...s.texts, [inputPh]: val } })); }}
                style={sx("width: 100%; height: 100px; padding: 16px 18px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.16); background: rgba(245,239,228,0.05); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; line-height: 1.55; resize: none")}
              />
              <button type="button" onClick={doneTyping} style={sx(`height: 48px; min-width: 180px; padding: 0 32px; border-radius: 24px; border: 1px solid ${txt ? accent : 'rgba(245,239,228,0.25)'}; background: ${txt ? accent : 'transparent'}; color: ${txt ? '#2B2430' : '#F5EFE4'}; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .8s ease, color .8s ease, border-color .8s ease`)}>Listo</button>
              <button type="button" onClick={() => update({ typing: false })} style={sx(LINK_BTN)}>Prefiero hablar</button>
            </>
          )}
          {(q.refl as boolean) && (
            <>
              <div aria-hidden="true" style={sx('height: 40px; display: flex; gap: 8px; align-items: center')}><span className="thinkdot" /><span className="thinkdot" /><span className="thinkdot" /></div>
              <p role="status" style={sx('margin: 0 0 60px; font-size: 14px; color: #CDBFAE')}>Un momento …</p>
            </>
          )}
          {showMirror && (
            <>
              <div style={sx(`width: 100%; padding: 18px 20px; border-radius: 22px; border: 1px solid ${q.mirrorBd}; background: rgba(245,239,228,0.05); display: flex; flex-direction: column; gap: 8px`)}>
                <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #CDBFAE')}>Lo que escuché</p>
                <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 19px; line-height: 1.45; color: #F5EFE4")}>{mirrorFor(inputPh)}</p>
              </div>
              <div style={sx('display: flex; gap: 16px; justify-content: center; align-items: center')}>
                <button
                  type="button"
                  onClick={() => update((s) => ({ texts: { ...s.texts, [inputPh]: '' }, voice: { ...s.voice, [inputPh]: 0 }, mirrored: { ...s.mirrored, [inputPh]: false }, typing: false, askHelp: false }))}
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
          <p style={sx('margin: 0; font-size: 12px; letter-spacing: 0.04em; color: #CDBFAE')}>Lunes, 9 de noviembre</p>
        </div>
        <div style={sx('position: relative; display: flex; flex-direction: column; gap: 18px; padding-left: 26px')}>
          <span aria-hidden="true" style={sx('position: absolute; left: 5px; top: 8px; bottom: 8px; width: 1px; background: linear-gradient(180deg, rgba(242,180,90,0.6), rgba(205,191,174,0.25) 50%, rgba(242,180,90,0.6))')} />
          {days.map((sec) => (
            <div key={sec.k} style={sx('position: relative; display: flex; flex-direction: column; gap: 6px')}>
              <span aria-hidden="true" style={sx(`position: absolute; left: -26px; top: 6px; width: 11px; height: 11px; border-radius: 6px; background: ${sec.fill}; border: 1.5px solid ${sec.ring}; box-shadow: 0 0 ${sec.glow}px rgba(242,180,90,0.55)`)} />
              <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
                <p style={sx(EYEBROW)}>{sec.label}</p>
                <button type="button" aria-label={sec.addAria} onClick={() => update({ adding: sec.k, draft: '' })} style={sx('height: 28px; padding: 0 12px; border-radius: 14px; border: 1px solid rgba(245,239,228,0.14); background: transparent; color: #CDBFAE; font-size: 12px; cursor: pointer')}>+ Añadir</button>
              </div>
              {sec.items.map((t, i) => (
                <div key={i} style={sx('display: flex; gap: 8px; align-items: flex-start')}>
                  <span aria-hidden="true" style={sx(`margin-top: 11px; width: 6px; height: 1px; flex-shrink: 0; background: #CDBFAE; opacity: ${sec.bulletOp}`)} />
                  <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-style: italic; font-weight: 300; font-size: 17px; line-height: 1.4; color: #F5EFE4")}>{t}</p>
                </div>
              ))}
              {sec.adding && (
                <div style={sx('display: flex; gap: 8px; align-items: center; margin-top: 2px')}>
                  <input
                    type="text"
                    aria-label={sec.addAria}
                    placeholder="Algo más …"
                    value={st.draft}
                    autoFocus
                    enterKeyHint="done"
                    onChange={(e) => update({ draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitAdd(); }
                      if (e.key === 'Escape') update({ adding: null, draft: '' });
                    }}
                    style={sx("flex-grow: 1; min-width: 0; height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.2); background: rgba(245,239,228,0.05); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px")}
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
        <button type="button" onClick={() => go(st.firstTime ? 'remind' : 'now')} style={sx(PRIMARY)}>Seguir</button>
      </div>
    </>
  );

  // ---------- Resumen ----------
  const renderReview = () => {
    const cells: ({ day: number } | null)[] = [];
    for (let i = 0; i < 6; i++) cells.push(null);
    for (let n = 1; n <= 30; n++) cells.push({ day: n });

    let pv: { backLabel: string; title: string; intro: string; list: { n: string; f: string; i: number }[]; when?: string; momLabel?: string; moms?: { t: string; play: boolean }[] } = { backLabel: 'Patrones', title: '', intro: '', list: [] };
    if (st.patView === 'week') pv = { ...pv, title: 'Esta semana', intro: 'Muchos de tus highs giraron en torno al tiempo con amigos. Lo más difícil fueron las prisas a principios de semana.' };
    if (st.patView === 'more') pv = { ...pv, title: 'Ideas para ti', intro: 'Salen de lo que te da y te quita energía. Sin presión: quédate solo con lo que te encaje.' };
    if (st.patView === 'src' || st.patView === 'drain') {
      const isSrc = st.patView === 'src';
      const arr = isSrc ? SRC : DRAIN;
      if (st.patItem == null) {
        pv.title = isSrc ? 'Tus fuentes de energía' : 'Lo que te quita energía';
        pv.intro = isSrc ? 'Lo que vuelve una y otra vez en tus highs.' : 'Patrones en tus lows: qué te pesa y cuándo.';
        pv.list = arr.map((it, i) => ({ n: it.n, f: it.f, i }));
      } else {
        pv.backLabel = isSrc ? 'Fuentes de energía' : 'Lo que te quita energía';
        if (isSrc) {
          const it = SRC[st.patItem];
          pv = { ...pv, title: it.n, intro: it.d, when: '', momLabel: 'Tus momentos', moms: it.m.map((t) => ({ t, play: true })) };
        } else {
          const it = DRAIN[st.patItem];
          pv = { ...pv, title: it.n, intro: it.d, when: it.w, momLabel: 'Lo que te ayudó', moms: it.h.map((t) => ({ t, play: false })) };
        }
      }
    }
    const tiles = [
      { id: 'src' as const, title: 'Tus fuentes de energía', teaser: 'Naturaleza, amigos y 2 más', icon: 'leaf-linear' as const, tint: 'rgba(242,180,90,0.14)', ring: GOLD },
      { id: 'drain' as const, title: 'Lo que te quita energía', teaser: 'Prisas, poco sueño y 1 más', icon: 'battery-low-linear' as const, tint: 'rgba(205,191,174,0.12)', ring: '#CDBFAE' },
      { id: 'more' as const, title: 'Ideas para ti', teaser: 'Pequeñas cosas que podrían ayudarte', icon: 'lightbulb-minimalistic-linear' as const, tint: 'rgba(242,180,90,0.14)', ring: GOLD },
    ];
    const CHEV = <span style={sx('color: #9C8F86; display: flex')}><Icon name="alt-arrow-right-linear" size={18} /></span>;

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
                <button type="button" aria-label="Mes anterior" style={sx('width: 36px; height: 36px; border-radius: 18px; border: none; background: transparent; color: #CDBFAE; cursor: pointer; display: flex; align-items: center; justify-content: center')}><Icon name="alt-arrow-left-linear" size={18} /></button>
                <p style={sx('margin: 0; font-size: 15px; font-weight: 700; color: #F5EFE4')}>noviembre 2026</p>
                <button type="button" aria-label="Mes siguiente" style={sx('width: 36px; height: 36px; border-radius: 18px; border: none; background: transparent; color: #CDBFAE; cursor: pointer; display: flex; align-items: center; justify-content: center')}><Icon name="alt-arrow-right-linear" size={18} /></button>
              </div>
              <div style={sx('display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px')}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((wd, i) => (
                  <p key={i} style={sx('margin: 0; text-align: center; font-size: 11px; font-weight: 700; color: #9C8F86')}>{wd}</p>
                ))}
                {cells.map((cl, i) => {
                  if (!cl) return <div key={'b' + i} />;
                  const n = cl.day;
                  const sel = st.selDay === n, today = n === 9, has = n <= 9 && (n === 9 || !!DAYDATA[n]), future = n > 9;
                  return (
                    <div key={n} style={sx('display: flex; justify-content: center')}>
                      <button
                        type="button"
                        aria-label={n + ' de noviembre' + (st.special[n] ? ', día especial' : '')}
                        aria-pressed={sel}
                        onClick={() => update({ selDay: n })}
                        style={sx(`position: relative; width: 40px; height: 40px; border-radius: 20px; border: 1px solid ${today && !sel ? '#F2B45A' : 'transparent'}; background: ${sel ? '#F2B45A' : 'transparent'}; color: ${sel ? '#2B2430' : future ? '#7F736C' : '#F5EFE4'}; font-size: 14px; font-weight: ${today ? 800 : 500}; cursor: pointer; padding: 0`)}
                      >
                        {n}
                        <span aria-hidden="true" style={sx(`position: absolute; left: 50%; bottom: 4px; margin-left: -2px; width: 4px; height: 4px; border-radius: 2px; background: ${sel ? '#2B2430' : '#F2B45A'}; opacity: ${has ? 1 : 0}`)} />
                        {st.special[n] && <span aria-hidden="true" style={sx('position: absolute; right: -3px; top: -4px; color: #F2B45A')}><Icon name="star-bold" size={11} /></span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={sx('padding: 18px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.1); background: rgba(245,239,228,0.04); display: flex; flex-direction: column; gap: 12px; flex-shrink: 0')}>
              <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
                <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 20px")}>{WD[(st.selDay - 1) % 7] + ', ' + st.selDay + ' de noviembre'}</p>
                <button
                  type="button"
                  aria-pressed={selSpecial}
                  onClick={() => update((s) => ({ special: { ...s.special, [s.selDay]: !s.special[s.selDay] } }))}
                  style={sx(`height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid ${selSpecial ? '#F2B45A' : 'rgba(245,239,228,0.2)'}; background: ${selSpecial ? 'rgba(242,180,90,0.18)' : 'transparent'}; color: ${selSpecial ? '#FBE0A0' : '#E6DACB'}; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px`)}
                >
                  <Icon name={selSpecial ? 'star-bold' : 'star-linear'} size={14} />
                  {selSpecial ? 'Día especial' : 'Marcar especial'}
                </button>
              </div>
              {selLines.length > 0 ? selLines.map((sl, i) => (
                <div key={i} style={sx('display: flex; gap: 12px; align-items: flex-start')}>
                  <span aria-hidden="true" style={sx(`margin-top: 5px; width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; background: ${sl.fill}; border: 1.5px solid ${sl.ring}`)} />
                  <div style={sx('display: flex; flex-direction: column; gap: 2px')}>
                    <p style={sx("margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE")}>{sl.label}</p>
                    <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-style: italic; font-weight: 300; font-size: 16px; line-height: 1.4")}>{sl.text}</p>
                  </div>
                </div>
              )) : (
                <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Este día no encendiste la vela. Está bien así.</p>
              )}
            </div>
          </>
        )}

        {st.revTab === 'pat' && !st.patView && (
          <div style={sx('display: flex; flex-direction: column; gap: 10px; flex-shrink: 0')}>
            {tiles.map((tl) => (
              <button key={tl.id} type="button" onClick={() => update({ patView: tl.id, patItem: null })} style={sx('width: 100%; padding: 18px 16px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.08); background: rgba(245,239,228,0.05); color: #F5EFE4; display: flex; gap: 14px; align-items: center; text-align: left; cursor: pointer')}>
                <span aria-hidden="true" style={sx(`width: 42px; height: 42px; border-radius: 14px; flex-shrink: 0; background: ${tl.tint}; color: ${tl.ring}; display: flex; align-items: center; justify-content: center`)}><Icon name={tl.icon} size={22} /></span>
                <span style={sx('display: flex; flex-direction: column; gap: 3px; flex-grow: 1; min-width: 0')}>
                  <span style={sx('font-size: 16px; font-weight: 700')}>{tl.title}</span>
                  <span style={sx('font-size: 13px; line-height: 1.4; color: #CDBFAE')}>{tl.teaser}</span>
                </span>
                {CHEV}
              </button>
            ))}
          </div>
        )}

        {st.revTab === 'pat' && st.patView && (
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
                  <button key={li.n} type="button" onClick={() => update({ patItem: li.i })} style={sx('width: 100%; padding: 16px; border: none; border-bottom: 1px solid rgba(245,239,228,0.06); background: transparent; color: #F5EFE4; display: flex; gap: 12px; align-items: center; text-align: left; cursor: pointer')}>
                    <span style={sx('display: flex; flex-direction: column; gap: 2px; flex-grow: 1')}>
                      <span style={sx('font-size: 16px; font-weight: 700')}>{li.n}</span>
                      <span style={sx('font-size: 13px; color: #CDBFAE')}>{li.f}</span>
                    </span>
                    {CHEV}
                  </button>
                ))}
              </div>
            )}
            {st.patItem != null && (
              <>
                {pv.when && (
                  <div style={sx('padding: 16px 18px; border-radius: 20px; background: rgba(245,239,228,0.05); display: flex; flex-direction: column; gap: 4px')}>
                    <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>Cuándo</p>
                    <p style={sx('margin: 0; font-size: 15px; line-height: 1.5')}>{pv.when}</p>
                  </div>
                )}
                <p style={sx('margin: 4px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{pv.momLabel}</p>
                {pv.moms?.map((mo) => (
                  <div key={mo.t} style={sx('padding: 14px 16px; border-radius: 18px; background: rgba(245,239,228,0.05); display: flex; gap: 12px; align-items: center')}>
                    {mo.play && (
                      <span aria-hidden="true" style={sx('width: 30px; height: 30px; border-radius: 15px; border: 1.5px solid rgba(245,239,228,0.4); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #F5EFE4')}><Icon name="play-bold" size={12} /></span>
                    )}
                    <span style={sx("font-family: 'Fraunces', serif; font-style: italic; font-weight: 300; font-size: 16px; line-height: 1.4")}>{mo.t}</span>
                  </div>
                ))}
              </>
            )}
            {st.patView === 'more' && MORE.map((t, i) => {
              if (st.moreHidden[i]) return null;
              const on = !!st.moreOn[i];
              return (
                <div key={i} style={sx('padding: 18px; border-radius: 20px; border: 1px solid rgba(242,180,90,0.3); display: flex; flex-direction: column; gap: 14px')}>
                  <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 18px; line-height: 1.45")}>{t}</p>
                  <div style={sx('display: flex; gap: 10px')}>
                    <button type="button" aria-pressed={on} onClick={() => update((s) => ({ moreOn: { ...s.moreOn, [i]: !s.moreOn[i] } }))} style={sx(`height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid #F2B45A; background: ${on ? '#F2B45A' : 'transparent'}; color: ${on ? '#2B2430' : '#FBE0A0'}; font-size: 14px; font-weight: 700; cursor: pointer`)}>{on ? '✓ Lo intentaré' : 'Lo intentaré'}</button>
                    <button type="button" onClick={() => update((s) => ({ moreHidden: { ...s.moreHidden, [i]: true } }))} style={sx('height: 40px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer')}>Ahora no</button>
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
  const renderHighs = () => (
    <div style={sx('position: absolute; left: 20px; right: 20px; top: 104px; bottom: 100px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; -webkit-overflow-scrolling: touch')}>
      <h1 style={sx(H1 + '; font-size: 30px')}>Tus highs</h1>
      <p style={sx('margin: 4px 0 0; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #F2B45A')}>Lo que viene</p>
      {UPCOMING.map((up) => (
        <div key={up.t} style={sx('padding: 12px 14px; border-radius: 20px; border: 1px solid rgba(242,180,90,0.3); background: rgba(242,180,90,0.06); display: flex; gap: 14px; align-items: center; flex-shrink: 0')}>
          <div style={sx('width: 48px; height: 52px; border-radius: 14px; background: rgba(242,180,90,0.16); flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center')}>
            <span style={sx('font-size: 18px; font-weight: 700; color: #FBE0A0; line-height: 1')}>{up.d}</span>
            <span style={sx('font-size: 11px; color: #E6DACB; text-transform: uppercase; letter-spacing: 0.06em')}>{up.m}</span>
          </div>
          <div style={sx('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.35')}>{up.t}</p>
            <p style={sx('margin: 0; font-size: 12px; color: #CDBFAE')}>{up.s}</p>
          </div>
        </div>
      ))}
      <p style={sx('margin: 14px 0 0; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>Lo que fue</p>
      <div style={sx('padding: 16px; border-radius: 20px; border: 1px solid rgba(242,180,90,0.35); display: flex; gap: 14px; align-items: center; flex-shrink: 0')}>
        <span style={sx('width: 40px; height: 40px; border-radius: 20px; background: #F2B45A; color: #2B2430; flex-shrink: 0; display: flex; align-items: center; justify-content: center')}><Icon name="play-bold" size={16} /></span>
        <div style={sx('display: flex; flex-direction: column; gap: 2px')}>
          <p style={sx('margin: 0; font-size: 12px; color: #F2B45A; font-weight: 700')}>Hace un año</p>
          <p style={sx('margin: 0; font-size: 15px')}>Una tarde en el lago con amigos</p>
        </div>
      </div>
      {highsList.map((hi, i) => (
        <div key={i} style={sx('padding: 14px 16px; border-radius: 20px; background: rgba(245,239,228,0.06); display: flex; gap: 14px; align-items: center; flex-shrink: 0')}>
          <span style={sx('width: 36px; height: 36px; border-radius: 18px; border: 1.5px solid rgba(245,239,228,0.4); color: #F5EFE4; flex-shrink: 0; display: flex; align-items: center; justify-content: center')}><Icon name="play-bold" size={13} /></span>
          <div style={sx('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
            <p style={sx('margin: 0; font-size: 12px; color: #CDBFAE')}>{hi.d}</p>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.4')}>{hi.t}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const jumps = RECURRING ? JUMPS_RECURRING : JUMPS_FIRST;
  const qs = (modo: boolean) => {
    const p = new URLSearchParams();
    if (modo) p.set('modo', 'recurrente');
    if (params.get('respira')) p.set('respira', params.get('respira')!);
    const s = p.toString();
    return '/' + (s ? '?' + s : '');
  };
  const credit = (
    <p className="credit">
      Prototipo · Iconos: <a href="https://www.figma.com/community/file/1166831539721848736" target="_blank" rel="noopener noreferrer">Solar</a> de 480 Design,{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
    </p>
  );
  const jumpButtons = (
    <div className="testbar-row">
      {jumps.map(([label, target]) => (
        <button key={target} type="button" className="jump" aria-pressed={target === ph} onClick={() => jump(target)}>{label}</button>
      ))}
    </div>
  );
  const modeLinks = (
    <div className="testbar-links">
      <a href={qs(false)} aria-current={!RECURRING ? 'page' : undefined}>Primera vez</a>
      <a href={qs(true)} aria-current={RECURRING ? 'page' : undefined}>Uso recurrente</a>
      <span>Respiración: {BREATH_SECONDS} s (?respira=8)</span>
    </div>
  );

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
      {/* Raum-Glow */}
      <div aria-hidden="true" style={sx(`position: absolute; inset: 0; background: radial-gradient(circle at 50% ${glowPx}px, rgba(242,180,90,0.34) 0%, rgba(192,138,107,0.14) ${Math.round(0.3 * 844 * v)}px, rgba(43,36,48,0) ${Math.round(0.64 * 844 * v)}px); opacity: ${showCandle ? warmBg : 0}; transition: opacity 1.6s ease`)} />

      {ph === 'lock' && (
        <div aria-hidden="true" style={sx('position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% 0%, #3A3140 0%, #241E29 55%, #1A1620 100%)')} />
      )}

      {/* Inhaltsspalte 390 px */}
      <div style={{ position: 'absolute', left: colLeft, width: 390, top: 0, height: H }}>
        {ph === 'lock' && (
          <>
          <div style={sx('position: absolute; left: 0; right: 0; top: 96px; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #F5EFE4')}>
            <p style={sx('margin: 0; font-size: 16px; font-weight: 600; color: #E6DACB')}>lunes, 9 de noviembre</p>
            <p style={sx('margin: 0; font-size: 84px; font-weight: 300; line-height: 1; letter-spacing: -0.02em')}>21:30</p>
          </div>
          <button type="button" onClick={() => go('home')} aria-label="Abrir notificación de Vela" style={sx(`position: absolute; left: 14px; right: 14px; top: ${T(300)}px; padding: 14px 16px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.12); background: rgba(245,239,228,0.1); color: #F5EFE4; display: flex; gap: 12px; align-items: flex-start; text-align: left; cursor: pointer; -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px)`)}>
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
          <div style={sx('position: absolute; top: 54px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: center')}>
            <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Lunes, 9 de noviembre</p>
            <button type="button" aria-label="Ajustes" style={sx(BACK_BTN)}><Icon name="tuning-2-linear" size={20} /></button>
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
            showWickHint={isHome && !st.done}
            canHold={(isHome && !st.done) || ph === 'lighting'}
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
            <button type="button" onClick={() => go('home')} style={sx('width: 100%; min-height: 58px; border-radius: 29px; border: none; background: #F2B45A; color: #2B2430; font-size: 17px; font-weight: 700; cursor: pointer; flex-shrink: 0')}>Enciende tu primera luz</button>
            <p style={sx('margin: 0; font-size: 13px; color: #CDBFAE')}>Tus momentos son solo tuyos.</p>
          </div>
        )}

        {isHome && !st.done && (
          <div style={sx(`position: absolute; left: 32px; right: 32px; top: ${T(550)}px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; pointer-events: none`)}>
            <h1 style={sx(H1 + '; font-size: 30px; line-height: 1.22')}>Aquí estoy, cuando quieras.</h1>
            <p style={sx('margin: 0; padding: 8px 16px; border-radius: 16px; background: rgba(245,239,228,0.07); font-size: 14px; color: #E6DACB')}>Mantén pulsada la mecha</p>
          </div>
        )}

        {isHome && st.done && (
          <div style={sx('position: absolute; left: 28px; right: 28px; top: 112px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px')}>
            <h1 style={sx(H1 + '; font-size: 30px')}>Que descanses.</h1>
            <div style={sx('width: 100%; padding: 16px 18px; border-radius: 20px; background: rgba(245,239,228,0.06); text-align: left; display: flex; flex-direction: column; gap: 10px')}>
              <p style={sx('margin: 0; font-size: 13px; font-weight: 700; color: #E6DACB')}>Tu día</p>
              {(todayLines.length ? todayLines : days.map((d) => ({ ring: d.ring, text: d.items[0] }))).map((m, i) => (
                <div key={i} style={sx('display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 1.45; color: #F5EFE4')}>
                  <span style={sx(`width: 8px; height: 8px; border-radius: 4px; margin-top: 6px; flex-shrink: 0; background: ${m.ring}`)} />{m.text}
                </div>
              ))}
            </div>
            <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Mañana por la noche te espera tu luz.</p>
            <div style={sx('display: flex; gap: 10px; justify-content: center; flex-wrap: wrap')}>
              <button type="button" onClick={() => { update({ done: false }); go('mirror'); }} style={sx('height: 44px; padding: 0 18px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.2); background: transparent; color: #E6DACB; font-size: 14px; cursor: pointer')}>Ver tu día</button>
              <button type="button" onClick={startOver} style={sx('height: 44px; padding: 0 18px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.2); background: transparent; color: #E6DACB; font-size: 14px; cursor: pointer')}>Volver al inicio</button>
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
                const on = st.remindTime === tm;
                return <button key={tm} type="button" aria-pressed={on} onClick={() => update({ remindTime: tm })} style={sx(`min-width: 84px; height: 46px; border-radius: 23px; border: 1px solid ${on ? GOLD : 'rgba(245,239,228,0.22)'}; background: ${on ? 'rgba(242,180,90,0.18)' : 'transparent'}; color: #F5EFE4; font-size: 15px; font-weight: 600; cursor: pointer`)}>{tm}</button>;
              })}
            </div>
            <p style={sx('margin: 0; font-size: 13px; color: #CDBFAE')}>Solo una vez por la noche. Puedes cambiarlo cuando quieras.</p>
            <div style={sx('flex-grow: 1')} />
            <button type="button" onClick={() => { update({ firstTime: false }); go('now'); }} style={sx(PRIMARY + '; flex-shrink: 0')}>Sí, por favor</button>
            <button type="button" onClick={() => { update({ firstTime: false }); go('now'); }} style={sx('min-height: 44px; border: none; background: transparent; color: #E6DACB; font-size: 15px; cursor: pointer')}>Mejor no</button>
          </div>
        )}

        {ph === 'now' && (
          <>
            <button type="button" aria-label="Volver a tu día" onClick={() => { update({ done: false }); go('mirror'); }} style={sx('position: absolute; left: 24px; top: 54px; z-index: 2; ' + BACK_BTN)}><Icon name="alt-arrow-left-linear" size={20} /></button>
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
      </div>

      {(ph === 'stay' || ph === 'journal') && (
        <button type="button" aria-label="Volver a las opciones" onClick={() => go('now')} style={sx('position: absolute; inset: 0; border: none; background: transparent; cursor: pointer')} />
      )}

      {showNav && (
        <nav aria-label="Navegación principal" style={sx(`position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; padding: 12px 24px 30px; border-top: 1px solid rgba(245,239,228,0.08); background: ${bg}; transition: background 1.6s ease`)}>
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

      {/* Test-Hilfen */}
      {ph !== 'intro' && (
        <button type="button" aria-label="Reiniciar prototipo" title="Reiniciar prototipo" onClick={reset} style={sx(`position: absolute; left: 50%; top: 6px; margin-left: -22px; width: 44px; height: 44px; border-radius: 22px; border: none; background: transparent; color: rgba(245,239,228,0.45); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 6`)}>
          <Icon name="restart-linear" size={18} />
        </button>
      )}
      {mobile && (
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
        <p className="testbar-title">Ir directamente a</p>
        {jumpButtons}
        {modeLinks}
        {credit}
      </div>
    </div>
  );
}
