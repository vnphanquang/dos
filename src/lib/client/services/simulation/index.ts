import type { Infection } from '$shared/types';
import { shuffle } from '$shared/utils/shuffle';

export function createInfectionPool(
  total: number,
  mildPercent: number,
  criticalPercent: number,
): Infection[] {
  const totalFractions = mildPercent + criticalPercent;
  const numMild = Math.floor(total * (mildPercent / totalFractions));
  const numCritical = total - numMild;
  const infections: Infection[] = [];
  for (let i = 0; i < numMild; i += 1) {
    infections.push({ state: 'mild', hospitalization: null });
  }
  for (let i = 0; i < numCritical; i += 1) {
    infections.push({ state: 'critical', hospitalization: null });
  }
  return shuffle(infections);
}

export * from './simulation.dataset';
export * from './simulation.infection';
export * from './simulation.store';
export * from './simulation.utils';
