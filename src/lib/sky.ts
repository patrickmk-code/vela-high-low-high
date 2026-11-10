// Sternenhimmel und Mondphase – Funktionen 1:1 aus der Referenz (Prototipo v1).

export interface Star { x: number; y: number; s: number; o: number; g: number; d: number; dl: number }

export const STARS: Star[] = (() => {
  let seed = 7;
  const out: Star[] = [];
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 60; i++) {
    const t = Math.pow(rnd(), 1.7), y = Math.round(t * 470), big = rnd() > 0.88;
    out.push({
      x: Math.round(rnd() * 386), y, s: big ? 2.2 : rnd() > 0.5 ? 1.5 : 1,
      o: Math.round((0.75 - t * 0.55) * 100) / 100, g: big ? 4 : 1.5,
      d: Math.round((3 + rnd() * 5) * 10) / 10, dl: Math.round(rnd() * 6 * 10) / 10,
    });
  }
  return out;
})();

export function litPath19(p: number, illum: number): string {
  const r = 19, k = Math.cos(2 * Math.PI * p), rx = Math.round(Math.abs(k) * r * 100) / 100;
  if (illum < 0.02) return 'M0 0';
  if (illum > 0.98) return 'M0 -19A19 19 0 1 1 0 19A19 19 0 1 1 0 -19Z';
  if (p < 0.5) return 'M0 -19A19 19 0 0 1 0 19A' + rx + ' 19 0 0 ' + (p < 0.25 ? 0 : 1) + ' 0 -19Z';
  return 'M0 -19A19 19 0 0 0 0 19A' + rx + ' 19 0 0 ' + (p > 0.75 ? 1 : 0) + ' 0 -19Z';
}

export interface MoonInfo { d19: string; glow: number; name: string; pct: number; aria: string }

export function moonPhase(date: Date): MoonInfo {
  const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
  let age = ((date.getTime() - ref) / 86400000) % syn;
  if (age < 0) age += syn;
  const p = age / syn, k = Math.cos(2 * Math.PI * p);
  const illum = (1 - k) / 2;
  const names = ['Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante'];
  const name = names[Math.floor(((p + 1 / 16) % 1) * 8)];
  const pct = Math.round(illum * 100);
  return { d19: litPath19(p, illum), glow: Math.round((0.15 + illum * 0.85) * 100) / 100, name, pct, aria: `${name}, ${pct} % iluminada` };
}
