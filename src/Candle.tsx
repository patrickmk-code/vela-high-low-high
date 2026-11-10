import { FPATH, FCORE } from './data';
import { BACK, CLIP, DEFS, TOP } from './candleArt';
import { sx } from './sx';

export interface CandleCfg {
  scale: number;
  fop: number;
  halo: number;
  warmHalo: number;
  coolHalo: number;
  ember: number;
  lightA: number;
}

interface Props {
  cfg: CandleCfg;
  top: number;
  scale: number;
  opacity: number;
  ringOp: number;
  ringOff: number;
  showWickHint: boolean;
}

const EASE = 'cubic-bezier(0.45, 0.05, 0.2, 1)';

// Kerze „handgemacht“ (Prototipo v1) – SVG aus der Referenz, Bewegungen weich (2.4 s)
export function Candle({ cfg: c, top, scale, opacity, ringOp, ringOff, showWickHint }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: 0, top, width: 390, height: 520, pointerEvents: 'none',
        transform: `scale(${scale})`, transformOrigin: '195px 0px', opacity,
        transition: `top 2.4s ${EASE}, transform 2.4s ${EASE}, opacity .7s ease`,
      }}
    >
      <svg width="390" height="520" viewBox="0 0 390 520" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <defs dangerouslySetInnerHTML={{ __html: DEFS }} />
        <g transform="translate(195 284)">
          <g style={{ transform: `scale(${c.halo})`, transformOrigin: '0px 0px', transition: 'transform 1.4s ease' }}>
            <circle cx="0" cy="-26" r="150" fill="url(#haloA)" style={{ opacity: c.warmHalo, transition: 'opacity 1.4s' }} />
            <circle cx="0" cy="-20" r="140" fill="url(#haloCA)" style={{ opacity: c.coolHalo, transition: 'opacity 1.4s' }} />
          </g>
        </g>
        <g dangerouslySetInnerHTML={{ __html: BACK }} />
        <g clipPath="url(#clipA)">
          <g dangerouslySetInnerHTML={{ __html: CLIP }} />
          <rect x="120" y="290" width="150" height="230" fill="url(#lightA)" style={{ opacity: c.lightA, transition: 'opacity 1.4s' }} />
        </g>
        <g dangerouslySetInnerHTML={{ __html: TOP }} />
        <g transform="translate(195 284)">
          <path d="M0 15C-1 9 1 4 0 -2" stroke="#2E211D" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="0" cy="-2" r="14" fill="url(#haloA)" style={{ opacity: c.ember, transition: 'opacity .4s' }} />
          <g style={{ transform: `scale(${c.scale})`, transformOrigin: '0px 0px', opacity: c.fop, transition: 'transform 1.4s ease, opacity 1s ease' }}>
            <g className="flickA">
              <path d={FPATH} fill="#F2B45A" opacity="0.32" filter="url(#blurA)" />
              <path d={FPATH} fill="url(#warmA)" />
              <path d={FCORE} fill="url(#coreA)" filter="url(#softA)" />
            </g>
          </g>
          <circle
            cx="0" cy="-14" r="42" fill="none" stroke="#F2B45A" strokeWidth="2" strokeLinecap="round"
            pathLength={1} strokeDasharray="1 1" strokeDashoffset={ringOff} transform="rotate(-90 0 -14)"
            style={{ opacity: ringOp, transition: 'opacity .6s' }}
          />
        </g>
      </svg>
      {showWickHint && (
        <div style={sx('position: absolute; left: 175px; top: 261px; width: 40px; height: 40px')}>
          <span className="hintglow" style={sx('position: absolute; left: -10px; top: -10px; width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle, rgba(246,198,110,0.4) 0%, rgba(246,198,110,0.12) 45%, rgba(246,198,110,0) 70%)')} />
          <div className="hintfinger" style={sx('position: absolute; left: 5px; top: 16px; width: 34px; height: 44px')}>
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none" stroke="#F5EFE4" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V7a3 3 0 0 1 6 0v12" />
              <path d="M18 17a3 3 0 0 1 6 0v4" />
              <path d="M24 20a3 3 0 0 1 6 0v6c0 8-5 14-12 14h-1c-5 0-8-3-10-7l-4-8a2.6 2.6 0 0 1 4.3-2.8L12 28" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
