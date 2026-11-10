// Inhalte aus projekt/v1/reference/proto/Vela-ES.dc.html (Prototipo v1).
// Werden im Testmodus (?noches=N) gezeigt und dienen als Rückfall, wenn noch keine eigenen Daten/KI-Ergebnisse da sind.

export const BTN = '#E6CDA3';
export const LILA = '#C9B6E4';

export interface InQ { src: 'highs' | 'lows' | 'filo'; th: string; k: string; q: string; why: string; c: string; tint: string }

export const INQ: InQ[] = [
  { src: 'lows', th: 'calma', k: 'De tus lows', q: '¿Qué parte de tus prisas viene de fuera, y qué parte viene de ti?', why: 'Las prisas aparecen en 5 de tus lows.', c: '#9FB4C8', tint: 'rgba(159,180,200,0.14)' },
  { src: 'highs', th: 'conocerte', k: 'De tus highs', q: '¿Qué tienen en común las personas con las que te sientes en casa?', why: 'Casi todos tus highs tienen personas.', c: '#F2B45A', tint: 'rgba(242,180,90,0.14)' },
  { src: 'filo', th: 'cuestionar', k: 'Para pensar despacio', q: 'Si nadie te viera, ¿qué harías distinto mañana?', why: 'Una pregunta para ver lo que eliges tú.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
  { src: 'lows', th: 'calma', k: 'De tus lows', q: '¿Qué estás sosteniendo que podrías soltar esta noche?', why: 'Los lunes te pesan más desde hace 2 semanas.', c: '#9FB4C8', tint: 'rgba(159,180,200,0.14)' },
  { src: 'filo', th: 'horizonte', k: 'Para pensar despacio', q: '¿Qué sería para ti una vida buena, no perfecta?', why: 'Sin respuestas correctas.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
  { src: 'highs', th: 'claridad', k: 'De tus highs', q: 'Caminar te da calma. ¿Qué encuentras ahí que te falta en otros lugares?', why: 'Cuando caminas, al día siguiente hablas más de calma.', c: '#F2B45A', tint: 'rgba(242,180,90,0.14)' },
];

/** Philosophische Fragen – funktionieren für alle, auch ohne Auswertung. */
export const INQ_FILO: InQ[] = [
  INQ[2], INQ[4],
  { src: 'filo', th: 'conocerte', k: 'Para pensar despacio', q: '¿Cuándo fue la última vez que te sentiste en casa dentro de ti?', why: 'Sin respuestas correctas.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
  { src: 'filo', th: 'calma', k: 'Para pensar despacio', q: '¿Qué podrías dejar sin hacer mañana, y no pasaría nada?', why: 'Una pregunta para soltar.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
  { src: 'filo', th: 'claridad', k: 'Para pensar despacio', q: '¿Qué sabes hoy que hace un año no sabías?', why: 'Para mirar el camino.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
  { src: 'filo', th: 'horizonte', k: 'Para pensar despacio', q: '¿Qué te gustaría que fuera más fácil dentro de un año?', why: 'Mirar hacia delante, sin prisa.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
  { src: 'filo', th: 'cuestionar', k: 'Para pensar despacio', q: '¿Qué «debería» llevas contigo que quizá no es tuyo?', why: 'Para ver lo que eliges tú.', c: '#C9B6E4', tint: 'rgba(201,182,228,0.16)' },
];

export const INTH = [
  { id: 'todo', label: 'Para ti' }, { id: 'claridad', label: 'Claridad' }, { id: 'calma', label: 'Calma' },
  { id: 'conocerte', label: 'Conocerte' }, { id: 'cuestionar', label: 'Cuestionar' }, { id: 'horizonte', label: 'Horizonte' },
];

export const SUPPORT = [
  { ic: '♡', t: 'Hablar con alguien de confianza', s: 'Un amigo o alguien de tu familia. Te ayudo a empezar.', href: 'sms:' },
  { ic: 'Ψ', t: 'Buscar un psicólogo', s: 'Profesionales cerca de ti, también online', href: 'https://www.google.com/search?q=psic%C3%B3logo+cerca+de+m%C3%AD' },
  { ic: '☎', t: 'Teléfono de la Esperanza', s: '717 003 717 · escucha 24 h', href: 'tel:717003717' },
  { ic: '024', t: 'Línea 024', s: 'Si piensas en hacerte daño · gratis, 24 h', href: 'tel:024' },
  { ic: '112', t: 'Emergencias', s: 'Si estás en peligro ahora', href: 'tel:112' },
];

export const REFL = [
  { k: 'Introspección', q: 'Si tu low de hoy pudiera hablar, ¿qué te pediría?' },
  { k: 'Espejo', q: '¿Qué te dirías si fueras tu mejor amigo esta noche?' },
  { k: 'Pregunta de la semana', q: '¿Qué necesitas ahora mismo que no te estás dando?' },
  { k: 'Mirar atrás', q: '¿Qué high de este mes te gustaría repetir pronto?' },
];

export const INSPO = [
  { k: 'Pensamiento', t: 'No tienes que entenderlo todo hoy. Basta con haberlo mirado.' },
  { k: 'Pequeño gesto', t: 'Mañana, cinco minutos al aire libre antes de mirar el móvil.' },
  { k: 'Para tu low', t: 'Lo que te pesa también dice lo que te importa.' },
];

/** Stufen-Karten „Qué verás, noche a noche“ (Día 0/1). */
export const ROADMAP: { n: number | null; title: string; line: string; tone: 'beige' | 'gold' | 'blue' | 'lila'; icon: string }[] = [
  { n: 1, title: 'Tus noches', line: 'Tus highs y lows, noche a noche.', tone: 'beige', icon: 'noches' },
  { n: 1, title: 'Tus buenos momentos', line: 'Vuelve a escuchar tus highs.', tone: 'gold', icon: 'momentos' },
  { n: 3, title: 'Lo que más aparece', line: 'Las palabras que se repiten.', tone: 'gold', icon: 'palabras' },
  { n: 5, title: 'Tu energía', line: 'Qué te llena y qué te vacía.', tone: 'gold', icon: 'energia' },
  { n: 7, title: 'Tus patrones', line: 'Qué te pesa, y cuándo.', tone: 'blue', icon: 'patrones' },
  { n: 7, title: 'Más de esto', line: 'Impulsos a partir de tus highs.', tone: 'gold', icon: 'mas' },
  { n: 14, title: 'Tu espejo', line: 'Dos semanas tuyas, en pocas palabras.', tone: 'beige', icon: 'espejo' },
  { n: 14, title: 'Introspección', line: 'Preguntas que te acercan a ti.', tone: 'lila', icon: 'intro' },
  { n: null, title: 'No estás solo', line: 'Ayuda, siempre que la necesites.', tone: 'blue', icon: 'apoyo' },
];

// ---------- Demo-Inhalte je Stufe ----------
export const DEMO_D3 = {
  nights: [['Lun', 'Café con Lucía', 'Una reunión que se alargó'], ['Mar', 'Música en el tren', 'Prisas toda la mañana'], ['Mié', 'Paseo con amigos', 'Cansancio por la tarde']] as [string, string, string][],
  highWords: [['amigos', 2], ['paseo', 1], ['música', 1]] as [string, number][],
  lowWords: [['cansancio', 2], ['prisas', 1], ['reuniones', 1]] as [string, number][],
  blurred: 'Tus highs casi siempre tienen que ver con personas.',
};
export const DEMO_D5 = {
  give: ['Amigos', 'Aire libre'], take: ['Prisas', 'Poco sueño'],
  blurred: 'Los lunes suelen pesar más. Quizá por las prisas.',
};

/** [Name, Häufigkeit, Satz, Detail, 's'|'d'] */
export type EnergyItem = [string, number, string, string, 's' | 'd'];
export const DEMO_ENERGY: Record<'7' | '14', EnergyItem[]> = {
  '7': [['Amigos', 5, 'Aparece en 5 de tus 7 highs.', 'Última vez: el sábado, cena con amigos.', 's'], ['Aire libre', 3, 'Aparece en 3 de tus 7 highs.', 'Última vez: paseo al atardecer.', 's'], ['Música', 2, 'Aparece en 2 de tus 7 highs.', 'Última vez: música en el tren.', 's'], ['Prisas', 4, 'Aparece en 4 de tus 7 lows.', 'Sobre todo por la mañana.', 'd'], ['Poco sueño', 3, 'Aparece en 3 de tus 7 lows.', 'Suele ir después de noches cortas.', 'd'], ['Lunes', 2, 'Pesa más los lunes.', 'Quizá por empezar la semana con prisa.', 'd']],
  '14': [['Amigos', 9, 'Aparece en 9 de tus 14 highs.', 'Lo que más te llena estas dos semanas.', 's'], ['Naturaleza', 6, 'Aparece en 6 de tus 14 highs.', 'Al día siguiente hablas más de calma.', 's'], ['Música', 4, 'Aparece en 4 de tus 14 highs.', 'Sobre todo de camino a casa.', 's'], ['Cocinar', 2, 'Aparece en 2 de tus 14 highs.', 'Nuevo esta semana.', 's'], ['Prisas', 7, 'Aparece en 7 de tus 14 lows.', 'Sobre todo por la mañana.', 'd'], ['Poco sueño', 5, 'Aparece en 5 de tus 14 lows.', 'Suele ir después de noches cortas.', 'd'], ['Lunes', 4, 'Pesa más los lunes.', 'Dos semanas seguidas.', 'd'], ['Pantallas', 2, 'Aparece en 2 de tus 14 lows.', 'Tarde por la noche.', 'd']],
};

export const DEMO_MIRROR = 'Estas dos semanas te han sostenido las personas. Lo que más te ha pesado fue no tener tiempo para ti.';

/** Wochenbalken Día 14 (Highs, Lows je Wochentag, Mo–So) */
export const DEMO_WEEK: [number, number][] = [[1, 3], [2, 2], [3, 1], [2, 1], [3, 1], [4, 1], [4, 0]];

export const DEMO_UPCOMING = [
  { d: 13, t: 'Por fin viernes: tarde libre' },
  { d: 14, t: 'Concierto con Ana' },
  { d: 28, t: 'Escapada a la costa' },
];

export const DEMO_DAYDATA: Record<number, [string, string, string]> = {
  1: ['Desayuno largo con música', 'Llovió todo el día', 'Llamar a la abuela'],
  2: ['Un café con Marta', 'Mucho tráfico al volver', 'Empezar un libro nuevo'],
  3: ['Terminé el proyecto a tiempo', 'Dolor de cabeza por la tarde', 'Cena tranquila en casa'],
  4: ['En el lago, por fin al aire libre', 'Prisas por la mañana', 'Ver una peli'],
  6: ['Paseo al atardecer', 'Una discusión en el trabajo', 'Ya llega el fin de semana'],
  7: ['Cena con amigos', 'Poco sueño', 'La excursión del domingo'],
  8: ['Excursión a la montaña', 'Cansancio al volver', 'Una semana tranquila'],
};

export const DEMO_PAST_HIGHS = [
  { d: 'Sábado', t: 'Cena con amigos' },
  { d: '4 de noviembre', t: 'En el lago, por fin al aire libre' },
  { d: '2 de noviembre', t: 'Una mañana tranquila con café' },
];
