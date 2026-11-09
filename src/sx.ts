import type { CSSProperties } from 'react';

// Wandelt einen CSS-String ("position: absolute; top: 54px") in ein React-Style-Objekt um.
// So bleiben die Styles nah an den Referenz-Prototypen und lassen sich 1:1 vergleichen.
const cache = new Map<string, CSSProperties>();

export function sx(css: string): CSSProperties {
  const hit = cache.get(css);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith('-')
      ? prop.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())
      : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = val;
  }
  if (cache.size > 4000) cache.clear();
  cache.set(css, out as CSSProperties);
  return out as CSSProperties;
}
