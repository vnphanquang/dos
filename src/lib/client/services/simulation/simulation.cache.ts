import type { SimulationContext, SimulationRuntime } from '$shared/types';

export const SESSION_STORAGE_KEYS = {
  SIMULATION: {
    CONTEXT: 'simulation:context',
    RUNTIME: 'simulation:runtime',
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

export function setSimulationRuntime(s: SimulationRuntime) {
  sessionStorage.setItem(SESSION_STORAGE_KEYS.SIMULATION.RUNTIME, JSON.stringify(s));
}

export function getSimulationRuntime(): SimulationRuntime | null {
  const s = sessionStorage.getItem(SESSION_STORAGE_KEYS.SIMULATION.RUNTIME);
  if (!s) return null;
  return JSON.parse(s) as SimulationRuntime;
}
