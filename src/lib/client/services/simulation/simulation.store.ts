import { writable } from 'svelte/store';

import type { Infection, SimulationContext } from '$shared/types';

import { transitionInfection } from './simulation.infection';

export type Simulation = {
  context: SimulationContext;
  infections: Infection[];
};

export function createSimulation(context: SimulationContext) {
  const history: Array<Simulation> = [];
  let infections: Infection[] = [];

  const { subscribe, set } = writable<Simulation>({
    context,
    infections,
  });

  return {
    subscribe,
    previous() {
      const popped = history.pop();
      if (popped) set(popped);
    },
    next(newInfections: Infection[]) {
      history.push({ context, infections });
      infections = infections.map((i) =>
        transitionInfection(i, context.infectionTransitionProbabilities),
      );
      infections.push(...newInfections);
      set({ context, infections });
    },
    history() {
      return [...history, { context, infections }];
    },
  };
}
