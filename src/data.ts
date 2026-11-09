// Inhalte, Texte und Demo-Daten – 1:1 aus projekt/02_Claude-Code-Brief/reference/Vela-ES.dc.html

export const GOLD = '#F2B45A';
export const COOL = '#9FB4C8';

export type InputPhase = 'high1' | 'low' | 'ask' | 'high2';
export type Phase =
  | 'lock' | 'intro' | 'home' | 'lighting' | 'lit'
  | InputPhase
  | 'mirror' | 'remind' | 'now' | 'stay' | 'journal' | 'blow' | 'sleep'
  | 'review' | 'highs';

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

export const FALL: Record<'high1' | 'low' | 'high2', string> = {
  high1: 'Un paseo al sol',
  low: 'Una reunión pesada',
  high2: 'Ganas de que llegue el viernes',
};

// [flameScale, coolness, haloScale, warmHalo]
export const F: Partial<Record<Phase, [number, number, number, number]>> = {
  lock: [0, 0, 0.6, 0.25],
  intro: [0, 0, 0.6, 0.25], home: [0, 0, 0.6, 0.25], lit: [1, 0, 1, 1],
  high1: [1.3, 0, 1.3, 1], low: [0.68, 0, 0.75, 0.55], ask: [0.68, 0, 0.75, 0.55], high2: [1.15, 0, 1.18, 1],
  mirror: [1, 0, 1, 1], remind: [1, 0, 1, 1], now: [1.2, 0, 1.5, 1], stay: [1.3, 0, 1.7, 1], blow: [1.3, 0, 1.7, 1],
  journal: [1.2, 0, 1.6, 1], sleep: [0, 0, 0.55, 0.15], review: [0, 0, 0.6, 0.2], highs: [0, 0, 0.6, 0.2],
};

export const MT: Record<InputPhase, string> = {
  high1: 'Hoy te sentó bien esto: {t}',
  low: 'Hoy te pesó esto: {t}',
  ask: 'Te habría venido bien: {t}',
  high2: 'Te llevas algo bonito: {t}',
};

export const MV: Record<InputPhase, string> = {
  high1: 'Un paseo al sol te regaló hoy un poco de calma.',
  low: 'La reunión te quitó energía; sentiste que todo te llegaba a la vez.',
  ask: 'Una pausa corta, solo para ti, te habría sentado bien.',
  high2: 'Te hace ilusión el viernes y el tiempo con amigos.',
};

export const SUGG = ['Una pausa corta', 'Hablar con alguien', 'Tomar aire fuera', 'Decir que no a algo'];

export const DEMO2: Record<'high1' | 'low' | 'high2', string> = {
  high1: 'La llamada con tu madre te hizo reír.',
  low: 'Dormiste poco y se notó todo el día.',
  high2: '',
};

export const JUMPS_FIRST: [string, Phase][] = [
  ['Inicio', 'intro'], ['Mecha', 'home'], ['High', 'high1'], ['Low', 'low'], ['Pregunta', 'ask'], ['High 2', 'high2'],
  ['Tu día', 'mirror'], ['Recordatorio', 'remind'], ['Opciones', 'now'], ['Vela', 'stay'], ['Diario', 'journal'],
  ['Apagar', 'blow'], ['Resumen', 'review'], ['Highs', 'highs'],
];
export const JUMPS_RECURRING: [string, Phase][] = [['Notificación', 'lock'], ...JUMPS_FIRST.slice(1)];

export const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const DAYDATA: Record<number, [string, string, string]> = {
  1: ['Desayuno largo con música', 'Llovió todo el día', 'Llamar a la abuela'],
  2: ['Un café con Marta', 'Mucho tráfico al volver', 'Empezar un libro nuevo'],
  3: ['Terminé el proyecto a tiempo', 'Dolor de cabeza por la tarde', 'Cena tranquila en casa'],
  4: ['En el lago, por fin al aire libre', 'Prisas por la mañana', 'Ver una peli'],
  6: ['Paseo al atardecer', 'Una discusión en el trabajo', 'Ya llega el fin de semana'],
  7: ['Cena con amigos', 'Poco sueño', 'La excursión del domingo'],
  8: ['Excursión a la montaña', 'Cansancio al volver', 'Una semana tranquila'],
};

export interface SrcItem { n: string; f: string; d: string; m: string[] }
export interface DrainItem { n: string; f: string; d: string; w: string; h: string[] }

export const SRC: SrcItem[] = [
  { n: 'Naturaleza', f: 'A menudo · sobre todo el fin de semana', d: 'Estar al aire libre aparece a menudo en tus highs, sobre todo los fines de semana.', m: ['Un paseo al sol · lun', 'En el lago · 4 nov', 'Excursión a la montaña · 8 nov'] },
  { n: 'Amigos', f: 'A menudo', d: 'El tiempo con amigos te recarga, sobre todo las cenas tranquilas.', m: ['Cena con amigos · 7 nov', 'Un café con Marta · 2 nov'] },
  { n: 'Calma por la mañana', f: 'A veces', d: 'Las mañanas lentas te dan un buen comienzo.', m: ['Desayuno largo con música · 1 nov'] },
  { n: 'Cocinar', f: 'A veces', d: 'Cocinar con calma te ayuda a desconectar.', m: ['Cena tranquila en casa · 3 nov'] },
];

export const DRAIN: DrainItem[] = [
  { n: 'Prisas', f: 'A menudo · sobre todo los lunes', d: 'Las prisas aparecen a menudo en tus lows, sobre todo a principios de semana.', w: 'Lunes y martes, muchas veces por la tarde.', h: ['«Una pausa corta fuera.»', '«Hablar con alguien.»'] },
  { n: 'Poco sueño', f: 'A veces · entre semana', d: 'Cuando duermes poco, el día se te hace más largo.', w: 'Entre semana.', h: ['«Acostarme antes.»'] },
  { n: 'Muchas reuniones', f: 'A veces · por la tarde', d: 'Los días con muchas reuniones te dejan sin energía.', w: 'Por la tarde.', h: ['«Bloquear un rato solo para mí.»'] },
];

export const MORE = [
  'Hace tiempo que no sales a la naturaleza. ¿Te apetece un paseo esta semana?',
  'Las cenas con amigos te sientan bien. ¿Quedas con alguien el fin de semana?',
  'Los lunes suelen ir con prisas. ¿Y si reservas diez minutos solo para ti antes de empezar?',
];

export const UPCOMING = [
  { d: '13', m: 'nov', t: 'Por fin viernes: tarde libre', s: 'en 4 días' },
  { d: '14', m: 'nov', t: 'Concierto con Ana', s: 'en 5 días' },
  { d: '28', m: 'nov', t: 'Escapada a la costa', s: 'en 19 días' },
];

export const PAST_HIGHS = [
  { d: 'Sábado', t: 'Cena con amigos' },
  { d: '4 de noviembre', t: 'En el lago, por fin al aire libre' },
  { d: '2 de noviembre', t: 'Una mañana tranquila con café' },
];

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
