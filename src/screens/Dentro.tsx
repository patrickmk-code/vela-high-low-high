// Tab „Dentro“ – Introspección (ab 14 Nächten), Prototipo v1 Abschnitt 11. Plus Bottom-Sheet „Apoyo“.
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../ctx';
import { sx } from '../sx';
import { Icon } from '../Icon';
import { BACKLINK, GLASS, ITALIC, Spiral, TabPage } from '../ui';
import { INQ, INQ_FILO, INTH, SUPPORT, type InQ } from '../demo';
import { VoiceCapture, sttSupported } from '../lib/speech';
import { uid } from '../lib/store';

const SRC_STYLE: Record<InQ['src'], { k: string; c: string; tint: string }> = {
  highs: { k: 'De tus highs', c: '#F2B45A', tint: 'rgba(242,180,90,0.14)' },
  lows: { k: 'De tus lows', c: '#9FB4C8', tint: 'rgba(159,180,200,0.14)' },
  filo: { k: 'Para pensar despacio', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
};

function BigOrb() {
  return (
    <div aria-hidden="true" style={sx('position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center')}>
      <span className="orb" style={sx('position: absolute; inset: -40px; border-radius: 50%; background: radial-gradient(circle, rgba(237,227,248,0.45) 0%, rgba(201,182,228,0.12) 45%, rgba(201,182,228,0) 70%)')} />
      <span className="breathe" style={sx('position: relative; width: 96px; height: 96px; border-radius: 50%; background: rgba(237,227,248,0.1); border: 1px solid rgba(237,227,248,0.5); color: #F4EEFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(201,182,228,0.45)')}><Spiral size={40} sw={1.3} /></span>
    </div>
  );
}

export function Dentro() {
  const { data, setData, ui, update, today, nights, demo } = useApp();
  const inward = data.inward.date === today ? data.inward : { ...data.inward, date: today, done: 0 };
  const theme = inward.theme || 'todo';

  // Fragenpool: persönliche Fragen von Claude, sonst Demo (Testmodus) bzw. philosophische Fragen
  const aiQs: InQ[] = (data.patterns?.result.questions ?? []).map((q) => ({ src: q.src, th: q.theme, q: q.q, why: q.why, ...SRC_STYLE[q.src] }));
  const pool: InQ[] = demo ? INQ : aiQs.length ? [...aiQs, ...INQ_FILO] : INQ_FILO;
  const pick = (() => {
    const byTheme = theme === 'todo' ? pool : pool.filter((q) => q.th === theme);
    // täglich andere Reihenfolge, stabil über den Tag
    const seed = Number(today.replace(/-/g, '')) % 97;
    const rot = (arr: InQ[]) => arr.map((q, i) => ({ q, r: (i * 37 + seed) % 101 })).sort((a, b) => a.r - b.r).map((x) => x.q);
    let list: InQ[];
    if (theme === 'todo') {
      // je eine aus den Highs, den Lows und eine zum Nachdenken – soweit vorhanden
      const r = rot(pool);
      list = (['highs', 'lows', 'filo'] as const).map((src) => r.find((q) => q.src === src)).filter((q): q is InQ => !!q);
    } else list = rot(byTheme);
    for (const q of rot(pool)) if (list.length < 3 && !list.includes(q)) list.push(q);
    return list.slice(0, 3);
  })();

  const setInward = (patch: Partial<typeof inward>) => setData((d) => ({ ...d, inward: { ...inward, ...patch } }));
  const first = !inward.seen;

  // ---------- Fragen ----------
  if (ui.inStage === 'ask') {
    const q = pick[Math.min(ui.inQ, 2)];
    const next = (skip: boolean) => {
      const a = ui.inAns.trim();
      if (!skip && a) setData((d) => ({ ...d, reflections: [...d.reflections, { id: uid(), date: today, k: q.k, c: q.c, q: q.q, a }] }));
      const nd = ui.inQ + 1;
      setInward({ done: nd, seen: true });
      if (nd < 3) update({ inQ: nd, inAns: '' });
      else update({ inStage: 'done', inAns: '' });
    };
    return (
      <>
        <div style={sx('position: absolute; left: 20px; right: 20px; top: 70px; bottom: 120px; display: flex; flex-direction: column; gap: 18px')}>
          <div style={sx('display: flex; justify-content: space-between; align-items: center')}>
            <div role="img" aria-label={`Pregunta ${ui.inQ + 1} de 3`} style={sx('display: flex; gap: 8px')}>
              {[0, 1, 2].map((k) => <span key={k} style={sx(`width: ${k === ui.inQ ? 28 : 10}px; height: 6px; border-radius: 3px; background: ${k <= ui.inQ ? '#E9DCFA' : 'rgba(245,239,228,0.18)'}; box-shadow: ${k === ui.inQ ? '0 0 10px rgba(201,182,228,0.8)' : 'none'}; transition: all .6s ease`)} />)}
            </div>
            <button type="button" onClick={() => next(true)} style={sx('height: 44px; padding: 0 8px; border: none; background: transparent; color: #9C8F86; font-size: 14px; cursor: pointer; font-family: inherit')}>Saltar</button>
          </div>
          <div key={'q' + ui.inQ} className="stagein" style={sx('display: flex; flex-direction: column; gap: 16px; min-height: 0')}>
            <div style={sx(`${GLASS}; position: relative; overflow: hidden; padding: 26px 22px; border-radius: 28px; background: linear-gradient(165deg, ${q.tint} 0%, rgba(245,239,228,0.04) 75%); border: 1px solid rgba(245,239,228,0.12); min-height: 260px; display: flex; flex-direction: column; gap: 16px`)}>
              <span aria-hidden="true" className="breathe" style={sx(`position: absolute; right: -40px; top: -40px; width: 170px; height: 170px; border-radius: 50%; background: radial-gradient(circle, ${q.tint} 0%, rgba(0,0,0,0) 70%)`)} />
              <span style={sx(`position: relative; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${q.c}`)}><span style={sx(`width: 8px; height: 8px; border-radius: 4px; background: ${q.c}; box-shadow: 0 0 8px ${q.c}`)} />{q.k}</span>
              <p style={sx(`position: relative; ${ITALIC.replace('margin: 0; ', '')}; margin: 6px 0 0; font-size: 27px; line-height: 1.3`)}>{q.q}</p>
              <p style={sx('position: relative; margin: auto 0 0; font-size: 13px; line-height: 1.45; color: #9C8F86')}>{q.why}</p>
            </div>
            <textarea aria-label="Tu respuesta" placeholder="Escribe lo que te venga, aunque sea poco …" value={ui.inAns} onChange={(e) => update({ inAns: e.target.value })}
              style={sx("width: 100%; height: 96px; padding: 14px 16px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.14); background: rgba(52,44,58,0.85); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; line-height: 1.5; resize: none")} />
          </div>
        </div>
        <div style={sx('position: absolute; left: 20px; right: 20px; bottom: 40px; display: flex; gap: 10px; align-items: center')}>
          <MicButton key={'mic' + ui.inQ} onText={(t) => update((s) => ({ inAns: (s.inAns ? s.inAns.trimEnd() + ' ' : '') + t }))} />
          <button type="button" onClick={() => next(false)} style={sx('flex-grow: 1; height: 52px; border-radius: 26px; border: none; background: #E6CDA3; color: #2B2430; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit')}>{ui.inQ < 2 ? 'Siguiente' : 'Terminar'}</button>
        </div>
      </>
    );
  }

  // ---------- Abschluss ----------
  if (ui.inStage === 'done') {
    return (
      <div className="stagein" style={sx('position: absolute; left: 32px; right: 32px; top: 170px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px')}>
        <BigOrb />
        <h1 style={sx("margin: 10px 0 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 32px; line-height: 1.2")}>Tres pasos hacia ti</h1>
        <p style={sx('margin: 0; font-size: 16px; line-height: 1.55; color: #DCD0EA')}>Guardé tus respuestas en «Tus reflexiones». Mañana te esperan tres preguntas nuevas.</p>
        <button type="button" onClick={() => update({ inStage: 'home' })} style={sx('margin-top: 8px; height: 52px; padding: 0 30px; border-radius: 26px; border: none; background: #E6CDA3; color: #2B2430; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit')}>Volver</button>
      </div>
    );
  }

  // ---------- Tus reflexiones ----------
  if (ui.inStage === 'refl') {
    const log = [...data.reflections].reverse();
    return (
      <TabPage fadeTop={false}>
        <button type="button" onClick={() => update({ inStage: 'home' })} style={sx(BACKLINK)}><Icon name="alt-arrow-left-linear" size={18} />Introspección</button>
        <h2 style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 32px")}>Tus reflexiones</h2>
        <p style={sx('margin: -8px 0 0; font-size: 15px; color: #CDBFAE')}>Lo que te has respondido. Solo para ti.</p>
        {log.length === 0 && <div style={sx(`${GLASS}; padding: 18px; border-radius: 22px`)}><p style={sx('margin: 0; font-size: 15px; color: #9C8F86')}>Tus respuestas aparecerán aquí.</p></div>}
        {log.map((r) => (
          <div key={r.id} style={sx(`${GLASS}; padding: 18px; border-radius: 22px; display: flex; flex-direction: column; gap: 8px`)}>
            <span style={sx(`display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${r.c}`)}><span style={sx(`width: 7px; height: 7px; border-radius: 4px; background: ${r.c}; box-shadow: 0 0 6px ${r.c}`)} />{r.k} · {r.date === today ? 'hoy' : r.date}</span>
            <p style={sx(ITALIC + '; font-size: 18px; line-height: 1.35')}>{r.q}</p>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #E6DACB')}>{r.a}</p>
          </div>
        ))}
      </TabPage>
    );
  }

  // ---------- Startseite ----------
  const done = inward.done;
  return (
    <>
      <div className="scroller" style={sx('position: absolute; inset: 0; overflow-y: auto; scrollbar-width: none')}>
      <div className="stagein" style={sx('padding: 96px 28px 140px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px')}>
        <BigOrb />
        <p style={sx('margin: 14px 0 0; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #E9DCFA')}>{first ? (nights === 14 ? 'Nuevo · Noche 14' : 'Nuevo · Introspección') : `Introspección · Día ${nights}`}</p>
        <h1 style={sx("margin: -6px 0 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 32px; line-height: 1.18; text-shadow: 0 0 24px rgba(201,182,228,0.5)")}>{first ? 'Bienvenido a la Introspección' : done >= 3 ? 'Por hoy, suficiente' : 'Tu momento para mirar dentro'}</h1>
        <p style={sx('margin: 0; font-size: 16px; line-height: 1.55; color: #DCD0EA')}>{done >= 3 ? 'Has respondido tus tres preguntas de hoy. Mañana te esperan tres nuevas.' : first ? 'Cada día, tres preguntas hechas a partir de tus highs y tus lows. Sin prisa, sin respuestas correctas.' : 'Tres preguntas para hoy. Una a una, a tu ritmo.'}</p>
        <div aria-label="Preguntas de hoy" style={sx('display: flex; gap: 10px; align-items: center')}>
          {[0, 1, 2].map((k) => <span key={k} style={sx(`width: 10px; height: 10px; border-radius: 5px; background: ${k < done ? '#EDE3F8' : 'transparent'}; box-shadow: ${k < done ? '0 0 10px rgba(201,182,228,0.9)' : 'none'}; border: 1px solid rgba(237,227,248,0.4)`)} />)}
        </div>
        {done < 3 && (
          <>
            <button type="button" onClick={() => { setInward({ seen: true }); update({ inStage: 'ask', inQ: done, inAns: '' }); }} style={sx('height: 52px; padding: 0 34px; border-radius: 26px; border: none; background: #E6CDA3; color: #2B2430; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 0 24px -4px rgba(230,205,163,0.6)')}>{done > 0 ? `Seguir · ${done + 1} de 3` : 'Empezar'}</button>
            <div style={sx('display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 2px')}>
              {INTH.map((t) => {
                const on = t.id === theme;
                return <button key={t.id} type="button" aria-pressed={on} onClick={() => setInward({ theme: t.id })} style={sx(`height: 36px; padding: 0 13px; border-radius: 18px; border: 1px solid ${on ? 'rgba(201,182,228,0.6)' : 'rgba(245,239,228,0.12)'}; background: ${on ? 'rgba(201,182,228,0.2)' : 'transparent'}; color: ${on ? '#EDE3F8' : '#9C8F86'}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .4s ease`)}>{t.label}</button>;
              })}
            </div>
          </>
        )}
      <button type="button" onClick={() => update({ inStage: 'refl' })} style={sx(`${GLASS}; align-self: stretch; margin-top: 18px; padding: 14px 16px; border-radius: 20px; display: flex; align-items: center; gap: 12px; color: #F5EFE4; text-align: left; cursor: pointer; font-family: inherit`)}>
        <span aria-hidden="true" style={sx('width: 40px; height: 40px; border-radius: 20px; flex-shrink: 0; background: rgba(201,182,228,0.14); color: #DCCDF0; display: flex; align-items: center; justify-content: center')}><Icon name="notebook-linear" size={20} /></span>
        <span style={sx('display: flex; flex-direction: column; gap: 2px; flex-grow: 1')}><span style={sx('font-size: 15px; font-weight: 700')}>Tus reflexiones</span><span style={sx('font-size: 13px; color: #CDBFAE')}>{data.reflections.length ? `${data.reflections.length} ${data.reflections.length === 1 ? 'respuesta guardada' : 'respuestas guardadas'}` : 'Aquí guardo lo que te respondas'}</span></span>
        <span style={sx('color: #9C8F86; display: flex')}><Icon name="alt-arrow-right-linear" size={16} /></span>
      </button>
      </div>
      </div>
    </>
  );
}

/** Mikrofon für Introspección-Antworten: spricht man, wird der Text angehängt. */
function MicButton({ onText }: { onText: (t: string) => void }) {
  const [rec, setRec] = useState(false);
  const cap = useRef<VoiceCapture | null>(null);
  // Beim Verlassen der Frage (Saltar, Siguiente, Tab-Wechsel) Mikrofon sofort freigeben
  useEffect(() => () => { cap.current?.cancel(); cap.current = null; }, []);
  if (!sttSupported()) return null;
  const toggle = async () => {
    if (rec && cap.current) {
      const c = cap.current; cap.current = null; setRec(false);
      const r = await c.stop();
      if (r.transcript) onText(r.transcript);
      return;
    }
    const c = new VoiceCapture({ onError: () => { cap.current = null; setRec(false); } });
    cap.current = c; setRec(true);
    const ok = await c.start();
    if (!ok) { cap.current = null; setRec(false); }
  };
  return (
    <button type="button" aria-label={rec ? 'Terminar de hablar' : 'Responder hablando'} aria-pressed={rec} onClick={toggle}
      style={sx(`width: 52px; height: 52px; border-radius: 26px; border: 1px solid ${rec ? '#E6CDA3' : 'rgba(245,239,228,0.2)'}; background: ${rec ? '#E6CDA3' : 'transparent'}; color: ${rec ? '#2B2430' : '#E6DACB'}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0`)}>
      {rec ? <span style={sx('width: 14px; height: 14px; border-radius: 4px; background: #2B2430')} /> : <Icon name="microphone-3-linear" size={22} />}
    </button>
  );
}

export function SupportSheet({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={sx('position: absolute; inset: 0; z-index: 9; background: rgba(6,5,10,0.6); display: flex; align-items: flex-end')}>
      <div role="dialog" aria-label="Cuando no sabes seguir" className="softin" onClick={(e) => e.stopPropagation()} style={sx('width: 100%; padding: 22px 20px 34px; border-radius: 28px 28px 0 0; background: #1E1A2C; border-top: 1px solid rgba(159,180,200,0.25)')}>
        <div style={sx('display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px')}>
          <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 24px")}>Cuando no sabes seguir</p>
          <button type="button" aria-label="Cerrar" onClick={onClose} style={sx('width: 40px; height: 40px; border-radius: 20px; border: none; background: rgba(245,239,228,0.08); color: #E6DACB; font-size: 18px; cursor: pointer')}>×</button>
        </div>
        <p style={sx('margin: 0 0 8px; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>A veces no basta con una vela. Pedir ayuda también es cuidarte.</p>
        {SUPPORT.map((s) => (
          <a key={s.t} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={sx('min-height: 56px; padding: 8px 0; border-top: 1px solid rgba(245,239,228,0.07); display: flex; gap: 14px; align-items: center; color: #F5EFE4; text-decoration: none')}>
            <span aria-hidden="true" style={sx('width: 38px; height: 38px; border-radius: 19px; flex-shrink: 0; background: rgba(159,180,200,0.14); color: #C9D6E2; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800')}>{s.ic}</span>
            <span style={sx('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0')}><span style={sx('font-size: 15px; font-weight: 700')}>{s.t}</span><span style={sx('font-size: 13px; line-height: 1.4; color: #CDBFAE')}>{s.s}</span></span>
          </a>
        ))}
      </div>
    </div>
  );
}
