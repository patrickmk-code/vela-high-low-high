// Gemeinsame Bausteine des v1-Designs: Glas-Karten, leuchtende Kugel (Leitmotiv), Seitenkopf, Funkelsterne.
import type { ReactNode } from 'react';
import { sx } from './sx';
import { Icon } from './Icon';

export const BEIGE = '#E6CDA3';
export const GLASS = 'backdrop-filter: blur(16px) saturate(130%); -webkit-backdrop-filter: blur(16px) saturate(130%); background: rgba(245,239,228,0.06); border: 1px solid rgba(245,239,228,0.08)';
export const CARD = `${GLASS}; padding: 18px; border-radius: 22px; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0`;
export const LABEL = 'margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE';
export const H1 = "margin: 0; font-family: 'Fraunces', serif; font-weight: 300";
export const ITALIC = "margin: 0; font-family: 'Fraunces', serif; font-style: italic; font-weight: 300";
export const PRIMARY = `height: 52px; border-radius: 26px; border: none; background: ${BEIGE}; color: #2B2430; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit`;
export const GHOST = 'height: 44px; padding: 0 18px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.2); background: transparent; color: #E6DACB; font-size: 14px; cursor: pointer; font-family: inherit';
export const BACKLINK = 'align-self: flex-start; height: 36px; padding: 0 12px 0 4px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; display: flex; align-items: center; gap: 2px; cursor: pointer; font-family: inherit';
export const INPUT = "height: 44px; padding: 0 14px; border-radius: 22px; border: 1px solid rgba(245,239,228,0.2); background: rgba(245,239,228,0.05); color: #F5EFE4; font-family: 'Nunito Sans', sans-serif; font-size: 16px; min-width: 0";

export const TONE = {
  beige: { c: '#E6CDA3', rgb: '230,205,163', light: '#F6E3C0' },
  gold: { c: '#F2B45A', rgb: '242,180,90', light: '#F6D49A' },
  blue: { c: '#9FB4C8', rgb: '159,180,200', light: '#C9D6E2' },
  lila: { c: '#C9B6E4', rgb: '201,182,228', light: '#E9DCFA' },
} as const;
export type Tone = keyof typeof TONE;

/** Kleiner leuchtender Punkt vor Seiten-Labels. */
export function Dot({ tone = 'beige', size = 8 }: { tone?: Tone; size?: number }) {
  const t = TONE[tone];
  return <span aria-hidden="true" className="orb" style={sx(`width: ${size}px; height: ${size}px; border-radius: ${size / 2}px; flex-shrink: 0; background: ${t.light}; box-shadow: 0 0 8px 2px rgba(${t.rgb},0.6)`)} />;
}

/** Leuchtende Kugel mit Symbol (Leitmotiv). state: on = warm, next = lila pulsierend, off = gedimmt */
export function Orb({ size = 40, tone = 'beige', state = 'on', children }: { size?: number; tone?: Tone; state?: 'on' | 'next' | 'off'; children?: ReactNode }) {
  if (state === 'off') {
    return <span aria-hidden="true" style={sx(`position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0; border-radius: 50%; border: 1px solid rgba(245,239,228,0.18); background: rgba(43,36,48,0.6); color: #7F736C; display: flex; align-items: center; justify-content: center`)}>{children}</span>;
  }
  const t = state === 'next' ? TONE.lila : TONE[tone];
  const glow = state === 'next' ? 'rgba(237,227,248,0.4)' : `rgba(${t.rgb},0.34)`;
  return (
    <span aria-hidden="true" style={sx(`position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0; display: flex; align-items: center; justify-content: center`)}>
      <span className={state === 'next' ? 'orb' : undefined} style={sx(`position: absolute; inset: -${Math.round(size / 5)}px; border-radius: 50%; background: radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 70%)`)} />
      <span style={sx(`position: relative; width: ${size}px; height: ${size}px; border-radius: 50%; background: rgba(${t.rgb},0.13); border: 1px solid rgba(${t.rgb},0.5); color: ${t.light}; display: flex; align-items: center; justify-content: center`)}>{children}</span>
    </span>
  );
}

export const Spiral = ({ size = 24, sw = 1.5 }: { size?: number; sw?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12.2c0-.9.8-1.4 1.5-1 1 .5 1 2 .2 2.8-1.2 1.2-3.3.9-4.2-.5-1.3-1.9-.5-4.5 1.5-5.4 2.6-1.2 5.6.3 6.4 3 .9 3.1-1.1 6.4-4.3 7-3.7.7-7.2-1.8-7.7-5.5" />
  </svg>
);

export const Sparkle = ({ size = 16 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /></svg>
);

export const Wave = ({ size = 18 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" /></svg>
);

/** Feld kleiner funkelnder Sterne (deterministisch). */
export function Twinkles({ n = 14, w = 340, h = 160, color = '#FFF4DE', seed = 3 }: { n?: number; w?: number; h?: number; color?: string; seed?: number }) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const stars = Array.from({ length: n }, () => ({ x: Math.round(rnd() * w), y: Math.round(rnd() * h), sz: rnd() > 0.7 ? 2 : 1.5, o: 0.4 + rnd() * 0.5, d: 3 + rnd() * 3.5, dl: rnd() * 4 }));
  return (
    <div aria-hidden="true" style={sx('position: absolute; inset: 0; pointer-events: none')}>
      {stars.map((t, i) => (
        <span key={i} style={sx(`position: absolute; left: ${t.x}px; top: ${t.y}px; width: ${t.sz}px; height: ${t.sz}px; opacity: ${t.o.toFixed(2)}`)}>
          <span className="twk" style={sx(`display: block; width: 100%; height: 100%; border-radius: 50%; background: ${color}; box-shadow: 0 0 3px ${color}; animation-duration: ${t.d.toFixed(1)}s; animation-delay: ${t.dl.toFixed(1)}s`)} />
        </span>
      ))}
    </div>
  );
}

/** Seitenkopf: „● LABEL“ / Titel / Satz, optional rechts ein Element. */
export function PageHead({ label, title, text, right, tone = 'beige' }: { label: string; title: string; text: string; right?: ReactNode; tone?: Tone }) {
  return (
    <div style={sx('display: flex; flex-direction: column; gap: 6px')}>
      <p style={sx(`margin: 0; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: ${TONE[tone].c}`)}><Dot tone={tone} />{label}</p>
      <div style={sx('display: flex; justify-content: space-between; align-items: center; gap: 10px')}>
        <h1 style={sx(H1 + '; font-size: 30px')}>{title}</h1>
        {right}
      </div>
      <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #CDBFAE')}>{text}</p>
    </div>
  );
}

/** Scrollbarer Tab-Inhalt mit Kopf-Fade (Prototipo v1). */
export function TabPage({ children, fadeTop = true }: { children: ReactNode; fadeTop?: boolean }) {
  return (
    <>
      <div className="tabin scroller" style={sx('position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; -webkit-overflow-scrolling: touch')}>
        <div style={sx('padding: 58px 20px 150px; display: flex; flex-direction: column; gap: 22px')}>{children}</div>
      </div>
      {fadeTop && <div aria-hidden="true" style={sx('position: absolute; left: 0; right: 0; top: 0; height: 96px; background: linear-gradient(to bottom, rgba(10,9,24,0.96) 0%, rgba(10,9,24,0.75) 45%, rgba(10,9,24,0) 100%); pointer-events: none')} />}
    </>
  );
}

export function Row({ orb, title, sub, onClick, right }: { orb: ReactNode; title: string; sub?: string; onClick?: () => void; right?: ReactNode }) {
  const inner = (
    <>
      {orb}
      <span style={sx('display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0; text-align: left')}>
        <span style={sx('font-size: 16px; font-weight: 700; color: #F5EFE4')}>{title}</span>
        {sub && <span style={sx('font-size: 13px; color: #9C8F86')}>{sub}</span>}
      </span>
      {right ?? (onClick && <span style={sx('color: #9C8F86; display: flex; flex-shrink: 0')}><Icon name="alt-arrow-right-linear" size={18} /></span>)}
    </>
  );
  const st = 'width: 100%; padding: 14px 0; border: none; border-bottom: 1px solid rgba(245,239,228,0.06); background: transparent; display: flex; gap: 14px; align-items: center; font-family: inherit';
  return onClick
    ? <button type="button" onClick={onClick} style={sx(st + '; cursor: pointer')}>{inner}</button>
    : <div style={sx(st)}>{inner}</div>;
}
