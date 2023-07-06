import { derived, writable } from 'svelte/store';

import { browser } from '$app/environment';
import {
  INFECTION_TRANSITION,
  type Action,
  type Infection,
  type InfectionState,
  type InfectionStats,
  type Simulation,
  type SimulationContext,
  type SimulationRuntime,
} from '$shared/types';

import {
  getSimulationHistory,
  getSimulationRuntime,
  setSimulationHistory,
  setSimulationRuntime,
} from './simulation.cache';
import { getInfectionStats, transitionInfection } from './simulation.infection';

import { createInfectionPool, downloadProgrammatically, recursiveTransform } from '.';

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
    const previousSimulation = history[history.length - 1];
    let previousInfections: Infection[] = [];
    if (previousSimulation) {
      previousInfections = previousSimulation.runtime.infections;
    }
    const newInfections = getNewInfections(s, h);

    const currentStats = getInfectionStats(s.runtime.infections);
    const previousStats = getInfectionStats(previousInfections);
    const newStats = getInfectionStats(newInfections);

    let tokenDelta = 0;
    if (previousSimulation) {
      tokenDelta = s.context.numTokens - previousSimulation.context.numTokens;
    }

    return {
      tokenDelta,
      infections: {
        current: currentStats,
        delta: recursiveTransform<number, InfectionStats>(
          currentStats,
          previousStats,
          (a, b) => a - b,
        ),
        new: newStats,
      },
    };
  });

  const stepStore = derived(historyStore, (h) => h.length);

  let transitions = initTransitions();
  const transitionStore = writable(transitions);

  const datavizStore = derived(historyStore, (history) => {
    // FIXME: mixing current simulation?
    const numInfections: Array<{ y: number; x: number }> = [];
    for (let i = 0; i < history.length; i++) {
      const simulation = history[i];
      numInfections.push({
        y: simulation.runtime.infections.length,
        x: i,
      });
    }

    return {
      numInfections,
    };
  });

  return {
    subscribe: simulationStore.subscribe,
    history: historyStore,
    newInfections: newInfectionsStore,
    stats: statsStore,
    step: stepStore,
    transitions: transitionStore,
    dataviz: datavizStore,
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
          queuedActions: s.runtime.queuedActions.filter((queuedAction) => {
            for (let i = 0; i < actions.length; i++) {
              if (queuedAction.id === actions[i].id) {
                actions.splice(i, 1);
                return false;
              }
            }
            return true;
          }),
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
        context.numTokens += action.tokenDelta;
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
    export(kind: 'actions' | 'progression') {
      const simulations = [...history, simulation];
      if (kind === 'actions') {
        let csvAction = 'data:text/csv;charset=utf-8,';
        csvAction +=
          'round,id,role,name,description,infection_delta,token_delta,hospital_capacity_delta\r\n';
        for (let i = 0; i < simulations.length; i++) {
          const simulation = simulations[i];
          const actions = simulation.runtime.queuedActions;
          for (const action of actions) {
            const row = [
              i,
              action.id,
              action.role,
              action.name ?? '',
              action.description ?? '',
              action.infectionDelta ?? 0,
              action.tokenDelta ?? 0,
            ];
            csvAction += row.join(',') + `\r\n`;
          }
        }
        downloadProgrammatically(csvAction, 'report_simulation_actions.csv');
        return;
      }

      if (kind === 'progression') {
        let csvAction = 'data:text/csv;charset=utf-8,';
        csvAction += `round,num_infections,num_mild,num_critical,num_death,num_recovered,num_icu,num_regular,num_tokens,${INFECTION_TRANSITION.map(
          (t) => `infection_transition_${t}`,
        ).join(',')}\r\n`;
        for (let i = 0; i < simulations.length; i++) {
          const simulation = simulations[i];
          const { infections } = simulation.runtime;
          const { hospitalCapacity, numTokens, infectionTransitionProbabilities } =
            simulation.context;
          const numMild = infections.filter((i) => i.state === 'mild').length;
          const numCritical = infections.filter((i) => i.state === 'critical').length;
          const numDeath = infections.filter((i) => i.state === 'dead').length;
          const numRecovered = infections.filter((i) => i.state === 'recovered').length;
          const row = [
            i,
            infections.length,
            numMild,
            numCritical,
            numDeath,
            numRecovered,
            hospitalCapacity.icu,
            hospitalCapacity.regular,
            numTokens,
            infectionTransitionProbabilities.M0,
            infectionTransitionProbabilities.C0,
            infectionTransitionProbabilities.MM,
            infectionTransitionProbabilities.MC,
            infectionTransitionProbabilities.MR,
            infectionTransitionProbabilities.CM,
            infectionTransitionProbabilities.CD,
            infectionTransitionProbabilities.CC,
          ];
          csvAction += row.join(',') + `\r\n`;
        }
        downloadProgrammatically(csvAction, 'report_simulation_progression_.csv');
        return;
      }
    },
  };
}
