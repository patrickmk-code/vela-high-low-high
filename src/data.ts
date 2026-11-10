// Texte und Ablauf-Parameter – 1:1 aus projekt/02_Claude-Code-Brief/reference/Vela-ES.dc.html

export const GOLD = '#F2B45A';
export const COOL = '#9FB4C8';

export type InputPhase = 'high1' | 'low' | 'ask' | 'high2';
export type Phase =
  | 'lock' | 'intro' | 'home' | 'lighting' | 'lit'
  | InputPhase
  | 'mirror' | 'remind' | 'now' | 'stay' | 'journal' | 'blow' | 'sleep'
  | 'review' | 'highs' | 'patterns' | 'inward' | 'settings';

export interface InputDef {
  eb: string;
  t: string;
  s: string;
  dot: number;
  next: Phase;
  back: InputPhase | null;
  skip: string | null;
  skipTo?: InputPhase;
}

export const IN: Record<InputPhase, InputDef> = {
  high1: { eb: 'High', t: '¿Qué fue hoy un buen momento?', s: 'Puede ser algo muy pequeño.', dot: 0, next: 'low', back: null, skip: null },
  low: { eb: 'Low', t: '¿Y qué fue difícil hoy?', s: 'Puedes dejarlo aquí, sin más.', dot: 1, next: 'ask', back: 'high1', skip: 'Saltar hoy', skipTo: 'high2' },
  ask: { eb: '', t: 'Suena agotador.', s: '¿Qué te habría sentado bien en ese momento?', dot: 1, next: 'high2', back: 'low', skip: 'Saltar', skipTo: 'high2' },
  high2: { eb: 'High', t: 'Terminemos con algo bonito.', s: '¿Qué más fue bonito hoy? ¿O qué te hace ilusión?', dot: 2, next: 'mirror', back: 'low', skip: null },
};

export function isInputPhase(p: Phase): p is InputPhase {
  return p === 'high1' || p === 'low' || p === 'ask' || p === 'high2';
}

// [flameScale, coolness, haloScale, warmHalo]
export const F: Partial<Record<Phase, [number, number, number, number]>> = {
  lock: [0, 0, 0.6, 0.25],
  intro: [0, 0, 0.6, 0.25], home: [0, 0, 0.6, 0.25], lit: [1, 0, 1, 1],
  high1: [1.3, 0, 1.3, 1], low: [0.68, 0, 0.75, 0.55], ask: [0.68, 0, 0.75, 0.55], high2: [1.15, 0, 1.18, 1],
  mirror: [1, 0, 1, 1], remind: [1, 0, 1, 1], now: [1.2, 0, 1.5, 1], stay: [1.3, 0, 1.7, 1], blow: [1.3, 0, 1.7, 1],
  journal: [1.2, 0, 1.6, 1], settings: [0, 0, 0.6, 0.2], patterns: [0, 0, 0.6, 0.2], inward: [0, 0, 0.6, 0.2], sleep: [0, 0, 0.55, 0.15], review: [0, 0, 0.6, 0.2], highs: [0, 0, 0.6, 0.2],
};

export const SUGG = ['Una pausa corta', 'Hablar con alguien', 'Tomar aire fuera', 'Decir que no a algo'];

export const JUMPS_FIRST: [string, Phase][] = [
  ['Inicio', 'intro'], ['Mecha', 'home'], ['High', 'high1'], ['Low', 'low'], ['Pregunta', 'ask'], ['High 2', 'high2'],
  ['Tu día', 'mirror'], ['Recordatorio', 'remind'], ['Opciones', 'now'], ['Vela', 'stay'], ['Diario (escribir)', 'journal'],
  ['Apagar', 'blow'], ['Highs', 'highs'], ['Patrones', 'patterns'], ['Diario', 'review'], ['Dentro', 'inward'], ['Ajustes', 'settings'],
];
export const JUMPS_RECURRING: [string, Phase][] = [['Notificación', 'lock'], ...JUMPS_FIRST.slice(1)];

export const NIGHT_STEPS = [0, 1, 3, 5, 7, 14, 18, 22, 26, 28, 30];

export const SPOTIFY_URL = 'https://open.spotify.com/search/piano%20tranquilo';

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

// Flammenpfad: Breite w, Höhe h, Neigung l
export function fp(w: number, h: number, l: number): string {
  return 'M0 0C' + r2(-w * 0.55) + ' 0 ' + r2(-w * 0.56 + l * 0.08) + ' ' + r2(-h * 0.36) + ' ' + r2(-w * 0.32 + l * 0.3) + ' ' + r2(-h * 0.6) +
    'C' + r2(-w * 0.14 + l * 0.6) + ' ' + r2(-h * 0.8) + ' ' + r2(l * 0.85 - w * 0.03) + ' ' + r2(-h * 0.93) + ' ' + r2(l) + ' ' + r2(-h) +
    'C' + r2(l * 0.85 + w * 0.05) + ' ' + r2(-h * 0.9) + ' ' + r2(w * 0.16 + l * 0.6) + ' ' + r2(-h * 0.78) + ' ' + r2(w * 0.32 + l * 0.3) + ' ' + r2(-h * 0.6) +
    'C' + r2(w * 0.56 + l * 0.08) + ' ' + r2(-h * 0.36) + ' ' + r2(w * 0.55) + ' 0 0 0Z';
}

export const FPATH = fp(22, 58, 0);
export const FCORE = fp(9, 24, 0);
