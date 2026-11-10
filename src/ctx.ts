import { createContext, useContext, type ReactNode } from 'react';
import type { InputPhase, Phase } from './data';
import type { AppData, Via } from './lib/store';

export interface Answer {
  text: string;
  via: Via;
  audioId?: string;
  seconds?: number;
}

export type DayKey = 'high1' | 'low' | 'high2';

export interface UI {
  phase: Phase;
  prog: number;
  typing: boolean;
  rec: boolean;
  recSec: number;
  liveText: string;
  breathing: boolean;
  relight: boolean;
  ritualDate: string | null;
  leaving: boolean;
  answers: Record<InputPhase, Answer | null>;
  mirrorText: Partial<Record<InputPhase, string>>;
  mirrored: Record<InputPhase, boolean>;
  reflecting: InputPhase | null;
  askHelp: boolean;
  notice: string | null;
  adding: DayKey | null;
  draft: string;
  dayOpen: boolean;
  selDay: string;
  calMonth: [number, number];
  patIdx: number;
  patOpen: number;
  patSel: number;
  patState: 'idle' | 'loading' | 'error';
  enAdding: '' | 's' | 'd';
  enDraft: string;
  reflIdx: number;
  supOpen: boolean;
  inStage: 'home' | 'ask' | 'done' | 'refl';
  inQ: number;
  inAns: string;
  playing: string | null;
  speaking: boolean;
  upOpen: boolean;
  upTitle: string;
  upDate: string;
  confirmDelete: boolean;
  toast: string | null;
  demoNights: number | null;
}

export interface Ctx {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
  ui: UI;
  update: (p: Partial<UI> | ((s: UI) => Partial<UI>)) => void;
  today: string;
  /** Nächte mit Vela (echt oder im Testmodus vorgegeben) */
  nights: number;
  /** Testmodus mit Demo-Inhalten aus der Referenz */
  demo: boolean;
  go: (ph: Phase) => void;
  tabGo: (ph: Phase) => void;
  toast: (msg: string) => void;
  playBtn: (id: string, size?: number) => ReactNode;
  speak: (text: string) => void;
  retryPatterns: () => void;
}

export const AppCtx = createContext<Ctx | null>(null);
export const useApp = (): Ctx => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppCtx fehlt');
  return c;
};
