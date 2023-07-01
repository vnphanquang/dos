import type { Infection, InfectionState, InfectionStats, InfectionTransition } from '$shared/types';

import { randomizeFromProbabilities } from './simulation.utils';

export function categorizeInfectionsByState(
  infections: Infection[],
): Record<Infection['state'], Infection[]> {
  return infections.reduce(
    (acc, infection) => {
      acc[infection.state].push(infection);
      return acc;
    },
    {
      mild: [],
      critical: [],
      dead: [],
      recovered: [],
    } as Record<Infection['state'], Infection[]>,
  );
}

export function getInfectionStats(infections: Infection[]): InfectionStats {
  // by state
  const byState = categorizeInfectionsByState(infections);
  const byStateStats: InfectionStats['byState'] = {} as InfectionStats['byState'];
  for (const [state, infections] of Object.entries(byState) as Array<
    [InfectionState, Infection[]]
  >) {
    byStateStats[state] = {
      total: infections.length,
    };
  }

  return {
    total: infections.length,
    byState: byStateStats,
  };
}

export function getInfectionTransitions(
  infection: Pick<Infection, 'state'>,
): InfectionTransition[] | null {
  const { state } = infection;
  if (state === 'mild') {
    return ['MC', 'MR', 'MM'];
  }
  if (state === 'critical') {
    return ['CD', 'CM', 'CC'];
  }
  return null;
}

export function transitionInfection(
  infection: Infection,
  probabilitySettings: Record<InfectionTransition, number>,
): Infection {
  let { state } = infection;

  const transitions = getInfectionTransitions({ state });
  if (transitions === null) return infection;

  const transition = randomizeFromProbabilities(
    transitions.map((t) => [t, probabilitySettings[t]]),
  );

  if (transition.endsWith('M')) state = 'mild';
  else if (transition.endsWith('C')) state = 'critical';
  else if (transition.endsWith('R')) state = 'recovered';
  else state = 'dead';

  return { ...infection, state };
}
