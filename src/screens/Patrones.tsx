// Tab „Patrones“ – wächst mit den Nächten (Día 0/1 · 3 · 5 · 7 · 14+), Prototipo v1 Abschnitt 10.
import { useRef, type ReactNode } from 'react';
import { useApp } from '../ctx';
import { sx } from '../sx';
import { Icon } from '../Icon';
import type { IconName } from '../icons.generated';
import { BACKLINK, CARD, GLASS, H1, INPUT, ITALIC, LABEL, Orb, PageHead, Row, Spiral, TONE, TabPage, Twinkles, type Tone } from '../ui';
import { DEMO_D3, DEMO_D5, DEMO_ENERGY, DEMO_MIRROR, DEMO_WEEK, INSPO, REFL, ROADMAP, type EnergyItem } from '../demo';
import { doneEntries, lowStreak, topWords, weekBars, cap1 } from '../lib/insights';
import { relLabel, parseKey } from '../lib/dates';
import type { PatternItem } from '../lib/store';

const RM_ICON: Record<string, IconName> = {
  noches: 'document-text-linear', momentos: 'soundwave-linear', palabras: 'chat-round-line-linear', energia: 'leaf-linear',
  patrones: 'cloud-linear', mas: 'stars-linear', espejo: 'moon-stars-linear', apoyo: 'heart-linear',
};

type Detail =
  | { kind: 'energy' }
  | { kind: 'item'; item: PatternItem; src: boolean }
  | { kind: 'week' }
  | { kind: 'lows' }
  | { kind: 'more' };

interface ListRow { title: string; sub: string; tone: Tone; icon: IconName; detail: Detail }

export function Patrones() {
  const { data, setData, ui, update, nights: N, demo, today, playBtn, speak, retryPatterns, tabGo } = useApp();
  const px0 = useRef<number | null>(null);
  const entries = doneEntries(data);
  const patterns = data.patterns?.result ?? null;

  // ---------- Energie-Einträge (Demo, KI oder lokale Wörter) ----------
  const energy: EnergyItem[] = (() => {
    if (demo) return DEMO_ENERGY[N >= 14 ? '14' : '7'];
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

  const supportBtn = (
    <button type="button" onClick={() => update({ supOpen: true })} style={sx('height: 36px; padding: 0 14px; border-radius: 16px; background: rgba(159,180,200,0.12); border: 1px solid rgba(159,180,200,0.25); color: #C9D6E2; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; flex-shrink: 0')}>
      <Icon name="heart-linear" size={14} />Apoyo
    </button>
  );
  const stageText = N >= 14 ? 'Dos semanas contigo. Esto es lo que veo.' : N >= 7 ? 'Tus primeros patrones están aquí.' : N >= 5 ? 'Tu energía empieza a tomar forma.' : N >= 3 ? 'Ya empiezo a reconocer tu voz.' : 'Tu espejo. Crece contigo, noche a noche.';
  const head = <PageHead label={`Día ${N}`} title="Patrones" text={stageText} right={supportBtn} />;

  // ---------- Wischkarten ----------
  const carousel = (title: string, cards: ReactNode[]) => {
    const n = cards.length, idx = Math.min(ui.patIdx, n - 1);
    const to = (i: number) => update({ patIdx: (i + n) % n });
    return (
      <div>
        <div style={sx('display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px')}>
          <p style={sx(LABEL)}>{title}</p>
          <p style={sx('margin: 0; font-size: 12px; color: #9C8F86')}>{idx + 1} / {n}</p>
        </div>
        <div
          role="region" aria-roledescription="carrusel" aria-label={title}
          onPointerDown={(e) => { px0.current = e.clientX; }}
          onPointerUp={(e) => { if (px0.current == null) return; const dx = e.clientX - px0.current; px0.current = null; if (dx < -36) to(idx + 1); else if (dx > 36) to(idx - 1); }}
          onPointerCancel={() => { px0.current = null; }}
          style={sx('width: 350px; height: 250px; overflow: hidden; border-radius: 26px; touch-action: pan-y; cursor: grab')}
        >
          <div style={sx(`display: flex; gap: 12px; transform: translateX(${-idx * 362}px); transition: transform .55s cubic-bezier(0.22, 0.61, 0.36, 1)`)}>
            {cards.map((c, i) => <div key={i} aria-hidden={i !== idx} style={sx('flex: 0 0 350px; height: 250px')}>{c}</div>)}
          </div>
        </div>
        <div style={sx('display: flex; align-items: center; justify-content: space-between; margin-top: 6px')}>
          <div role="tablist" aria-label="Elegir tarjeta" style={sx('display: flex; gap: 2px')}>
            {cards.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === idx} aria-label={`Tarjeta ${i + 1}`} onClick={() => to(i)} style={sx('width: 24px; height: 32px; padding: 0; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer')}>
                <span style={sx(`width: ${i === idx ? 18 : 6}px; height: 6px; border-radius: 3px; background: ${i === idx ? '#E6CDA3' : 'rgba(245,239,228,0.22)'}; transition: width .4s ease, background .4s ease`)} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => to(idx + 1)} className={idx === 0 ? 'nudge' : undefined} style={sx('height: 40px; padding: 0 6px 0 14px; border: none; background: transparent; color: #E6CDA3; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; font-family: inherit')}>
            {idx === n - 1 ? 'Otra vez' : 'Siguiente'}<Icon name="alt-arrow-right-linear" size={18} />
          </button>
        </div>
      </div>
    );
  };

  const vcard = (tone: Tone, children: ReactNode) => {
    const t = TONE[tone];
    return (
      <div style={sx(`${GLASS}; height: 250px; padding: 22px; border-radius: 26px; background: linear-gradient(160deg, rgba(${t.rgb},0.13) 0%, rgba(245,239,228,0.04) 70%); border: 1px solid rgba(245,239,228,0.1); position: relative; overflow: hidden; user-select: none`)}>
        <span aria-hidden="true" style={sx(`position: absolute; right: -50px; top: -60px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(${t.rgb},0.36) 0%, rgba(0,0,0,0) 68%)`)} />
        <div style={sx('position: relative; display: flex; flex-direction: column; gap: 12px; height: 100%')}>{children}</div>
      </div>
    );
  };
  const badge = (txt: string, open: boolean, tone?: Tone) => (
    <span style={sx(`height: 26px; padding: 0 10px; border-radius: 13px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px; background: ${tone ? `rgba(${TONE[tone].rgb},0.1)` : open ? 'rgba(230,205,163,0.12)' : 'rgba(245,239,228,0.05)'}; color: ${tone ? TONE[tone].light : open ? '#F6E3C0' : '#9C8F86'}`)}>
      {tone ? null : <Icon name={open ? 'check-circle-linear' : 'lock-keyhole-minimalistic-linear'} size={13} />}{txt}
    </span>
  );

  const introCard = (locked: boolean) => (
    <div style={sx('height: 250px; border-radius: 26px; position: relative; overflow: hidden; user-select: none; background: radial-gradient(120% 90% at 50% 0%, #3E2F5E 0%, #251D3D 45%, #15112A 100%); border: 1px solid rgba(201,182,228,0.45); box-shadow: inset 0 0 40px rgba(201,182,228,0.18), 0 0 28px -6px rgba(201,182,228,0.45)')}>
      <span aria-hidden="true" className="aurora" style={sx('position: absolute; left: -60px; top: -90px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(201,182,228,0.55) 0%, rgba(201,182,228,0) 65%)')} />
      <span aria-hidden="true" className="aurora2" style={sx('position: absolute; right: -80px; bottom: -110px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(242,180,90,0.28) 0%, rgba(242,180,90,0) 65%)')} />
      <Twinkles n={26} w={350} h={250} color="#F4EEFF" seed={11} />
      <div aria-hidden="true" style={sx('position: absolute; left: 50%; top: 60px; width: 84px; height: 84px; margin-left: -42px; display: flex; align-items: center; justify-content: center')}>
        <span className="orb" style={sx('position: absolute; inset: -18px; border-radius: 50%; background: radial-gradient(circle, rgba(237,227,248,0.55) 0%, rgba(201,182,228,0.18) 45%, rgba(201,182,228,0) 70%)')} />
        <span style={sx('position: relative; width: 64px; height: 64px; border-radius: 32px; background: rgba(237,227,248,0.12); border: 1px solid rgba(237,227,248,0.5); color: #F4EEFF; display: flex; align-items: center; justify-content: center')}><Spiral size={30} /></span>
      </div>
      <div style={sx('position: relative; height: 100%; padding: 20px 22px 22px; display: flex; flex-direction: column; align-items: center; text-align: center')}>
        <div style={sx('align-self: stretch; display: flex; justify-content: space-between; align-items: center')}>
          <span style={sx('display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #E9DCFA')}>✦ Lo más tuyo</span>
          <span style={sx('height: 26px; padding: 0 10px; border-radius: 13px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px; background: rgba(237,227,248,0.12); color: #E9DCFA; border: 1px solid rgba(237,227,248,0.25)')}>
            <Icon name={locked ? 'lock-keyhole-minimalistic-linear' : 'check-circle-linear'} size={13} />{locked ? 'Noche 14' : 'Ya disponible'}
          </span>
        </div>
        <p style={sx("margin: auto 0 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 30px; line-height: 1.1; color: #FBF7FF; text-shadow: 0 0 22px rgba(201,182,228,0.6)")}>Introspección</p>
        <p style={sx('margin: 8px 0 0; font-size: 15px; line-height: 1.45; color: #DCD0EA')}>Preguntas que te acercan a ti.<br />Más claridad, más calma.</p>
      </div>
    </div>
  );

  const roadmapCards = ROADMAP.map((r) => {
    if (r.icon === 'intro') return introCard(N < 14);
    const open = r.n != null && N >= r.n;
    return vcard(r.tone as Tone, (
      <>
        <div style={sx('display: flex; justify-content: space-between; align-items: flex-start')}>
          <span aria-hidden="true" style={sx(`width: 52px; height: 52px; border-radius: 26px; background: rgba(${TONE[r.tone as Tone].rgb},0.12); border: 1px solid rgba(${TONE[r.tone as Tone].rgb},0.38); color: ${TONE[r.tone as Tone].c}; display: flex; align-items: center; justify-content: center`)}><Icon name={RM_ICON[r.icon]} size={28} /></span>
          {r.n == null ? badge('Siempre', true, 'blue') : badge(open ? 'Ya disponible' : `Noche ${r.n}`, open)}
        </div>
        <p style={sx("margin: auto 0 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 28px; line-height: 1.15")}>{r.title}</p>
        <p style={sx('margin: 0 0 4px; font-size: 16px; line-height: 1.45; color: #CDBFAE')}>{r.line}</p>
      </>
    ));
  });

  // ---------- Bausteine Día 3/5 ----------
  const lastNights: [string, string, string][] = demo ? DEMO_D3.nights : entries.slice(-3).map((e) => {
    const wd = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][parseKey(e.date).getDay()];
    return [wd, e.high1[0]?.text || e.high2[0]?.text || '—', e.low[0]?.text || '—'];
  });
  const hw = demo ? DEMO_D3.highWords : topWords(entries, 'high');
  const lw = demo ? DEMO_D3.lowWords : topWords(entries, 'low');
  const nightsCard = vcard('beige', (
    <>
      <div style={sx('display: flex; justify-content: space-between; align-items: center')}>
        <p style={sx(H1 + '; font-size: 22px')}>Tus noches</p>
        <span style={sx('display: flex; gap: 10px; font-size: 11px; color: #9C8F86')}><span style={sx('display: flex; align-items: center; gap: 4px')}><span style={sx('width: 7px; height: 7px; border-radius: 4px; background: #F2B45A')} />High</span><span style={sx('display: flex; align-items: center; gap: 4px')}><span style={sx('width: 7px; height: 7px; border-radius: 4px; background: #9FB4C8')} />Low</span></span>
      </div>
      <div style={sx('display: flex; flex-direction: column; gap: 10px; margin-top: 4px')}>
        {lastNights.map(([d, h, l], i) => (
          <div key={i} style={sx('display: flex; gap: 12px; align-items: flex-start')}>
            <span style={sx('width: 30px; font-size: 12px; font-weight: 700; color: #9C8F86; padding-top: 2px')}>{d}</span>
            <div style={sx('display: flex; flex-direction: column; gap: 3px; min-width: 0')}>
              <span style={sx('font-size: 14px; color: #F6D49A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis')}>{h}</span>
              <span style={sx('font-size: 14px; color: #C9D6E2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis')}>{l}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  ));
  const wordCol = (title: string, list: [string, number][], c: string) => (
    <div style={sx('flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0')}>
      <p style={sx(`margin: 0; font-size: 12px; font-weight: 700; color: ${c}`)}>{title}</p>
      {list.length === 0 && <span style={sx('font-size: 14px; color: #9C8F86')}>Aún nada</span>}
      {list.map(([w, n]) => (
        <div key={w} style={sx('display: flex; justify-content: space-between; gap: 6px; font-size: 15px')}><span style={sx('white-space: nowrap; overflow: hidden; text-overflow: ellipsis')}>{w}</span>{n > 1 && <span style={sx('color: #9C8F86')}>×{n}</span>}</div>
      ))}
    </div>
  );
  const wordsCard = vcard('gold', (
    <>
      <p style={sx(H1 + '; font-size: 22px')}>Lo que más aparece</p>
      <div style={sx('display: flex; gap: 18px')}>{wordCol('En tus highs', hw, '#F6D49A')}{wordCol('En tus lows', lw, '#C9D6E2')}</div>
      <p style={sx('margin: auto 0 0; font-size: 13px; color: #9C8F86')}>A las 7 noches verás qué te da y qué te quita energía.</p>
    </>
  ));
  const blurCard = (text: string, inN: number) => vcard('blue', (
    <>
      <p style={sx(LABEL)}>Algo empieza a repetirse</p>
      <p style={sx(ITALIC + '; font-size: 24px; line-height: 1.3; filter: blur(5px); user-select: none')}>{text}</p>
      <span style={sx('margin-top: auto; align-self: flex-start; height: 30px; padding: 0 12px; border-radius: 15px; background: rgba(245,239,228,0.06); color: #CDBFAE; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px')}><Icon name="lock-keyhole-minimalistic-linear" size={14} />Lo verás en {inN} {inN === 1 ? 'noche' : 'noches'}</span>
    </>
  ));
  const refl = REFL[ui.reflIdx % REFL.length];
  const saved = data.savedQuestion === refl.q;
  const questionCard = vcard('lila', (
    <>
      <p style={sx('margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #E9DCFA')}>{refl.k}</p>
      <p style={sx(ITALIC + '; font-size: 23px; line-height: 1.3')}>{refl.q}</p>
      <div style={sx('margin-top: auto; display: flex; gap: 10px; align-items: center')}>
        <button type="button" aria-pressed={saved} onClick={() => setData((d) => ({ ...d, savedQuestion: saved ? null : refl.q }))} style={sx(`height: 40px; padding: 0 16px; border-radius: 20px; border: none; background: ${saved ? 'rgba(230,205,163,0.18)' : '#E6CDA3'}; color: ${saved ? '#E6CDA3' : '#2B2430'}; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit`)}>{saved ? 'Guardada para esta noche' : 'Llevarla a mi noche'}</button>
        <button type="button" onClick={() => update((s) => ({ reflIdx: s.reflIdx + 1 }))} style={sx('height: 40px; padding: 0 8px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer; font-family: inherit')}>Otra pregunta</button>
      </div>
    </>
  ));
  const inspoCard = (i: number) => vcard('beige', (
    <>
      <p style={sx(LABEL)}>{INSPO[i].k}</p>
      <p style={sx(ITALIC + '; font-size: 24px; line-height: 1.3')}>{INSPO[i].t}</p>
      <p style={sx('margin: auto 0 0; font-size: 13px; color: #9C8F86')}>Inspiración para esta noche</p>
    </>
  ));
  const give = demo ? DEMO_D5.give : hw.slice(0, 2).map(([w]) => cap1(w));
  const take = demo ? DEMO_D5.take : lw.slice(0, 2).map(([w]) => cap1(w));
  const barRow = (w: string, i: number, c: string) => (
    <div key={w} style={sx('display: flex; align-items: center; gap: 10px')}>
      <span style={sx('width: 82px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis')}>{w}</span>
      <span style={sx('flex: 1; height: 6px; border-radius: 3px; background: rgba(245,239,228,0.08); overflow: hidden')}><span style={sx(`display: block; height: 100%; width: ${i === 0 ? 80 : 50}%; border-radius: 3px; background: ${c}; box-shadow: 0 0 8px ${c}`)} /></span>
    </div>
  );
  const energyDraft = vcard('gold', (
    <div style={sx('display: flex; flex-direction: column; gap: 7px; height: 100%')}>
      <p style={sx(H1 + '; font-size: 22px; margin-bottom: 2px')}>Tu energía · borrador</p>
      <p style={sx('margin: 0; font-size: 12px; font-weight: 700; color: #F6D49A')}>Te da energía</p>
      {give.length ? give.map((w, i) => barRow(w, i, '#F2B45A')) : <span style={sx('font-size: 14px; color: #9C8F86')}>Aún nada</span>}
      <p style={sx('margin: 0; font-size: 12px; font-weight: 700; color: #C9D6E2')}>Te la quita</p>
      {take.length ? take.map((w, i) => barRow(w, i, '#9FB4C8')) : <span style={sx('font-size: 14px; color: #9C8F86')}>Aún nada</span>}
      <p style={sx('margin: auto 0 0; font-size: 12px; color: #9C8F86')}>Aún es pronto. Lo afino con {7 - N} {7 - N === 1 ? 'noche' : 'noches'} más.</p>
    </div>
  ));

  // ---------- Introspección-Teaser, Leiste und Camino ----------
  const introTeaser = (
    <div style={sx('position: relative; height: 250px; border-radius: 24px; flex-shrink: 0; overflow: hidden; background: radial-gradient(120% 120% at 0% 0%, #3A2C58 0%, #221A38 55%, #15112A 100%); border: 1px solid rgba(201,182,228,0.38); box-shadow: 0 0 22px -8px rgba(201,182,228,0.5)')}>
      <span aria-hidden="true" className="aurora" style={sx('position: absolute; left: -70px; top: -90px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(201,182,228,0.45) 0%, rgba(201,182,228,0) 65%)')} />
      <Twinkles n={16} w={350} h={150} color="#F4EEFF" seed={5} />
      <div style={sx('position: relative; height: 100%; padding: 20px; display: flex; flex-direction: column; gap: 10px')}>
        <div style={sx('display: flex; gap: 14px; align-items: center')}>
          <Orb size={44} state="next"><Spiral size={22} /></Orb>
          <div style={sx('display: flex; flex-direction: column; gap: 3px; min-width: 0')}>
            <p style={sx('margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #E9DCFA')}>En la noche 14 se abre</p>
            <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 24px; line-height: 1.2; color: #FBF7FF")}>Introspección</p>
          </div>
        </div>
        <p style={sx('margin: 2px 0 0; font-size: 15px; line-height: 1.5; color: #DCD0EA')}>Preguntas hechas solo para ti, a partir de tus highs, tus lows y tus patrones. Filosóficas y del día a día.</p>
        <div style={sx('display: flex; flex-wrap: wrap; gap: 6px')}>
          <span style={sx('padding: 5px 10px; border-radius: 12px; background: rgba(242,180,90,0.14); color: #F6D49A; font-size: 12px; font-weight: 700')}>De tus highs</span>
          <span style={sx('padding: 5px 10px; border-radius: 12px; background: rgba(159,180,200,0.14); color: #C9D6E2; font-size: 12px; font-weight: 700')}>De tus lows</span>
          <span style={sx('padding: 5px 10px; border-radius: 12px; background: rgba(237,227,248,0.12); color: #E9DCFA; font-size: 12px; font-weight: 700')}>De tus patrones</span>
        </div>
        <div style={sx('margin-top: auto; display: flex; flex-direction: column; gap: 7px')}>
          <div style={sx('display: flex; justify-content: space-between; font-size: 12px')}><span style={sx('color: #DCD0EA')}>{N === 0 ? 'Empieza esta noche' : `Faltan ${14 - N} ${14 - N === 1 ? 'noche' : 'noches'}`}</span><span style={sx('color: #A99BBE')}>{N} / 14</span></div>
          <span style={sx('height: 5px; border-radius: 3px; background: rgba(237,227,248,0.12); overflow: hidden')}><span style={sx(`display: block; width: ${Math.max(3, (N / 14) * 100)}%; height: 100%; border-radius: 3px; background: linear-gradient(90deg, #E6CDA3, #C9B6E4); box-shadow: 0 0 8px rgba(201,182,228,0.8)`)} /></span>
        </div>
      </div>
    </div>
  );

  const introBar = N >= 3 && (
    <button type="button" disabled={N < 14} onClick={() => tabGo('inward')} style={sx(`${GLASS}; padding: 14px 16px; border-radius: 20px; display: flex; flex-direction: column; gap: 8px; color: #F5EFE4; text-align: left; font-family: inherit; cursor: ${N >= 14 ? 'pointer' : 'default'}`)}>
      <span style={sx('display: flex; align-items: center; gap: 10px; width: 100%')}>
        <Orb size={28} state={N >= 14 ? 'on' : 'next'} tone="lila"><Spiral size={14} /></Orb>
        <span style={sx('flex-grow: 1; font-size: 14px; font-weight: 700')}>Introspección</span>
        <span style={sx('font-size: 12px; color: #E9DCFA')}>{N >= 14 ? 'Ya disponible · ábrelo en «Dentro»' : `Se abre en ${14 - N} ${14 - N === 1 ? 'noche' : 'noches'}`}</span>
      </span>
      {N < 14 && (
        <span style={sx('display: flex; align-items: center; gap: 10px; width: 100%')}>
          <span style={sx('flex: 1; height: 4px; border-radius: 2px; background: rgba(237,227,248,0.12); overflow: hidden')}><span style={sx(`display: block; height: 100%; width: ${(N / 14) * 100}%; background: linear-gradient(90deg, #E6CDA3, #C9B6E4)`)} /></span>
          <span style={sx('font-size: 12px; color: #A99BBE')}>{N} / 14</span>
        </span>
      )}
    </button>
  );

  const camino = (() => {
    const steps = [
      { n: 1, t: 'Tus noches', s: 'Highs y lows, guardados.', icon: 'document-text-linear' as IconName },
      { n: 7, t: 'Tus patrones', s: 'Qué te llena y qué te pesa.', icon: 'leaf-linear' as IconName },
      { n: 14, t: 'Introspección', s: 'Tu espejo y preguntas para ti.', icon: null },
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

  // ---------- Liste ab Día 7 ----------
  const src0 = demo ? null : patterns?.sources[0];
  const drn0 = demo ? null : patterns?.drains[0];
  const ideas = demo
    ? [N >= 14 ? 'Vuelve a cocinar con calma esta semana.' : 'Esta semana, queda con alguien que te haga bien.']
    : (patterns?.ideas ?? []).filter((t) => !data.ideas.hidden[t]);
  const streak = demo ? N >= 14 : lowStreak(entries);
  const rows: ListRow[] = [
    { title: 'Tu mapa de energía', sub: 'Qué te llena y qué te pesa', tone: 'gold', icon: 'leaf-linear', detail: { kind: 'energy' } },
  ];
  if (demo) {
    const people: PatternItem = { name: 'Las personas', description: N >= 14 ? 'Es lo que más te sostiene estas dos semanas.' : 'En 5 de tus 7 noches. Estos fueron algunos:', frequency: '', when: '', quotes: N >= 14 ? ['Cena con amigos · sáb', 'Concierto con Ana · vie', 'Café con Lucía · lun'] : ['Café con Lucía · lun', 'Paseo con amigos · mié', 'Cena con amigos · sáb'] };
    rows.push({ title: 'Las personas', sub: N >= 14 ? 'Están en 10 de tus 14 highs' : 'Están en casi todos tus highs', tone: 'gold', icon: 'users-group-rounded-linear', detail: { kind: 'item', item: people, src: true } });
    if (N < 14) rows.push({ title: 'Los lunes', sub: 'Suelen pesar más', tone: 'blue', icon: 'cloud-linear', detail: { kind: 'item', item: { name: 'Los lunes', description: 'Quizá por las prisas de empezar la semana. ¿Qué te ayudaría el domingo por la noche?', frequency: '', when: '', quotes: ['«Prisas toda la mañana» · lun'] }, src: false } });
    else rows.push({ title: 'Caminar y calma', sub: 'Una conexión que noto', tone: 'beige', icon: 'leaf-linear', detail: { kind: 'item', item: { name: 'Caminar y calma', description: 'Cuando sales a caminar, al día siguiente hablas más de calma. Pasó 4 veces en dos semanas.', frequency: '', when: '', quotes: [] }, src: true } });
  } else {
    if (src0) rows.push({ title: src0.name, sub: src0.frequency || 'Te da energía', tone: 'gold', icon: 'users-group-rounded-linear', detail: { kind: 'item', item: src0, src: true } });
    if (drn0) rows.push({ title: drn0.name, sub: drn0.frequency || 'Te pesa', tone: 'blue', icon: 'cloud-linear', detail: { kind: 'item', item: drn0, src: false } });
  }
  if (N >= 14) rows.push({ title: 'Tu semana', sub: 'Highs y lows por día', tone: 'blue', icon: 'chart-2-linear', detail: { kind: 'week' } });
  if (N >= 14 && streak) rows.push({ title: 'Varios lows seguidos', sub: 'Con cariño, por si lo necesitas', tone: 'blue', icon: 'heart-linear', detail: { kind: 'lows' } });
  if (ideas.length) rows.push({ title: 'Más de esto', sub: 'Una idea para esta semana', tone: 'gold', icon: 'stars-linear', detail: { kind: 'more' } });

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
      const bars = demo ? DEMO_WEEK : weekBars(entries);
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
                <button type="button" aria-pressed={on} onClick={() => setData((dd) => ({ ...dd, ideas: { ...dd.ideas, on: { ...dd.ideas.on, [t]: !dd.ideas.on[t] } } }))} style={sx(`height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid #E6CDA3; background: ${on ? '#E6CDA3' : 'transparent'}; color: ${on ? '#2B2430' : '#F6E3C0'}; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit`)}>{on ? '✓ Me apunto' : 'Me apunto'}</button>
                <button type="button" onClick={() => setData((dd) => ({ ...dd, ideas: { ...dd.ideas, hidden: { ...dd.ideas.hidden, [t]: true } } }))} style={sx('height: 40px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer; font-family: inherit')}>Ahora no</button>
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
  const mirrorText = demo ? DEMO_MIRROR : patterns?.mirror;

  return (
    <TabPage>
      {head}
      {!demo && N === 0 && (
        <div style={sx(CARD + '; border: 1px solid rgba(230,205,163,0.3)')}>
          <p style={sx("margin: 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 21px; line-height: 1.35")}>Aquí crecerá tu espejo, noche a noche.</p>
          <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>Tu primera noche empieza en «Hoy». Después de cada noche, verás aparecer algo nuevo aquí.</p>
          <button type="button" onClick={() => tabGo('home')} style={sx('align-self: flex-start; height: 44px; padding: 0 20px; border-radius: 22px; border: none; background: #E6CDA3; color: #2B2430; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit')}>Ir a Hoy</button>
        </div>
      )}
      {N < 3 && (
        <>
          {carousel('Qué verás, noche a noche', roadmapCards)}
          {introTeaser}
        </>
      )}
      {N >= 3 && N < 5 && carousel('Lo que empieza a aparecer', [nightsCard, wordsCard, blurCard(demo ? DEMO_D3.blurred : 'Lo que más te sostiene empieza a verse.', 7 - N), questionCard, inspoCard(0)])}
      {N >= 5 && N < 7 && carousel('Se empieza a ver', [energyDraft, blurCard(demo ? DEMO_D5.blurred : 'Lo que más te pesa, y cuándo.', 7 - N), questionCard, inspoCard(1)])}
      {N >= 7 && (
        <>
          {N < 10 && (
            <div style={sx('padding: 14px 16px; border-radius: 20px; background: rgba(230,205,163,0.1); border: 1px solid rgba(230,205,163,0.3); display: flex; gap: 10px; align-items: center')}>
              <span style={sx('display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #F6E3C0; flex-shrink: 0')}><span className="orb" style={sx('width: 7px; height: 7px; border-radius: 4px; background: #F6E3C0; box-shadow: 0 0 8px 2px rgba(246,222,170,0.6)')} />Nuevo</span>
              <span style={sx('font-size: 14px; line-height: 1.4; color: #E6DACB')}>Siete noches. Ya puedo enseñarte lo que se repite.</span>
            </div>
          )}
          {N >= 14 && mirrorText && (
            <div style={sx('position: relative; overflow: hidden; border-radius: 24px; padding: 20px; background: radial-gradient(120% 120% at 0% 0%, rgba(230,205,163,0.2) 0%, rgba(58,44,70,0.5) 55%, rgba(30,24,40,0.6) 100%); border: 1px solid rgba(230,205,163,0.35)')}>
              <span aria-hidden="true" className="aurora" style={sx('position: absolute; left: -60px; top: -80px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(246,222,170,0.3) 0%, rgba(246,222,170,0) 65%)')} />
              <Twinkles n={10} w={330} h={140} seed={9} />
              <p style={sx('position: relative; margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #F6E3C0')}>Tu primer espejo · 2 semanas</p>
              <p style={sx('position: relative; margin: 10px 0 0; ' + ITALIC.replace('margin: 0; ', '') + '; font-size: 21px; line-height: 1.4')}>“{mirrorText}”</p>
              <button type="button" onClick={() => speak(mirrorText)} style={sx('position: relative; margin-top: 6px; min-height: 44px; padding: 0; border: none; background: transparent; display: flex; align-items: center; gap: 8px; color: #E6CDA3; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit')}>
                <Icon name="soundwave-linear" size={18} />{ui.speaking ? 'Escuchando … toca para parar' : 'Escúchalo con calma'}
              </button>
            </div>
          )}
          {loadingPatterns && ui.patState === 'loading' && (
            <div style={sx(CARD + '; align-items: center; text-align: center')}>
              <div aria-hidden="true" style={sx('height: 24px; display: flex; gap: 8px; align-items: center')}><span className="thinkdot" /><span className="thinkdot" /><span className="thinkdot" /></div>
              <p role="status" style={sx('margin: 0; font-size: 15px; color: #CDBFAE')}>Vela está mirando tus noches …</p>
            </div>
          )}
          {!demo && ui.patState === 'error' && (
            <div style={sx(CARD)}>
              <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #E6DACB')}>{patterns ? 'No pude actualizar tus patrones ahora. Te muestro los últimos.' : 'Ahora mismo no puedo mirar tus patrones a fondo. Te muestro lo que veo en este dispositivo.'}</p>
              <button type="button" onClick={retryPatterns} style={sx('align-self: flex-start; height: 38px; padding: 0 14px; border-radius: 19px; border: 1px solid rgba(245,239,228,0.2); background: transparent; color: #E6DACB; font-size: 13px; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px')}><Icon name="refresh-linear" size={15} />Reintentar</button>
            </div>
          )}
          <div>
            <p style={sx(LABEL + '; margin-bottom: 4px')}>{N >= 14 ? 'Tus patrones' : 'Tus primeros patrones'}</p>
            <div style={sx(`${GLASS}; border-radius: 22px; padding: 0 16px`)}>
              {rows.map((r, i) => (
                <Row key={r.title} orb={<Orb size={36} tone={r.tone}><Icon name={r.icon} size={17} /></Orb>} title={r.title} sub={r.sub} onClick={() => { update({ patOpen: i, patSel: 0 }); document.querySelectorAll('.scroller').forEach((el) => { el.scrollTop = 0; }); }} />
              ))}
            </div>
            <p style={sx('margin: 10px 0 0; font-size: 13px; color: #9C8F86; text-align: center')}>Entra en cada uno, a tu ritmo.</p>
          </div>
        </>
      )}
      {camino}
      {introBar}
      {!demo && N > 0 && (
        <p style={sx('margin: 0; font-size: 12px; color: #9C8F86; text-align: center')}>Última noche: {entries.length ? relLabel(entries[entries.length - 1].date, today) : '—'}</p>
      )}
    </TabPage>
  );
}
