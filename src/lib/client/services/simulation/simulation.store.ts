import { derived, writable } from 'svelte/store';

import { browser } from '$app/environment';
import type {
  Action,
  Infection,
  InfectionState,
  InfectionStats,
  Simulation,
  SimulationContext,
  SimulationRuntime,
} from '$shared/types';

import {
  getSimulationHistory,
  getSimulationRuntime,
  setSimulationHistory,
  setSimulationRuntime,
} from './simulation.cache';
import { getInfectionStats, transitionInfection } from './simulation.infection';

import { createInfectionPool, recursiveTransform } from '.';

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

function initTransitions(): Record<InfectionState, number> {
  return {
    critical: 0,
    dead: 0,
    mild: 0,
    recovered: 0,
  };
}

function getNewInfections(simulation: Simulation, history: Simulation[]) {
  let newInfections: Infection[];
  if (history.length === 0) {
    newInfections = [];
  }
  const last = history[history.length - 1];
  const delta = simulation.runtime.infections.length - last?.runtime.infections.length ?? 0;
  newInfections = simulation.runtime.infections.slice(-delta);
  return newInfections;
}

export function createSimulation(context: SimulationContext) {
  let simulation: Simulation = {
    context,
    runtime: (browser && getSimulationRuntime()) || initRuntime(context),
  };

  const simulationStore = writable<Simulation>(simulation);
  simulationStore.subscribe((s) => {
    simulation = s;
    setSimulationRuntime(s.runtime);
  });

  let history = (browser && getSimulationHistory()) || [];
  const historyStore = writable<Simulation[]>(history);
  historyStore.subscribe((h) => {
    history = h;
    setSimulationHistory(h);
  });

  const newInfectionsStore = derived([simulationStore, historyStore], ([s, h]) =>
    getNewInfections(s, h),
  );

  const statsStore = derived([simulationStore, historyStore], ([s, h]) => {
    let previousInfections: Infection[] = [];
    if (history.length) {
      previousInfections = history[history.length - 1].runtime.infections;
    }
    const newInfections = getNewInfections(s, h);

    const currentStats = getInfectionStats(s.runtime.infections);
    const previousStats = getInfectionStats(previousInfections);
    const newStats = getInfectionStats(newInfections);

    return {
      current: currentStats,
      delta: recursiveTransform<number, InfectionStats>(
        currentStats,
        previousStats,
        (a, b) => a - b,
      ),
      new: newStats,
    };
  });

  const stepStore = derived(historyStore, (h) => h.length);

  let transitions = initTransitions();
  const transitionStore = writable(transitions);

  return {
    subscribe: simulationStore.subscribe,
    history: historyStore,
    newInfections: newInfectionsStore,
    stats: statsStore,
    step: stepStore,
    transitions: transitionStore,
    queueAction(action: Action) {
      simulationStore.update((s) => ({
        ...s,
        runtime: {
          ...s.runtime,
          queuedActions: s.runtime.queuedActions.concat(action),
        },
      }));
    },
    dequeueAction(...actions: Action[]) {
      simulationStore.update((s) => ({
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
      simulationStore.update((s) => ({
        ...s,
        runtime: {
          ...s.runtime,
          infections: s.runtime.infections.map((i) => (i.id === infection.id ? infection : i)),
        },
      }));
    },
    restart() {
      simulationStore.set({ context, runtime: initRuntime(context) });
      transitionStore.set(initTransitions());
      historyStore.set([]);
    },
    undo() {
      const popped = history.pop();
      if (!popped) return;
      simulationStore.set(popped);
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
      transitions = initTransitions();
      simulation.runtime.infections = simulation.runtime.infections.map((i) => {
        const newI = transitionInfection(i, context.infectionTransitionProbabilities);
        if (i.state === 'critical' && newI.state === 'dead') {
          transitions.dead += 1;
        } else if (i.state === 'mild' && newI.state === 'recovered') {
          transitions.recovered += 1;
        } else if (i.state === 'mild' && newI.state === 'critical') {
          transitions.critical += 1;
        } else if (i.state === 'critical' && newI.state === 'mild') {
          transitions.mild += 1;
        }
        return newI;
      });

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

      simulationStore.set({ ...simulation });
      transitionStore.set({ ...transitions });

      return newInfections;
    },
  };
}
