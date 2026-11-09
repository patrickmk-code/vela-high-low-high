import { useEffect, useState } from 'react';

export interface Layout {
  mobile: boolean;
  /** Skalierung der Bühne */
  s: number;
  /** Bühnenbreite in Design-Pixeln (mind. 390) */
  W: number;
  /** Bühnenhöhe in Design-Pixeln */
  H: number;
  /** vertikaler Stauchfaktor für Bildschirme, die kürzer als 844 Design-Pixel sind (≤ 1) */
  v: number;
}

const DESIGN_W = 390;
const DESIGN_H = 844;
const MIN_H = 700; // darunter wird lieber verkleinert als gestaucht

function measure(): Layout {
  const vw = window.innerWidth;
  const vh = window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight;
  const mobile = vw < 600 || (window.matchMedia('(pointer: coarse)').matches && vw < 900);

  if (!mobile) {
    // Desktop: Telefon-Rahmen 390 × 844, falls nötig verkleinert
    const s = Math.min(1, (vh - 48) / DESIGN_H);
    return { mobile, s, W: DESIGN_W, H: DESIGN_H, v: 1 };
  }

  // Mobil: Vollbild. Breite füllen; nur bei sehr kurzen Screens zusätzlich verkleinern.
  const s = Math.min(vw / DESIGN_W, vh / MIN_H);
  const W = vw / s;
  const H = vh / s;
  const v = Math.min(1, H / DESIGN_H);
  return { mobile, s, W, H, v };
}

export function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>(measure);
  useEffect(() => {
    const on = () => {
      const next = measure();
      // Tastatur auf dem Handy verkleinert visualViewport – dann nicht neu layouten (sonst springt alles)
      const ae = document.activeElement;
      if (next.mobile && ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) return;
      setLayout(next);
    };
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return layout;
}
