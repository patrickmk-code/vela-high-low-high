import type { PointerEvent, KeyboardEvent, MouseEvent } from 'react';
import { FPATH, FCORE } from './data';
import { sx } from './sx';

export interface CandleCfg {
  scale: number;
  fop: number;
  halo: number;
  warmHalo: number;
  coolHalo: number;
  warmF: number;
  goldF: number;
  coolF: number;
  ember: number;
  lightA: number;
}

interface Props {
  cfg: CandleCfg;
  top: number;
  scale: number;
  ringOp: number;
  ringOff: number;
  showWickHint: boolean;
  canHold: boolean;
  onHoldDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onHoldUp: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

const BODY = 'M138 312C136 300 160 296 195 297C232 296 254 301 253 313C257 360 250 412 255 462C256 474 232 481 195 481C158 481 134 475 136 462C141 410 132 362 138 312Z';

const noMenu = (e: MouseEvent) => e.preventDefault();

// Kerze, Variante A „Bienenwachs“ – SVG 1:1 aus der Referenz (Vela-ES.dc.html)
export function Candle({ cfg: c, top, scale, ringOp, ringOff, showWickHint, canHold, onHoldDown, onHoldUp, onKeyDown, onKeyUp }: Props) {
  return (
    <div
      style={{
        position: 'absolute', left: 0, top, width: 390, height: 520,
        transform: `scale(${scale})`, transformOrigin: '195px 0px',
        transition: 'top 1.4s ease, transform 1.4s ease',
      }}
    >
      <svg width="390" height="520" viewBox="0 0 390 520" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <defs>
          <radialGradient id="haloA"><stop offset="0" stopColor="#F2B45A" stopOpacity="0.55" /><stop offset="0.38" stopColor="#E39A5C" stopOpacity="0.2" /><stop offset="1" stopColor="#C08A6B" stopOpacity="0" /></radialGradient>
          <radialGradient id="haloCA"><stop offset="0" stopColor="#9FB4C8" stopOpacity="0.45" /><stop offset="1" stopColor="#9FB4C8" stopOpacity="0" /></radialGradient>
          <linearGradient id="warmA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#DC874E" /><stop offset="0.35" stopColor="#F0A24E" /><stop offset="0.75" stopColor="#F6C66E" /><stop offset="1" stopColor="#FBE0A0" stopOpacity="0.85" /></linearGradient>
          <linearGradient id="goldA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#F2B45A" /><stop offset="0.5" stopColor="#FFD47E" /><stop offset="1" stopColor="#FFF0C2" /></linearGradient>
          <linearGradient id="coolA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#7F98B4" /><stop offset="0.5" stopColor="#9FB4C8" /><stop offset="1" stopColor="#DCE5EA" stopOpacity="0.85" /></linearGradient>
          <linearGradient id="coreA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFFDF5" /><stop offset="0.7" stopColor="#FFF1CF" /><stop offset="1" stopColor="#FFE3A3" stopOpacity="0.7" /></linearGradient>
          <linearGradient id="bodyA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D4A27C" /><stop offset="1" stopColor="#AE785B" /></linearGradient>
          <linearGradient id="shadeA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4A2C24" stopOpacity="0.42" /><stop offset="0.32" stopColor="#4A2C24" stopOpacity="0" /><stop offset="0.7" stopColor="#4A2C24" stopOpacity="0" /><stop offset="1" stopColor="#4A2C24" stopOpacity="0.5" /></linearGradient>
          <radialGradient id="lightA" cx="0.5" cy="0" r="0.9"><stop offset="0" stopColor="#FFD9A0" stopOpacity="0.65" /><stop offset="1" stopColor="#FFD9A0" stopOpacity="0" /></radialGradient>
          <clipPath id="clipA"><path d={BODY} /></clipPath>
          <filter id="grainA" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} /><feColorMatrix type="saturate" values="0" /></filter>
          <filter id="blurA" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="softA" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="0.7" /></filter>
          <filter id="shadowA" x="-0.5" y="-2" width="2" height="5"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <g transform="translate(195 284)">
          <g style={{ transform: `scale(${c.halo})`, transformOrigin: '0px 0px', transition: 'transform 1.4s ease' }}>
            <circle cx="0" cy="-26" r="150" fill="url(#haloA)" style={{ opacity: c.warmHalo, transition: 'opacity 1.4s' }} />
            <circle cx="0" cy="-20" r="140" fill="url(#haloCA)" style={{ opacity: c.coolHalo, transition: 'opacity 1.4s' }} />
          </g>
        </g>
        <ellipse cx="197" cy="484" rx="82" ry="9" fill="#0E0A0D" opacity="0.55" filter="url(#shadowA)" />
        <path d={BODY} fill="url(#bodyA)" />
        <g clipPath="url(#clipA)">
          <rect x="120" y="290" width="150" height="200" filter="url(#grainA)" opacity="0.13" />
          <g fill="none" stroke="#7E5040" strokeOpacity="0.24" strokeWidth="1.1" strokeLinecap="round">
            <path d="M120 334C160 330 220 339 272 333" />
            <path d="M120 357C165 353 214 361 272 355" />
            <path d="M120 380C158 377 222 384 272 378" />
            <path d="M120 403C168 399 210 407 272 401" />
            <path d="M120 426C160 423 220 430 272 424" />
            <path d="M120 449C166 445 214 453 272 447" />
            <path d="M120 471C160 468 222 475 272 469" />
          </g>
          <path d="M232 302C235 360 229 420 234 480" fill="none" stroke="#6E4334" strokeOpacity="0.3" strokeWidth="1.4" />
          <rect x="120" y="290" width="150" height="200" fill="url(#shadeA)" />
          <rect x="120" y="290" width="150" height="200" fill="url(#lightA)" style={{ opacity: c.lightA, transition: 'opacity 1.4s' }} />
        </g>
        <path d="M140 309C142 301 166 299 195 300C226 299 250 302 251 310C247 316 226 318 195 318C166 318 144 316 140 309Z" fill="#E3BD95" />
        <ellipse cx="195" cy="308" rx="34" ry="5" fill="#EDD0AC" />
        <path d="M151 309C147 322 148 338 151 345C154 351 159 346 159 336C159 324 160 315 165 311Z" fill="#D9AD86" />
        <g transform="translate(195 284)">
          <path d="M0 15C-1 9 1 4 0 -2" stroke="#2E211D" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="0" cy="-2" r="14" fill="url(#haloA)" style={{ opacity: c.ember, transition: 'opacity .4s' }} />
          <g style={{ transform: `scale(${c.scale})`, transformOrigin: '0px 0px', opacity: c.fop, transition: 'transform 1.4s ease, opacity 1s ease' }}>
            <g className="flickA">
              <path d={FPATH} fill="#F2B45A" opacity="0.32" filter="url(#blurA)" />
              <path d={FPATH} fill="url(#warmA)" style={{ opacity: c.warmF, transition: 'opacity 1.4s' }} />
              <path d={FPATH} fill="url(#goldA)" style={{ opacity: c.goldF, transition: 'opacity 1.4s' }} />
              <path d={FPATH} fill="url(#coolA)" style={{ opacity: c.coolF, transition: 'opacity 1.4s' }} />
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
        <div aria-hidden="true" style={sx('position: absolute; left: 175px; top: 261px; width: 40px; height: 40px; pointer-events: none')}>
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
      {canHold && (
        <button
          type="button"
          className="wick"
          aria-label="Encender a Vela: mantén pulsada la mecha"
          onPointerDown={onHoldDown}
          onPointerUp={onHoldUp}
          onPointerCancel={onHoldUp}
          onLostPointerCapture={onHoldUp}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onContextMenu={noMenu}
          style={sx('position: absolute; left: 135px; top: 200px; width: 120px; height: 140px; border-radius: 60px; border: none; background: transparent; cursor: pointer')}
        />
      )}
    </div>
  );
}
