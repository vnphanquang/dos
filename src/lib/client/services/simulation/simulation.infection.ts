import type { HospitalBed, Infection, InfectionTransition } from '$shared/types';

import { randomizeFromProbabilities } from './simulation.utils';

export function categorizeInfectionsByHospitalization(
  infections: Infection[],
): Record<HospitalBed | 'none', Infection[]> {
  return infections.reduce(
    (acc, infection) => {
      const { hospitalization } = infection;
      if (hospitalization === null) {
        acc.none.push(infection);
      } else {
        acc[hospitalization].push(infection);
      }
      return acc;
    },
    { none: [], regular: [], icu: [] } as Record<HospitalBed | 'none', Infection[]>,
  );
}

export function getInfectionTransitions(
  infection: Pick<Infection, 'state' | 'hospitalization'>,
): InfectionTransition[] | null {
  const { state, hospitalization } = infection;
  if (state === 'dead' || state === 'recovered') {
    return null;
  }
  if (state === 'mild' && hospitalization === null) {
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
  if (state === 'critical' && hospitalization === null) {
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
