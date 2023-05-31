import type { SimulationContext } from '$shared/types';

export const SESSION_STORAGE_KEYS = {
  SIMULATION: {
    CONTEXT: 'simulation:context',
  },
} as const;

export function setSimulationContext(s: SimulationContext) {
  sessionStorage.setItem(SESSION_STORAGE_KEYS.SIMULATION.CONTEXT, JSON.stringify(s));
}

export function getSimulationContext(): SimulationContext | null {
  const s = sessionStorage.getItem(SESSION_STORAGE_KEYS.SIMULATION.CONTEXT);
  if (!s) return null;
  return JSON.parse(s) as SimulationContext;
}
