import type { Engine } from '../engine/Engine';

// The single engine instance, for UI components that need to command the camera.
export const engineRef: { current: Engine | null } = { current: null };

export function go(id: string) {
  engineRef.current?.select(id);
}
