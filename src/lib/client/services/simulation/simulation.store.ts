import { writable } from 'svelte/store';

import { browser } from '$app/environment';
import type { Action, Infection, Simulation, SimulationContext } from '$shared/types';

import {
  getSimulationRuntime,
  setSimulationContext,
  setSimulationRuntime,
} from './simulation.cache';
import { transitionInfection } from './simulation.infection';

import { createInfectionPool } from '.';

export type SimulationStore = ReturnType<typeof createSimulation>;

export function createSimulation(context: SimulationContext) {
  // TODO: save history of actions too?
  const history: Array<Simulation> = [];

  let simulation: Simulation = {
    context,
    runtime: (browser && getSimulationRuntime()) || {
      queuedActions: [],
      infectionPool: createInfectionPool(
        context.totalInfections,
        context.infectionTransitionProbabilities.M0,
        context.infectionTransitionProbabilities.C0,
      ),
      infections: [],
    },
  };

  const { subscribe, set, update } = writable<Simulation>(simulation);

  subscribe((s) => {
    simulation = s;
    setSimulationContext(s.context);
    setSimulationRuntime(s.runtime);
  });

  return {
    subscribe,
    history: {
      undo() {
        const popped = history.pop();
        if (!popped) return;
        simulation = popped;
      },
      // TODO: support forwarding (redo) with history
    },
    queueAction(action: Action) {
      update((s) => ({
        ...s,
        runtime: {
          ...s.runtime,
          queuedActions: s.runtime.queuedActions.concat(action),
        },
      }));
    },
    dequeueAction(...actions: Action[]) {
      update((s) => ({
        ...s,
        runtime: {
          ...s.runtime,
          queuedActions: s.runtime.queuedActions.filter((a) => !actions.includes(a)),
        },
      }));
    },
    getInfectionById(id: string) {
      return simulation.runtime.infections.find((i) => i.id === id);
    },
    updateInfection(infection: Infection) {
      update((s) => ({
        ...s,
        runtime: {
          ...s.runtime,
          infections: s.runtime.infections.map((i) => (i.id === infection.id ? infection : i)),
        },
      }));
    },
    next() {
      history.push(structuredClone(simulation));

      // apply actions
      let infectionDelta = context.newInfectionBaseDelta;
      for (const action of simulation.runtime.queuedActions) {
        context.hospitalCapacity.regular += action.hospitalCapacityDelta.regular;
        context.hospitalCapacity.icu += action.hospitalCapacityDelta.icu;
        for (const [key, value] of Object.entries(action.infectionTransitionProbabilityDelta)) {
          context.infectionTransitionProbabilities[
            key as keyof typeof context.infectionTransitionProbabilities
          ] += value;
        }
        infectionDelta += action.infectionDelta;
      }
      simulation.runtime.queuedActions = [];

      // transition existing infections
      simulation.runtime.infections = simulation.runtime.infections.map((i) =>
        transitionInfection(i, context.infectionTransitionProbabilities),
      );

      // random new infections
      const newInfections: Infection[] = [];
      if (infectionDelta > 0) {
        for (let i = 0; i < infectionDelta; i += 1) {
          const [spliced] = simulation.runtime.infectionPool.splice(
            Math.random() * simulation.runtime.infectionPool.length,
            1,
          );
          newInfections.push(spliced);
        }
      }
      simulation.runtime.infections.push(...newInfections);

      set(simulation);

      return newInfections;
    },
  };
}
