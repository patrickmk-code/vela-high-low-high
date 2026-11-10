// Tabs „Highs“ und „Diario“ im Patrones-Stil (Prototipo v1, Abschnitte 8 und 9).
import { useApp } from '../ctx';
import { sx } from '../sx';
import { Icon } from '../Icon';
import { CARD, GLASS, H1, INPUT, ITALIC, LABEL, PageHead, Sparkle, TabPage, Twinkles, Wave } from '../ui';
import { DEMO_DAYDATA, DEMO_PAST_HIGHS, DEMO_UPCOMING } from '../demo';
import { addDays, inDays, keyOf, longLabel, monthName, monthShort, parseKey, relLabel } from '../lib/dates';
import { hasContent, uid, type DayEntry, type Moment } from '../lib/store';

const label = (m: Moment) => m.text || (m.audioId ? 'Nota de voz' : '');

export function Highs() {
  const { data, setData, ui, update, today, demo, playBtn, toast } = useApp();

  const upcoming = demo
    ? DEMO_UPCOMING.map((u) => ({ id: 'd' + u.d, date: keyOf(new Date(2026, 10, u.d)), title: u.t }))
    : data.upcoming.filter((u) => u.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past: { date: string; m: Moment }[] = [];
  Object.values(data.days).sort((a, b) => b.date.localeCompare(a.date)).forEach((e) => {
    [...e.high2, ...e.high1].forEach((m) => { if (label(m)) past.push({ date: e.date, m }); });
  });
  const yearAgo = data.days[addDays(today, -365)];
  const yearMoment = demo ? { id: 'y', text: 'Una tarde en el lago con amigos', via: 'texto' as const } : yearAgo ? [...yearAgo.high1, ...yearAgo.high2].find((m) => label(m)) : undefined;

  const save = () => {
    const title = ui.upTitle.trim();
    if (!title) { toast('Escribe qué te hace ilusión.'); return; }
    if (!ui.upDate || ui.upDate < today) { toast('Elige hoy o un día que aún esté por llegar.'); return; }
    setData((d) => ({ ...d, upcoming: [...d.upcoming, { id: uid(), date: ui.upDate, title }] }));
    update({ upOpen: false, upTitle: '', upDate: addDays(today, 1) });
  };

  return (
    <TabPage>
      <PageHead label="Tus highs" title="Highs" text="Lo bueno que viene y lo bueno que ya fue." />
      <div>
        <p style={sx(LABEL + '; margin-bottom: 10px')}>Lo que viene</p>
        <div style={sx(`${GLASS}; border-radius: 22px; padding: 4px 16px`)}>
          {upcoming.length === 0 && !ui.upOpen && <p style={sx('margin: 0; padding: 14px 0 6px; font-size: 14px; line-height: 1.5; color: #9C8F86')}>La ilusión también es un high. Apunta aquí lo que te hace ilusión.</p>}
          {upcoming.map((u) => {
            const d = parseKey(u.date);
            return (
              <div key={u.id} data-testid="viene" style={sx('display: flex; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(245,239,228,0.06)')}>
                <div style={sx('width: 46px; height: 50px; border-radius: 14px; flex-shrink: 0; background: rgba(230,205,163,0.12); border: 1px solid rgba(230,205,163,0.28); display: flex; flex-direction: column; align-items: center; justify-content: center')}>
                  <span style={sx('font-size: 18px; font-weight: 700; color: #F6E3C0; line-height: 1')}>{d.getDate()}</span>
                  <span style={sx('font-size: 10px; color: #CDBFAE; text-transform: uppercase; letter-spacing: 0.08em')}>{monthShort(d.getMonth())}</span>
                </div>
                <div style={sx('flex-grow: 1; min-width: 0')}>
                  <p style={sx('margin: 0; font-size: 15px; font-weight: 600; line-height: 1.35')}>{u.title}</p>
                  <p style={sx('margin: 2px 0 0; font-size: 13px; color: #9C8F86')}>{inDays(u.date, demo ? keyOf(new Date(2026, 10, 9)) : today)}</p>
                </div>
                {!demo && <button type="button" aria-label={'Quitar ' + u.title} onClick={() => setData((dd) => ({ ...dd, upcoming: dd.upcoming.filter((x) => x.id !== u.id) }))} style={sx('width: 40px; height: 40px; border: none; background: transparent; color: #9C8F86; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0')}><Icon name="close-circle-linear" size={20} /></button>}
              </div>
            );
          })}
          {ui.upOpen ? (
            <div style={sx('display: flex; flex-direction: column; gap: 10px; padding: 12px 0')}>
              <input type="text" aria-label="Algo que te hace ilusión" placeholder="Algo que te hace ilusión …" value={ui.upTitle} autoFocus onChange={(e) => update({ upTitle: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') save(); }} style={sx(INPUT)} />
              <input type="date" aria-label="Fecha" value={ui.upDate} min={today} onChange={(e) => update({ upDate: e.target.value })} style={sx(INPUT + '; color-scheme: dark')} />
              <div style={sx('display: flex; gap: 10px')}>
                <button type="button" onClick={save} style={sx('height: 42px; padding: 0 20px; border-radius: 21px; border: none; background: #E6CDA3; color: #2B2430; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit')}>Guardar</button>
                <button type="button" onClick={() => update({ upOpen: false, upTitle: '' })} style={sx('height: 42px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer; font-family: inherit')}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => update({ upOpen: true })} style={sx('width: 100%; padding: 12px 0; border: none; background: transparent; color: #E6CDA3; font-size: 14px; font-weight: 700; text-align: left; cursor: pointer; font-family: inherit')}>+ Añadir algo que te ilusiona</button>
          )}
        </div>
      </div>

      {yearMoment && (
        <div style={sx('position: relative; overflow: hidden; border-radius: 24px; padding: 20px; background: radial-gradient(120% 120% at 0% 0%, rgba(230,205,163,0.22) 0%, rgba(58,44,70,0.5) 55%, rgba(30,24,40,0.6) 100%); border: 1px solid rgba(230,205,163,0.35); box-shadow: 0 0 24px -8px rgba(246,222,170,0.4)')}>
          <span aria-hidden="true" className="aurora" style={sx('position: absolute; left: -60px; top: -80px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(246,222,170,0.35) 0%, rgba(246,222,170,0) 65%)')} />
          <Twinkles n={12} w={320} h={120} />
          <div style={sx('position: relative; display: flex; gap: 14px; align-items: center')}>
            <span aria-hidden="true" style={sx('position: relative; width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center')}>
              <span style={sx('position: absolute; inset: -6px; border-radius: 50%; background: radial-gradient(circle, rgba(246,222,170,0.32) 0%, rgba(230,205,163,0) 70%)')} />
              <span style={sx('position: relative; width: 48px; height: 48px; border-radius: 50%; background: rgba(230,205,163,0.14); border: 1px solid rgba(230,205,163,0.4); color: #F6E3C0; display: flex; align-items: center; justify-content: center')}><Sparkle size={20} /></span>
            </span>
            <div style={sx('flex-grow: 1; min-width: 0')}>
              <p style={sx('margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #F6E3C0')}>Hace un año</p>
              <p style={sx("margin: 3px 0 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 20px; line-height: 1.25")}>{label(yearMoment)}</p>
            </div>
          </div>
          {'audioId' in yearMoment && yearMoment.audioId ? (
            <div style={sx('position: relative; margin-top: 14px; display: flex; align-items: center; gap: 10px; color: #E6CDA3; font-size: 13px; font-weight: 700')}>{playBtn(yearMoment.audioId, 32)}Escúchalo con tu voz</div>
          ) : (
            <div style={sx('position: relative; margin-top: 14px; display: flex; align-items: center; gap: 8px; color: #E6CDA3; font-size: 13px; font-weight: 700')}><Wave />{demo ? 'Escúchalo con tu voz · 0:42' : 'Lo escribiste hace un año'}</div>
          )}
        </div>
      )}

      <div>
        <p style={sx(LABEL + '; margin-bottom: 10px')}>Lo que fue</p>
        <div style={sx(`${GLASS}; border-radius: 22px; padding: 4px 16px`)}>
          {!demo && past.length === 0 && <p style={sx('margin: 0; padding: 14px 0; font-size: 14px; line-height: 1.5; color: #9C8F86')}>Aquí irán apareciendo tus highs, noche a noche.</p>}
          {(demo ? DEMO_PAST_HIGHS.map((h, i) => ({ k: 'p' + i, d: h.d, t: h.t, audio: undefined as string | undefined })) : past.slice(0, 60).map(({ date, m }) => ({ k: m.id, d: relLabel(date, today), t: label(m), audio: m.audioId }))).map((h) => (
            <div key={h.k} data-testid="fue" style={sx('display: flex; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(245,239,228,0.06)')}>
              <span aria-hidden="true" style={sx('position: relative; width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center')}>
                <span style={sx('position: absolute; inset: -6px; border-radius: 50%; background: radial-gradient(circle, rgba(246,222,170,0.32) 0%, rgba(230,205,163,0) 70%)')} />
                <span style={sx('position: relative; width: 36px; height: 36px; border-radius: 50%; background: rgba(230,205,163,0.14); border: 1px solid rgba(230,205,163,0.4); color: #F6E3C0; display: flex; align-items: center; justify-content: center')}><Sparkle /></span>
              </span>
              <div style={sx('flex-grow: 1; min-width: 0')}>
                <p style={sx('margin: 0; font-size: 12px; color: #9C8F86')}>{h.d}</p>
                <p style={sx("margin: 2px 0 0; font-family: 'Fraunces', serif; font-weight: 300; font-size: 17px; line-height: 1.35")}>{h.t}</p>
              </div>
              {h.audio ? playBtn(h.audio, 32) : <span aria-hidden="true" style={sx('color: #9C8F86; display: flex; flex-shrink: 0')}><Wave /></span>}
            </div>
          ))}
        </div>
      </div>
    </TabPage>
  );
}

export function Diario() {
  const { data, setData, ui, update, today, demo, playBtn, go } = useApp();
  const demoToday = keyOf(new Date(2026, 10, 9));
  const tday = demo ? demoToday : today;
  const [cy, cm] = demo ? [2026, 10] : ui.calMonth;
  const offset = (new Date(cy, cm, 1).getDay() + 6) % 7;
  const dim = new Date(cy, cm + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: dim }, (_, i) => keyOf(new Date(cy, cm, i + 1)))];
  const t = parseKey(tday);
  const isCurrent = cy === t.getFullYear() && cm === t.getMonth();
  const move = (delta: number) => {
    const d = new Date(cy, cm + delta, 1);
    const cur = d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
    update({ calMonth: [d.getFullYear(), d.getMonth()], selDay: keyOf(cur ? t : d) });
  };
  const selDay = demo && (!ui.selDay.startsWith('2026-11') || ui.selDay === today) ? demoToday : ui.selDay;

  const demoEntry = (k: string): DayEntry | undefined => {
    const n = parseKey(k).getDate();
    const dd = DEMO_DAYDATA[n];
    if (!dd || !k.startsWith('2026-11')) return undefined;
    const mk = (text: string): Moment => ({ id: k + text, text, via: 'texto' });
    return { date: k, high1: [mk(dd[0])], low: [mk(dd[1])], ask: [], high2: [mk(dd[2])], mirrors: {}, done: true, updatedAt: 0 };
  };
  const entryFor = (k: string) => (demo ? demoEntry(k) ?? data.days[k] : data.days[k]);
  const sel = entryFor(selDay);
  const special = !!data.special[selDay];
  const future = selDay > tday;
  const lines = sel ? ([['high1', 'High', '#F2B45A', 'rgba(242,180,90,0.6)'], ['low', 'Low', '#9FB4C8', 'rgba(159,180,200,0.5)'], ['high2', 'High', '#F2B45A', 'rgba(242,180,90,0.6)']] as const).map(([k, l, c, g]) => {
    const ms = [...sel[k], ...(k === 'low' ? sel.ask.map((m) => ({ ...m, text: m.text ? 'Te habría ayudado: ' + m.text : '' })) : [])].filter((m) => label(m));
    return { k, l, c, g, ms };
  }).filter((x) => x.ms.length) : [];

  const settingsBtn = (
    <button type="button" aria-label="Ajustes" onClick={() => go('settings')} style={sx('width: 40px; height: 40px; border-radius: 20px; border: 1px solid rgba(245,239,228,0.12); background: rgba(245,239,228,0.06); color: #CDBFAE; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0')}><Icon name="tuning-2-linear" size={19} /></button>
  );

  return (
    <TabPage>
      <PageHead label="Tus noches" title="Diario" text="Cada noche que encendiste la vela, guardada aquí." right={settingsBtn} />
      <div style={sx(`${GLASS}; padding: 16px 14px; border-radius: 22px; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0`)}>
        <div style={sx('display: flex; justify-content: space-between; align-items: center')}>
          <button type="button" aria-label="Mes anterior" disabled={demo} onClick={() => move(-1)} style={sx(`width: 36px; height: 36px; border-radius: 18px; border: none; background: transparent; color: #CDBFAE; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: ${demo ? 0.3 : 1}`)}><Icon name="alt-arrow-left-linear" size={18} /></button>
          <p data-testid="cal-mes" style={sx('margin: 0; font-size: 15px; font-weight: 700; color: #F5EFE4')}>{monthName(cm)} {cy}</p>
          <button type="button" aria-label="Mes siguiente" disabled={isCurrent || demo} onClick={() => move(1)} style={sx(`width: 36px; height: 36px; border-radius: 18px; border: none; background: transparent; color: #CDBFAE; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: ${isCurrent || demo ? 0.3 : 1}`)}><Icon name="alt-arrow-right-linear" size={18} /></button>
        </div>
        <div style={sx('display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px')}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((w, i) => <p key={i} style={sx('margin: 0; text-align: center; font-size: 11px; font-weight: 700; color: #9C8F86')}>{w}</p>)}
          {cells.map((k, i) => {
            if (!k) return <div key={'b' + i} />;
            const n = parseKey(k).getDate();
            const on = selDay === k, isT = k === tday, has = hasContent(entryFor(k)), fut = k > tday;
            return (
              <div key={k} style={sx('display: flex; justify-content: center')}>
                <button type="button" aria-label={`${n} de ${monthName(cm)}${has ? ', con momentos' : ''}${data.special[k] ? ', día especial' : ''}`} aria-pressed={on} onClick={() => update({ selDay: k })}
                  style={sx(`position: relative; width: 40px; height: 40px; border-radius: 20px; padding: 0; border: 1px solid ${isT && !on ? 'rgba(230,205,163,0.7)' : 'transparent'}; background: ${on ? 'radial-gradient(circle at 40% 35%, #F7E6C4 0%, #E6CDA3 60%, #C9A97A 100%)' : 'transparent'}; box-shadow: ${on ? '0 0 14px rgba(230,205,163,0.55)' : 'none'}; transition: all .35s ease; color: ${on ? '#2B2430' : fut ? '#7F736C' : '#F5EFE4'}; font-size: 14px; font-weight: ${isT ? 800 : 500}; cursor: pointer; font-family: inherit`)}>
                  {n}
                  <span aria-hidden="true" style={sx(`position: absolute; left: 50%; bottom: 4px; margin-left: -2px; width: 4px; height: 4px; border-radius: 2px; background: ${on ? '#2B2430' : '#E6CDA3'}; box-shadow: 0 0 5px ${on ? '#2B2430' : '#E6CDA3'}; opacity: ${has ? 1 : 0}`)} />
                  {data.special[k] && <span aria-hidden="true" style={sx('position: absolute; right: -3px; top: -5px; font-size: 11px; color: #F6E3C0; text-shadow: 0 0 6px rgba(246,222,170,0.8)')}>★</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div data-testid="dia-seleccionado" style={sx(CARD)}>
        <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 8px')}>
          <p style={sx(H1 + '; font-size: 22px')}>{longLabel(selDay)}</p>
          {!future && (
            <button type="button" aria-pressed={special} onClick={() => setData((d) => ({ ...d, special: { ...d.special, [selDay]: !d.special[selDay] } }))}
              style={sx(`height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid ${special ? 'rgba(230,205,163,0.6)' : 'rgba(245,239,228,0.14)'}; background: ${special ? 'rgba(230,205,163,0.16)' : 'rgba(245,239,228,0.05)'}; color: ${special ? '#F6E3C0' : '#CDBFAE'}; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: inherit`)}>
              {special ? '★ Día especial' : '☆ Marcar especial'}
            </button>
          )}
        </div>
        {lines.length > 0 ? lines.map((l) => (
          <div key={l.k} style={sx('display: flex; gap: 12px; align-items: flex-start')}>
            <span aria-hidden="true" style={sx(`margin-top: 5px; width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; background: ${l.c}; box-shadow: 0 0 8px ${l.g}`)} />
            <div style={sx('display: flex; flex-direction: column; gap: 4px; flex-grow: 1; min-width: 0')}>
              <p style={sx('margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{l.l}</p>
              {l.ms.map((m) => (
                <div key={m.id + m.text} style={sx('display: flex; gap: 10px; align-items: center')}>
                  <p style={sx(ITALIC + '; font-size: 16px; line-height: 1.4; flex-grow: 1')}>{label(m)}</p>
                  {m.audioId && playBtn(m.audioId, 28)}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <p style={sx('margin: 0; font-size: 14px; color: #CDBFAE')}>{future ? 'Este día aún no ha llegado.' : selDay === tday ? 'Esta noche aún no has encendido la vela.' : 'Este día no encendiste la vela. Está bien así.'}</p>
        )}
      </div>
      <button type="button" onClick={() => go('settings')} style={sx(`${GLASS}; min-height: 52px; padding: 0 16px; border-radius: 20px; display: flex; align-items: center; gap: 12px; color: #E6DACB; font-size: 15px; cursor: pointer; font-family: inherit`)}>
        <Icon name="tuning-2-linear" size={20} /><span style={sx('flex-grow: 1; text-align: left')}>Ajustes y privacidad</span><Icon name="alt-arrow-right-linear" size={16} />
      </button>
    </TabPage>
  );
}
