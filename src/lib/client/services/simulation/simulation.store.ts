import { writable } from 'svelte/store';

import type { Infection, SimulationSettings } from '$shared/types';

import { transitionInfection } from './simulation.infection';

export type Simulation = {
  settings: SimulationSettings;
  infections: Infection[];
};

export function createSimulation(settings: SimulationSettings) {
  const history: Array<Simulation> = [];
  let infections: Infection[] = [];

  const { subscribe, set } = writable<Simulation>({
    settings,
    infections,
  });

  return {
    subscribe,
    previous() {
      const popped = history.pop();
      if (popped) set(popped);
    },
    next(newInfections: Infection[]) {
      history.push({ settings, infections });
      infections = infections.map((i) =>
        transitionInfection(i, settings.infectionTransitionProbabilities),
      );
      infections.push(...newInfections);
      set({ settings, infections });
    },
    history() {
      return [...history, { settings, infections }];
    },
  };
}
