import { writable } from 'svelte/store';

import { browser } from '$app/environment';
import type {
  Action,
  Infection,
  Simulation,
  SimulationContext,
  SimulationRuntime,
} from '$shared/types';

import {
  getSimulationHistory,
  getSimulationRuntime,
  setSimulationContext,
  setSimulationHistory,
  setSimulationRuntime,
} from './simulation.cache';
import { transitionInfection } from './simulation.infection';

import { createInfectionPool } from '.';

export type SimulationStore = ReturnType<typeof createSimulation>;

function initRuntime(context: SimulationContext): SimulationRuntime {
  return {
    queuedActions: [],
    infectionPool: createInfectionPool(
      context.totalInfections,
      context.infectionTransitionProbabilities.M0,
      context.infectionTransitionProbabilities.C0,
    ),
    infections: [],
  };
}

export function createSimulation(context: SimulationContext) {
  let simulation: Simulation = {
    context,
    runtime: (browser && getSimulationRuntime()) || initRuntime(context),
  };

  const { subscribe, set, update } = writable<Simulation>(simulation);

  subscribe((s) => {
    simulation = s;
    setSimulationContext(s.context);
    setSimulationRuntime(s.runtime);
  });

  let history = (browser && getSimulationHistory()) || [];
  const historyStore = writable<Simulation[]>(history);
  historyStore.subscribe((h) => {
    history = h;
    setSimulationHistory(h);
  });

  return {
    subscribe,
    history: historyStore,
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
    restart() {
      set({ context, runtime: initRuntime(context) });
      historyStore.set([]);
    },
    undo() {
      const popped = history.pop();
      if (!popped) return;
      set(popped);
      historyStore.set([...history]);
    },
    // TODO: support forwarding (redo) with history??
    next() {
      history.push(structuredClone(simulation));
      historyStore.set([...history]);

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
      if (infectionDelta > 0 && simulation.runtime.infectionPool.length > 0) {
        for (let i = 0; i < infectionDelta; i += 1) {
          const [spliced] = simulation.runtime.infectionPool.splice(
            Math.random() * simulation.runtime.infectionPool.length,
            1,
          );
          if (!spliced) break;
          newInfections.push(spliced);
        }
      }
      simulation.runtime.infections.push(...newInfections);

      set({ ...simulation });

      return newInfections;
    },
    end() {
      //
    },
  };
}
