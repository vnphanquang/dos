import { writable } from 'svelte/store';

import type { Action, Infection, SimulationContext } from '$shared/types';

import { transitionInfection } from './simulation.infection';

import { createInfectionPool } from '.';

export type Simulation = {
  infectionPool: Infection[];
  context: SimulationContext;
  infections: Infection[];
};

export function createSimulation(context: SimulationContext) {
  // TODO: save history of actions too?
  const history: Array<Simulation> = [];
  let infections: Infection[] = [];
  let infectionPool = createInfectionPool(
    context.totalInfections,
    context.infectionTransitionProbabilities.M0,
    context.infectionTransitionProbabilities.C0,
  );

  const { subscribe, set } = writable<Simulation>({
    context,
    infections,
    infectionPool,
  });

  return {
    subscribe,
    previous() {
      const popped = history.pop();
      if (!popped) return;
      ({ context, infectionPool, infections } = popped);
    },
    next(actions: Action[]) {
      history.push(
        structuredClone({
          context,
          infections,
          infectionPool,
        }),
      );

      // apply actions
      let infectionDelta = context.newInfectionBaseDelta;
      for (const action of actions) {
        context.hospitalCapacity.regular += action.hospitalCapacityDelta.regular;
        context.hospitalCapacity.icu += action.hospitalCapacityDelta.icu;
        for (const [key, value] of Object.entries(action.infectionTransitionProbabilityDelta)) {
          context.infectionTransitionProbabilities[
            key as keyof typeof context.infectionTransitionProbabilities
          ] += value;
        }
        infectionDelta += action.infectionDelta;
      }

      // transition existing infections
      infections = infections.map((i) =>
        transitionInfection(i, context.infectionTransitionProbabilities),
      );

      // random new infections
      const newInfections: Infection[] = [];
      if (infectionDelta > 0) {
        for (let i = 0; i < infectionDelta; i += 1) {
          const [spliced] = infectionPool.splice(Math.random() * infectionPool.length, 1);
          newInfections.push(spliced);
        }
      }
      infections.push(...newInfections);

      set({ context, infections, infectionPool });

      return newInfections;
    },
    history() {
      return [...history, { context, infections, infectionPool }];
    },
  };
}
