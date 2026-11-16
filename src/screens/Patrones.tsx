// Tab „Patrones“ – wächst mit den Nächten (Día 0/1 · 3 · 5 · 7 · 14+), Prototipo v1 Abschnitt 10.
import { useApp } from '../ctx';
import { sx } from '../sx';
import { Icon } from '../Icon';
import type { IconName } from '../icons.generated';
import { BACKLINK, CARD, GLASS, H1, INPUT, ITALIC, LABEL, Orb, PageHead, Row, Spiral, TabPage, Twinkles, type Tone } from '../ui';
import { DEMO_ENERGY, DEMO_MIRROR, DEMO_WEEK, type EnergyItem } from '../demo';
import { doneEntries, lowStreak, topWords, weekBars, cap1 } from '../lib/insights';
import { relLabel } from '../lib/dates';
import type { PatternItem } from '../lib/store';


type Detail =
  | { kind: 'energy' }
  | { kind: 'item'; item: PatternItem; src: boolean }
  | { kind: 'week' }
  | { kind: 'lows' }
  | { kind: 'more' };

interface ListRow { title: string; sub: string; tone: Tone; icon: IconName; detail: Detail; preview?: boolean; unlock?: number }

export function Patrones() {
  const { data, setData, ui, update, nights: N, demo, today, playBtn, speak, retryPatterns, tabGo } = useApp();
  const entries = doneEntries(data);
  const patterns = data.patterns?.result ?? null;

  // ---------- Energie-Einträge (Demo, KI oder lokale Wörter) ----------
  const energyReal: EnergyItem[] = (() => {
    if (demo) return N >= 7 ? DEMO_ENERGY[N >= 14 ? '14' : '7'] : [];
    if (!patterns && entries.length < 3) return [];
    const n = entries.length;
    if (patterns) {
      const map = (arr: PatternItem[], k: 's' | 'd'): EnergyItem[] => arr.slice(0, 4).map((p) => {
        const c = p.count ?? p.quotes.length;
        return [p.name, c, p.frequency || (k === 's' ? 'Te da energía' : 'Te pesa'), `${p.when ? p.when + ' · ' : ''}Aparece en ${c} de tus ${n} ${k === 's' ? 'highs' : 'lows'}.`, k];
      });
      return [...map(patterns.sources, 's'), ...map(patterns.drains, 'd')];
    }
    return [
      ...topWords(entries, 'high', 3).map(([w, c]): EnergyItem => [cap1(w), c, `Aparece en ${c} de tus ${n} highs.`, '', 's']),
      ...topWords(entries, 'low', 3).map(([w, c]): EnergyItem => [cap1(w), c, `Aparece en ${c} de tus ${n} lows.`, '', 'd']),
    ];
  })();
  const energyPreview = energyReal.length === 0;
  const energy: EnergyItem[] = energyPreview ? DEMO_ENERGY['14'] : energyReal;

  const supportBtn = (
    <button type="button" onClick={() => update({ supOpen: true })} style={sx('height: 36px; padding: 0 14px; border-radius: 16px; background: rgba(159,180,200,0.12); border: 1px solid rgba(159,180,200,0.25); color: #C9D6E2; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; flex-shrink: 0')}>
      <Icon name="heart-linear" size={14} />Apoyo
    </button>
  );
  const stageText = N >= 14 ? 'Dos semanas contigo. Esto es lo que veo.' : N >= 7 ? 'Tus patrones están aquí. Crecen contigo.' : 'Tu espejo. Crece contigo, noche a noche.';
  const head = <PageHead label={`Día ${N}`} title="Patrones" text={stageText} right={supportBtn} />;

  // ---------- Introspección-Teaser, Leiste und Camino ----------
  const introBar = (
    <button type="button" onClick={() => tabGo('inward')} style={sx(`${GLASS}; min-height: 56px; padding: 12px 16px; border-radius: 20px; display: flex; align-items: center; gap: 10px; color: #F5EFE4; text-align: left; font-family: inherit; cursor: pointer`)}>
      <Orb size={30} state="on" tone="lila"><Spiral size={15} /></Orb>
      <span style={sx('flex-grow: 1; display: flex; flex-direction: column; gap: 2px')}>
        <span style={sx('font-size: 15px; font-weight: 700')}>Introspección</span>
        <span style={sx('font-size: 12px; color: #E9DCFA')}>Ya disponible · ábrelo en «Dentro»</span>
      </span>
      <span style={sx('color: #9C8F86; display: flex')}><Icon name="alt-arrow-right-linear" size={16} /></span>
    </button>
  );

  const camino = (() => {
    const steps = [
      { n: 1, t: 'Tus noches', s: 'Highs y lows, guardados.', icon: 'document-text-linear' as IconName },
      { n: 7, t: 'Tus patrones', s: 'Qué te llena y qué te pesa.', icon: 'leaf-linear' as IconName },
      { n: 14, t: 'Tu espejo', s: 'Dos semanas tuyas, en pocas palabras.', icon: 'moon-stars-linear' as IconName },
    ];
    const nextIdx = steps.findIndex((s) => N < s.n);
    const fill = N >= 14 ? 160 : N >= 7 ? 80 + ((N - 7) / 7) * 80 : N >= 1 ? ((N - 1) / 6) * 80 : 0;
    return (
      <div style={sx(`${GLASS}; padding: 16px 18px 10px; border-radius: 22px; flex-shrink: 0`)}>
        <div style={sx('display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px')}>
          <p style={sx(LABEL)}>Tu camino</p>
          <p style={sx('margin: 0; font-size: 12px; color: #E6CDA3')}>Hoy · noche {N}</p>
        </div>
        <div style={sx('position: relative')}>
          <span aria-hidden="true" style={sx('position: absolute; left: 19px; top: 40px; width: 2px; height: 160px; background: rgba(245,239,228,0.1)')} />
          <span aria-hidden="true" style={sx(`position: absolute; left: 19px; top: 40px; width: 2px; height: ${fill}px; background: linear-gradient(to bottom, #E6CDA3, #F6DEAA); box-shadow: 0 0 8px rgba(246,222,170,0.6); transition: height 1s ease`)} />
          {N > 0 && N < 14 && <span aria-hidden="true" style={sx(`position: absolute; left: 15px; top: ${40 + fill - 5}px; width: 10px; height: 10px; border-radius: 5px; background: #F6E3C0; box-shadow: 0 0 10px 3px rgba(246,222,170,0.7)`)} />}
          {steps.map((s, i) => {
            const done = N >= s.n, next = i === nextIdx;
            const ic = s.icon ? <Icon name={s.icon} size={18} /> : <Spiral size={18} />;
            return (
              <div key={s.n} style={sx('position: relative; height: 80px; display: flex; align-items: center; gap: 14px')}>
                <Orb size={40} state={done ? 'on' : next ? 'next' : 'off'}>{done ? <Icon name="check-circle-linear" size={18} /> : ic}</Orb>
                <div style={sx('flex-grow: 1; min-width: 0')}>
                  <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9C8F86')}>Noche {s.n}</p>
                  <p style={sx(`margin: 1px 0 0; font-size: 16px; font-weight: 700; color: ${done || next ? '#F5EFE4' : '#9C8F86'}`)}>{s.t}</p>
                  <p style={sx('margin: 2px 0 0; font-size: 13px; color: #9C8F86; white-space: nowrap; overflow: hidden; text-overflow: ellipsis')}>{s.s}</p>
                </div>
                <span style={sx(`flex-shrink: 0; font-size: 12px; font-weight: 700; color: ${done ? '#F6E3C0' : next ? '#E9DCFA' : '#9C8F86'}`)}>
                  {done ? 'Listo' : N === 0 && s.n === 1 ? 'Esta noche' : `en ${s.n - N} ${s.n - N === 1 ? 'noche' : 'noches'}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  // ---------- Liste: immer der volle Aufbau (wie nach 14 Nächten), Vorschau wo noch Daten fehlen ----------
  const realSrc: PatternItem | null = demo
    ? (N >= 7 ? { name: 'Las personas', description: N >= 14 ? 'Es lo que más te sostiene estas dos semanas.' : 'En 5 de tus 7 noches. Estos fueron algunos:', frequency: N >= 14 ? 'Están en 10 de tus 14 highs' : 'Están en casi todos tus highs', when: '', quotes: N >= 14 ? ['Cena con amigos · sáb', 'Concierto con Ana · vie', 'Café con Lucía · lun'] : ['Café con Lucía · lun', 'Paseo con amigos · mié', 'Cena con amigos · sáb'] } : null)
    : patterns?.sources[0] ?? null;
  const realDrn: PatternItem | null = demo
    ? (N >= 7 ? { name: 'Los lunes', description: 'Quizá por las prisas de empezar la semana. ¿Qué te ayudaría el domingo por la noche?', frequency: 'Suelen pesar más', when: 'Lunes por la mañana', quotes: ['«Una pausa corta fuera.»'] } : null)
    : patterns?.drains[0] ?? null;
  const exSrc: PatternItem = { name: 'Las personas', description: 'Por ejemplo: el tiempo con amigos aparece en casi todos tus highs.', frequency: 'A menudo', when: '', quotes: ['Cena con amigos · sáb', 'Café con Lucía · lun'] };
  const exDrn: PatternItem = { name: 'Las prisas', description: 'Por ejemplo: las prisas aparecen a menudo en tus lows, sobre todo los lunes.', frequency: 'A menudo · sobre todo los lunes', when: 'Lunes por la mañana', quotes: ['«Una pausa corta fuera.»'] };
  const realIdeas = demo
    ? (N >= 7 ? [N >= 14 ? 'Vuelve a cocinar con calma esta semana.' : 'Esta semana, queda con alguien que te haga bien.'] : [])
    : (patterns?.ideas ?? []).filter((t) => !data.ideas.hidden[t]);
  const ideasPreview = realIdeas.length === 0 && !(patterns && patterns.ideas.length);
  const ideas = ideasPreview ? ['Por ejemplo: esta semana, queda con alguien que te haga bien.'] : realIdeas;
  const weekPreview = !demo && entries.length < 3 || (demo && N < 14);
  const streak = demo ? N >= 14 : lowStreak(entries);
  const in7 = Math.max(1, 7 - N);
  const soon = (n: number) => `Vista previa · en ${n} ${n === 1 ? 'noche' : 'noches'}`;
  const rows: ListRow[] = [
    { title: 'Tu mapa de energía', sub: energyPreview ? soon(Math.max(1, 3 - entries.length)) : 'Qué te llena y qué te pesa', tone: 'gold', icon: 'leaf-linear', detail: { kind: 'energy' }, preview: energyPreview, unlock: 3 },
    realSrc
      ? { title: realSrc.name, sub: realSrc.frequency || 'Te da energía', tone: 'gold', icon: 'users-group-rounded-linear', detail: { kind: 'item', item: realSrc, src: true } }
      : { title: 'Lo que te llena', sub: soon(in7), tone: 'gold', icon: 'users-group-rounded-linear', detail: { kind: 'item', item: exSrc, src: true }, preview: true, unlock: 7 },
    realDrn
      ? { title: realDrn.name, sub: realDrn.frequency || 'Te pesa', tone: 'blue', icon: 'cloud-linear', detail: { kind: 'item', item: realDrn, src: false } }
      : { title: 'Lo que te pesa', sub: soon(in7), tone: 'blue', icon: 'cloud-linear', detail: { kind: 'item', item: exDrn, src: false }, preview: true, unlock: 7 },
    { title: 'Tu semana', sub: weekPreview ? soon(demo ? Math.max(1, 14 - N) : Math.max(1, 3 - entries.length)) : 'Highs y lows por día', tone: 'blue', icon: 'chart-2-linear', detail: { kind: 'week' }, preview: weekPreview, unlock: 3 },
  ];
  if (streak) rows.push({ title: 'Varios lows seguidos', sub: 'Con cariño, por si lo necesitas', tone: 'blue', icon: 'heart-linear', detail: { kind: 'lows' } });
  rows.push({ title: 'Más de esto', sub: ideasPreview ? soon(in7) : 'Una idea para esta semana', tone: 'gold', icon: 'stars-linear', detail: { kind: 'more' }, preview: ideasPreview, unlock: 7 });

  const open = ui.patOpen >= 0 ? rows[ui.patOpen] : null;
  const back = () => { update({ patOpen: -1 }); document.querySelectorAll('.scroller').forEach((el) => { el.scrollTop = 0; }); };

  const detailHead = (r: ListRow, sentence: string) => (
    <>
      <button type="button" onClick={back} style={sx(BACKLINK)}><Icon name="alt-arrow-left-linear" size={18} />Tus patrones</button>
      <div style={sx('display: flex; flex-direction: column; gap: 10px')}>
        <Orb size={40} tone={r.tone}><Icon name={r.icon} size={18} /></Orb>
        <h2 style={sx(H1 + '; margin-top: 4px; font-size: 32px; line-height: 1.15')}>{r.title}</h2>
        <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>{sentence}</p>
      </div>
      {r.preview && (
        <div style={sx('padding: 12px 14px; border-radius: 16px; background: rgba(201,182,228,0.1); border: 1px solid rgba(201,182,228,0.3); display: flex; gap: 10px; align-items: flex-start')}>
          <span className="orb" aria-hidden="true" style={sx('margin-top: 5px; width: 7px; height: 7px; border-radius: 4px; flex-shrink: 0; background: #EDE3F8; box-shadow: 0 0 8px 2px rgba(201,182,228,0.7)')} />
          <span style={sx('font-size: 13px; line-height: 1.5; color: #E9DCFA')}><b>Vista previa.</b> Así se verá con tus noches{r.unlock ? ` (a partir de la noche ${r.unlock})` : ''}. Lo que ves ahora es un ejemplo.</span>
        </div>
      )}
    </>
  );

  const renderDetail = (r: ListRow) => {
    const d = r.detail;
    if (d.kind === 'energy') {
      const S = energy.filter((e) => e[4] === 's').slice(0, 4), D = energy.filter((e) => e[4] === 'd').slice(0, 4);
      const all = [...S, ...D];
      const sel = all[Math.min(ui.patSel, all.length - 1)];
      const max = Math.max(1, ...all.map((e) => e[1]));
      // 2×2-Raster je Seite (Zellen 70 px), versetzt – Blasen überlappen nie
      const slots = [[6, 24], [80, 54], [6, 118], [80, 140]];
      const bubble = (e: EnergyItem, i: number, j: number) => {
        const longest = Math.max(...e[0].split(' ').map((w) => w.length));
        const size = Math.min(68, Math.max(Math.round(46 + (e[1] / max) * 22), longest * 6 + 14));
        const [x, y] = slots[j];
        const cell = x + (68 - size) / 2;
        const left = e[4] === 's' ? cell : 314 - cell - size;
        const on = sel === e;
        const c = e[4] === 's' ? '242,180,90' : '159,180,200';
        return (
          <button key={e[0] + i} type="button" aria-label={e[0]} aria-pressed={on} onClick={() => update({ patSel: i })}
            style={sx(`position: absolute; left: ${left}px; top: ${y}px; width: ${size}px; height: ${size}px; border-radius: 50%; padding: 0; border: 1px solid rgba(${c},0.55); background: radial-gradient(circle at 38% 32%, rgba(${c},0.45) 0%, rgba(${c},0.18) 60%, rgba(0,0,0,0) 100%); box-shadow: ${on ? `0 0 0 2px ${e[4] === 's' ? '#F6D49A' : '#C9D6E2'}, 0 0 22px rgba(${c},0.6)` : `0 0 12px rgba(${c},0.25)`}; color: #FBF3E6; font-family: inherit; font-size: ${longest > 9 ? 10 : 11}px; font-weight: 700; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.1; cursor: pointer; transition: box-shadow .4s ease, transform .4s ease; transform: scale(${on ? 1.06 : 1}); overflow: hidden; padding: 0 3px`)}>
            {e[0]}
          </button>
        );
      };
      const addRow = (k: 's' | 'd') => {
        const mine = data.energy[k];
        const base = (k === 's' ? S : D);
        const save = () => {
          const t = ui.enDraft.trim();
          if (t) setData((dd) => ({ ...dd, energy: { ...dd.energy, [k]: [...dd.energy[k], t] } }));
          update({ enAdding: '', enDraft: '' });
        };
        return (
          <div>
            <p style={sx(LABEL + `; margin-bottom: 10px; color: ${k === 's' ? '#F6D49A' : '#C9D6E2'}`)}>{k === 's' ? 'Te llena' : 'Te pesa'}</p>
            <div style={sx(`${GLASS}; border-radius: 22px; padding: 4px 16px`)}>
              {base.map((e) => (
                <div key={e[0]} style={sx('display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(245,239,228,0.06)')}>
                  <span style={sx(`width: 8px; height: 8px; border-radius: 4px; background: ${k === 's' ? '#F2B45A' : '#9FB4C8'}; box-shadow: 0 0 6px ${k === 's' ? '#F2B45A' : '#9FB4C8'}`)} />
                  <span style={sx('flex-grow: 1; display: flex; flex-direction: column; gap: 2px')}><span style={sx('font-size: 15px; font-weight: 700')}>{e[0]}</span><span style={sx('font-size: 13px; color: #9C8F86')}>{e[2]}</span></span>
                </div>
              ))}
              {mine.map((t, i) => (
                <div key={'m' + i} style={sx('display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(245,239,228,0.06)')}>
                  <span style={sx(`width: 8px; height: 8px; border-radius: 4px; background: ${k === 's' ? '#F2B45A' : '#9FB4C8'}`)} />
                  <span style={sx('flex-grow: 1; display: flex; flex-direction: column; gap: 2px')}><span style={sx('font-size: 15px; font-weight: 700')}>{t}</span><span style={sx('font-size: 13px; color: #9C8F86')}>Añadido por ti</span></span>
                  <span style={sx('padding: 3px 8px; border-radius: 10px; background: rgba(245,239,228,0.08); color: #E6DACB; font-size: 11px; font-weight: 700')}>Tuyo</span>
                </div>
              ))}
              {ui.enAdding === k ? (
                <div style={sx('display: flex; gap: 8px; align-items: center; padding: 10px 0')}>
                  <input type="text" autoFocus aria-label={k === 's' ? 'Algo que te hace bien' : 'Algo que te quita energía'} placeholder={k === 's' ? 'Algo que te hace bien …' : 'Algo que te quita energía …'} value={ui.enDraft} onChange={(e) => update({ enDraft: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') update({ enAdding: '' }); }} style={sx(INPUT + '; flex-grow: 1; height: 40px; border-radius: 20px')} />
                  <button type="button" onClick={save} style={sx('height: 40px; padding: 0 14px; border-radius: 20px; border: none; background: #E6CDA3; color: #2B2430; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit')}>Guardar</button>
                </div>
              ) : (
                <button type="button" onClick={() => update({ enAdding: k, enDraft: '' })} style={sx('width: 100%; padding: 12px 0; border: none; background: transparent; color: #E6CDA3; font-size: 14px; font-weight: 700; text-align: left; cursor: pointer; font-family: inherit')}>{k === 's' ? '+ Añadir algo que te hace bien' : '+ Añadir algo que te quita energía'}</button>
              )}
            </div>
          </div>
        );
      };
      return (
        <>
          {detailHead(r, 'Qué te llena y qué te pesa.')}
          {all.length === 0 ? (
            <div style={sx(CARD)}><p style={sx('margin: 0; font-size: 15px; color: #CDBFAE')}>Aún no hay suficiente. Vuelve tras unas noches más.</p></div>
          ) : (
            <div style={sx(`${GLASS}; padding: 18px; border-radius: 24px`)}>
              <div style={sx('position: relative; width: 314px; height: 214px; margin: 0 auto')}>
                <span aria-hidden="true" style={sx('position: absolute; left: 157px; top: 28px; width: 1px; height: 176px; background: linear-gradient(to bottom, rgba(245,239,228,0), rgba(245,239,228,0.14), rgba(245,239,228,0))')} />
                <span style={sx('position: absolute; left: 0; top: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #F6D49A')}>Te llena</span>
                <span style={sx('position: absolute; right: 0; top: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #C9D6E2')}>Te pesa</span>
                {S.map((e, j) => bubble(e, j, j))}
                {D.map((e, j) => bubble(e, S.length + j, j))}
              </div>
              {sel && (
                <div key={sel[0]} className="softin" style={sx('margin-top: 12px; padding-top: 14px; border-top: 1px solid rgba(245,239,228,0.08); display: flex; gap: 12px; align-items: flex-start')}>
                  <span aria-hidden="true" style={sx(`margin-top: 6px; width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; background: ${sel[4] === 's' ? '#F2B45A' : '#9FB4C8'}; box-shadow: 0 0 8px ${sel[4] === 's' ? '#F2B45A' : '#9FB4C8'}`)} />
                  <div><p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 19px; line-height: 1.3")}>{sel[0]} · {sel[2]}</p>{sel[3] && <p style={sx('margin: 3px 0 0; font-size: 13px; line-height: 1.45; color: #9C8F86')}>{sel[3]}</p>}</div>
                </div>
              )}
              <p style={sx('margin: 10px 0 0; font-size: 12px; color: #9C8F86')}>Toca una burbuja. Cuanto más grande, más se repite.</p>
            </div>
          )}
          {addRow('s')}
          {addRow('d')}
          <p style={sx('margin: 0; font-size: 13px; color: #9C8F86; text-align: center')}>Lo que añadas aquí lo tendré en cuenta en tus patrones e ideas.</p>
        </>
      );
    }
    if (d.kind === 'item') {
      const audioFor = (q: string) => {
        const t = q.split(' · ')[0].replace(/[«»"]/g, '').trim().toLowerCase();
        for (const e of Object.values(data.days)) for (const m of [...e.high1, ...e.high2]) if (m.audioId && m.text.trim().toLowerCase() === t) return m.audioId;
        return undefined;
      };
      return (
        <>
          {detailHead(r, d.item.frequency || (d.src ? 'Te da energía.' : 'Te pesa.'))}
          <div style={sx(CARD)}>
            <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 21px; line-height: 1.35")}>{d.item.description}</p>
            {d.item.when && <p style={sx('margin: 0; font-size: 14px; color: #9C8F86')}>Cuándo: {d.item.when}</p>}
          </div>
          {d.item.quotes.length > 0 && <p style={sx(LABEL)}>{d.src ? 'Tus momentos' : 'Lo que te ayudó'}</p>}
          {d.item.quotes.map((q, i) => {
            const a = d.src ? audioFor(q) : undefined;
            return (
              <div key={i} style={sx(`${GLASS}; padding: 14px 16px; border-radius: 18px; display: flex; gap: 12px; align-items: center`)}>
                {a ? playBtn(a) : <Orb size={30} tone={d.src ? 'gold' : 'blue'}><span style={sx('font-size: 11px')}>✦</span></Orb>}
                <span style={sx(ITALIC + '; font-size: 16px; line-height: 1.4')}>{q}</span>
              </div>
            );
          })}
        </>
      );
    }
    if (d.kind === 'week') {
      const bars = demo || r.preview ? DEMO_WEEK : weekBars(entries);
      const mx = Math.max(1, ...bars.flat());
      const wkend = bars[5][0] + bars[6][0], wk = bars.slice(0, 5).reduce((a, b) => a + b[0], 0) / 2.5;
      const sentence = wkend > wk ? 'Los fines de semana brillas más.' : 'Tu semana, noche a noche.';
      return (
        <>
          {detailHead(r, sentence)}
          <div style={sx(CARD)}>
            <p style={sx("margin: 0 0 2px; font-family: 'Fraunces', serif; font-weight: 300; font-size: 19px")}>{sentence}</p>
            <div style={sx('display: flex; gap: 4px')}>
              {bars.map(([h, l], i) => (
                <div key={i} style={sx('flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px')}>
                  <div style={sx('height: 92px; display: flex; align-items: flex-end; gap: 3px')}>
                    <span style={sx(`width: 9px; height: ${Math.max(4, Math.round((h / mx) * 84))}px; border-radius: 5px; background: linear-gradient(to top, #C98A3E, #F6D49A); box-shadow: 0 0 8px rgba(242,180,90,0.35)`)} />
                    <span style={sx(`width: 9px; height: ${Math.max(4, Math.round((l / mx) * 84))}px; border-radius: 5px; background: linear-gradient(to top, #6F86A0, #C9D6E2)`)} />
                  </div>
                  <span style={sx('font-size: 11px; color: #9C8F86')}>{'LMXJVSD'[i]}</span>
                </div>
              ))}
            </div>
            <div style={sx('display: flex; gap: 14px; font-size: 12px; color: #9C8F86')}><span>● <span style={sx('color: #F6D49A')}>Highs</span></span><span>● <span style={sx('color: #C9D6E2')}>Lows</span></span></div>
          </div>
        </>
      );
    }
    if (d.kind === 'lows') {
      return (
        <>
          {detailHead(r, 'Con cariño, por si lo necesitas.')}
          <div style={sx(CARD)}>
            <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 21px; line-height: 1.35")}>Últimamente aparecen varios lows seguidos.</p>
            <p style={sx('margin: 0; font-size: 15px; line-height: 1.55; color: #CDBFAE')}>No tienes que llevarlo solo. Hablar con alguien de confianza, o con un profesional, puede ayudar.</p>
            <button type="button" onClick={() => update({ supOpen: true })} style={sx('align-self: flex-start; height: 42px; padding: 0 18px; border-radius: 21px; border: 1px solid rgba(159,180,200,0.4); background: rgba(159,180,200,0.12); color: #C9D6E2; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit')}>Ver apoyo</button>
          </div>
        </>
      );
    }
    // Más de esto
    return (
      <>
        {detailHead(r, 'Una idea para esta semana.')}
        {ideas.length === 0 && <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>Por ahora no hay más ideas. Vuelve en unos días.</p>}
        {ideas.map((t) => {
          const on = !!data.ideas.on[t];
          return (
            <div key={t} style={sx(CARD + '; border: 1px solid rgba(242,180,90,0.3)')}>
              <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 20px; line-height: 1.4")}>{t}</p>
              <div style={sx('display: flex; gap: 10px')}>
                <button type="button" aria-pressed={on} disabled={r.preview} onClick={() => setData((dd) => ({ ...dd, ideas: { ...dd.ideas, on: { ...dd.ideas.on, [t]: !dd.ideas.on[t] } } }))} style={sx(`height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid #E6CDA3; background: ${on ? '#E6CDA3' : 'transparent'}; color: ${on ? '#2B2430' : '#F6E3C0'}; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit`)}>{on ? '✓ Me apunto' : 'Me apunto'}</button>
                <button type="button" disabled={r.preview} onClick={() => setData((dd) => ({ ...dd, ideas: { ...dd.ideas, hidden: { ...dd.ideas.hidden, [t]: true } } }))} style={sx('height: 40px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer; font-family: inherit')}>Ahora no</button>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // ---------- Seite zusammensetzen ----------
  if (open) return <TabPage><div key={ui.patOpen} className="softin" style={sx('display: flex; flex-direction: column; gap: 22px')}>{renderDetail(open)}</div></TabPage>;

  const loadingPatterns = !demo && N >= 7 && !patterns;
  const realMirror = demo ? (N >= 14 ? DEMO_MIRROR : '') : patterns?.mirror || '';
  const mirrorText = realMirror || 'Aquí te contaré, en pocas palabras, cómo han sido tus semanas: qué te ha sostenido y qué te ha pesado.';

  return (
    <TabPage>
      {head}
      {!demo && N === 0 && (
        <div style={sx(CARD + '; border: 1px solid rgba(230,205,163,0.3)')}>
          <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 21px; line-height: 1.35")}>Aquí crecerá tu espejo, noche a noche.</p>
          <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>Tu primera noche empieza en «Hoy». Ya puedes entrar en cada apartado para ver lo que te espera.</p>
          <button type="button" onClick={() => tabGo('home')} style={sx('align-self: flex-start; height: 44px; padding: 0 20px; border-radius: 22px; border: none; background: #E6CDA3; color: #2B2430; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit')}>Ir a Hoy</button>
        </div>
      )}
      {N >= 7 && N < 10 && (
        <div style={sx('padding: 14px 16px; border-radius: 20px; background: rgba(230,205,163,0.1); border: 1px solid rgba(230,205,163,0.3); display: flex; gap: 10px; align-items: center')}>
          <span style={sx('display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #F6E3C0; flex-shrink: 0')}><span className="orb" style={sx('width: 7px; height: 7px; border-radius: 4px; background: #F6E3C0; box-shadow: 0 0 8px 2px rgba(246,222,170,0.6)')} />Nuevo</span>
          <span style={sx('font-size: 14px; line-height: 1.4; color: #E6DACB')}>Siete noches. Ya puedo enseñarte lo que se repite.</span>
        </div>
      )}
      <div style={sx(`position: relative; overflow: hidden; border-radius: 24px; padding: 20px; background: radial-gradient(120% 120% at 0% 0%, rgba(230,205,163,0.2) 0%, rgba(58,44,70,0.5) 55%, rgba(30,24,40,0.6) 100%); border: 1px solid rgba(230,205,163,0.35); opacity: ${realMirror ? 1 : 0.92}`)}>
        <span aria-hidden="true" className="aurora" style={sx('position: absolute; left: -60px; top: -80px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(246,222,170,0.3) 0%, rgba(246,222,170,0) 65%)')} />
        <Twinkles n={10} w={330} h={140} seed={9} />
        <div style={sx('position: relative; display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
          <p style={sx('margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #F6E3C0')}>{realMirror ? 'Tu primer espejo · 2 semanas' : 'Tu espejo · 2 semanas'}</p>
          {!realMirror && <span style={sx('height: 24px; padding: 0 9px; border-radius: 12px; background: rgba(245,239,228,0.08); color: #E6DACB; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; flex-shrink: 0')}><Icon name="lock-keyhole-minimalistic-linear" size={12} />{N >= 14 ? 'Muy pronto' : `En ${14 - N} noches`}</span>}
        </div>
        <p style={sx('position: relative; margin: 10px 0 0; ' + ITALIC.replace('margin: 0; ', '') + `; font-size: 21px; line-height: 1.4; color: ${realMirror ? '#F5EFE4' : '#CDBFAE'}`)}>“{mirrorText}”</p>
        {realMirror ? (
          <button type="button" onClick={() => speak(realMirror)} style={sx('position: relative; margin-top: 6px; min-height: 44px; padding: 0; border: none; background: transparent; display: flex; align-items: center; gap: 8px; color: #E6CDA3; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit')}>
            <Icon name="soundwave-linear" size={18} />{ui.speaking ? 'Escuchando … toca para parar' : 'Escúchalo con calma'}
          </button>
        ) : (
          <p style={sx('position: relative; margin: 12px 0 0; display: flex; align-items: center; gap: 8px; color: #9C8F86; font-size: 13px; font-weight: 700')}><Icon name="soundwave-linear" size={18} />Podrás escucharlo con calma</p>
        )}
      </div>
      {loadingPatterns && ui.patState === 'loading' && (
        <div style={sx(CARD + '; align-items: center; text-align: center')}>
          <div aria-hidden="true" style={sx('height: 24px; display: flex; gap: 8px; align-items: center')}><span className="thinkdot" /><span className="thinkdot" /><span className="thinkdot" /></div>
          <p role="status" style={sx('margin: 0; font-size: 15px; color: #CDBFAE')}>Vela está mirando tus noches …</p>
        </div>
      )}
      {!demo && N >= 7 && ui.patState === 'error' && (
        <div style={sx(CARD)}>
          <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #E6DACB')}>{patterns ? 'No pude actualizar tus patrones ahora. Te muestro los últimos.' : 'Ahora mismo no puedo mirar tus patrones a fondo. Te muestro lo que veo en este dispositivo.'}</p>
          <button type="button" onClick={retryPatterns} style={sx('align-self: flex-start; height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.2); background: transparent; color: #E6DACB; font-size: 13px; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px')}><Icon name="refresh-linear" size={15} />Reintentar</button>
        </div>
      )}
      <div>
        <p style={sx(LABEL + '; margin-bottom: 4px')}>Tus patrones</p>
        <div style={sx(`${GLASS}; border-radius: 22px; padding: 0 16px`)}>
          {rows.map((r, i) => (
            <Row key={r.title} orb={<Orb size={36} tone={r.tone} state={r.preview ? 'next' : 'on'}><Icon name={r.icon} size={17} /></Orb>} title={r.title} sub={r.sub} onClick={() => { update({ patOpen: i, patSel: 0 }); document.querySelectorAll('.scroller').forEach((el) => { el.scrollTop = 0; }); }} />
          ))}
        </div>
        <p style={sx('margin: 10px 0 0; font-size: 13px; color: #9C8F86; text-align: center')}>Entra en cada uno, a tu ritmo.</p>
      </div>
      {camino}
      {introBar}
      {!demo && N > 0 && (
        <p style={sx('margin: 0; font-size: 12px; color: #9C8F86; text-align: center')}>Última noche: {entries.length ? relLabel(entries[entries.length - 1].date, today) : '—'}</p>
      )}
    </TabPage>
  );
}
