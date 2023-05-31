import type {
  Hospitalization,
  Infection,
  InfectionState,
  InfectionStats,
  InfectionTransition,
} from '$shared/types';

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

export function categorizeInfectionsByHospitalization(
  infections: Infection[],
): Record<Hospitalization, Infection[]> {
  return infections.reduce(
    (acc, infection) => {
      const { hospitalization } = infection;
      if (hospitalization === 'none') {
        acc.none.push(infection);
      } else {
        acc[hospitalization].push(infection);
      }
      return acc;
    },
    { none: [], regular: [], icu: [] } as Record<Hospitalization, Infection[]>,
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
      byHospitalization: infections.reduce(
        (acc, current) => {
          acc[current.hospitalization]++;
          return acc;
        },
        {
          icu: 0,
          none: 0,
          regular: 0,
        } as Record<Hospitalization, number>,
      ),
    };
  }

  // by hospitalization
  const byHospitalization = categorizeInfectionsByHospitalization(infections);
  const byHospitalizationStats = {} as InfectionStats['byHospitalization'];
  for (const [hospitalization, infections] of Object.entries(byHospitalization) as Array<
    [Hospitalization, Infection[]]
  >) {
    byHospitalizationStats[hospitalization] = {
      total: infections.length,
      byState: infections.reduce(
        (acc, current) => {
          acc[current.state]++;
          return acc;
        },
        {
          critical: 0,
          dead: 0,
          mild: 0,
          recovered: 0,
        } as Record<InfectionState, number>,
      ),
    };
  }

  return {
    total: infections.length,
    byState: byStateStats,
    byHospitalization: byHospitalizationStats,
  };
}

export function getInfectionTransitions(
  infection: Pick<Infection, 'state' | 'hospitalization'>,
): InfectionTransition[] | null {
  const { state, hospitalization } = infection;
  if (state === 'dead' || state === 'recovered') {
    return null;
  }
  if (state === 'mild' && hospitalization === 'none') {
    return ['M1', 'C1', 'R0'];
  }
  if (state === 'mild' && hospitalization === 'regular') {
    return ['M2', 'C2', 'R1'];
  }
  if (state === 'critical' && hospitalization === 'regular') {
    return ['C3', 'D0'];
  }
  if (state === 'critical' && hospitalization === 'icu') {
    return ['M3', 'C4', 'D1'];
  }
  if (state === 'critical' && hospitalization === 'none') {
    return ['D2'];
  }
  return null;
}

export function transitionInfection(
  infection: Infection,
  probabilitySettings: Record<InfectionTransition, number>,
): Infection {
  const { hospitalization } = infection;
  let { state } = infection;

  let transitions = getInfectionTransitions({ state, hospitalization });
  if (transitions === null) return infection;

  const transition = randomizeFromProbabilities(
    transitions.map((t) => [t, probabilitySettings[t]]),
  );

  if (transition.startsWith('M')) state = 'mild';
  else if (transition.startsWith('C')) state = 'critical';
  else if (transition.startsWith('R')) state = 'recovered';
  else state = 'dead';

  transitions = getInfectionTransitions({ state, hospitalization });

  return { state, hospitalization };
}
