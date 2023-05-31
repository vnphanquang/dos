import { browser } from '$app/environment';
import { createSimulation, type SimulationStore } from '$client/services/simulation';
import { getSimulationContext } from '$client/services/simulation/simulation.cache';
import { LOAD_DEPENDENCIES } from '$shared/constants';

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ depends, data }) => {
  depends(LOAD_DEPENDENCIES.SIMULATION.CONTEXT);
  let simulation: SimulationStore | null = null;
  if (browser) {
    const context = getSimulationContext();
    if (context) simulation = createSimulation(context);
  }
  return { simulation, ...data };
};
