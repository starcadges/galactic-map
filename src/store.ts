import { create } from 'zustand';

// Low-frequency bridge between the engine and the HUD.
// The engine never re-renders React per frame; it publishes at ~8 Hz or on events.

export interface HoverInfo {
  id: string;
  name: string;
  kind: string;
  sub?: string;
  x: number;
  y: number;
  distanceLy?: number;
}

export type LabelMode = 'all' | 'major' | 'none';

export interface ViewInfo {
  distance: number; // camera ↔ focus, ly
  target: [number, number, number];
  scaleName: string;
  regionId: string | null;
  fps: number;
}

export interface AppState {
  ready: boolean;
  loadStage: string;
  webglError: string | null;
  view: ViewInfo;
  hover: HoverInfo | null;
  selectedId: string | null;
  /** navigation history for the back affordance */
  trail: string[];
  searchOpen: boolean;
  chronicleOpen: boolean;
  activeEventId: string | null;
  panelOpen: boolean;
  labels: LabelMode;
  showRoutes: boolean;
  showTerritories: boolean;
  showTraffic: boolean;
  reducedMotion: boolean;
  sound: boolean;
  quality: 'high' | 'balanced';
  helpOpen: boolean;
  era: string | null;
  set: (p: Partial<AppState>) => void;
}

const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useStore = create<AppState>((set) => ({
  ready: false,
  loadStage: 'Waking the cartographic engine',
  webglError: null,
  view: { distance: 300_000, target: [0, 0, 0], scaleName: 'Galactic', regionId: null, fps: 60 },
  hover: null,
  selectedId: null,
  trail: [],
  searchOpen: false,
  chronicleOpen: false,
  activeEventId: null,
  panelOpen: true,
  labels: 'all',
  showRoutes: true,
  showTerritories: true,
  showTraffic: true,
  reducedMotion: !!prefersReduced,
  sound: false,
  quality: 'high',
  helpOpen: false,
  era: null,
  set: (p) => set(p),
}));

export const getState = () => useStore.getState();
