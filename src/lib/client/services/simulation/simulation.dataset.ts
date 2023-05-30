import { parse } from 'csv/browser/esm/sync';
import z from 'zod';

import { ROLES, INFECTION_TRANSITION, HOSPITAL_BEDS } from '$shared/types';
import type {
  Action,
  ActionDatasetKey,
  InfectionTransition,
  HospitalBed,
  ActionDatasetModel,
  SimulationContext,
} from '$shared/types';

export const ActionSchema = z.object({
  id: z.string(),
  role: z.enum(ROLES),
  name: z.string().default(''),
  description: z.string().default(''),
  infectionDelta: z.coerce.number().default(0),
  infectionTransitionProbabilityDelta: z.object(
    INFECTION_TRANSITION.reduce((acc, key) => {
      acc[key] = z.coerce.number().default(0);
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any) as Record<InfectionTransition, z.ZodNumber>,
  ),
  hospitalCapacityDelta: z.object(
    HOSPITAL_BEDS.reduce((acc, key) => {
      acc[key] = z.coerce.number().default(0);
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any) as Record<HospitalBed, z.ZodNumber>,
  ),
});

export function parseActionsFromCSV(csv: string): Action[] {
  const actions: Action[] = [];
  const records: ActionDatasetModel[] = parse(csv, {
    fromLine: 4,
    skipEmptyLines: true,
    columns: [
      'id',
      'role',
      'name',
      'description',
      'infectionDelta',
      ...INFECTION_TRANSITION,
      ...HOSPITAL_BEDS,
    ] satisfies Array<ActionDatasetKey>,
  });
  for (const record of records) {
    const action = ActionSchema.parse({
      ...record,
      infectionTransitionProbabilityDelta: INFECTION_TRANSITION.reduce((acc, key) => {
        acc[key] = (record[key] ?? '').slice(0, -1);
        return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as any) as Record<InfectionTransition, string>,
      hospitalCapacityDelta: {
        regular: record.regular,
        icu: record.icu,
      },
    });
    actions.push(action);
  }
  return actions;
}

export function parseInitialContextValuesFromCSV(csv: string): Omit<SimulationContext, 'actions'> {
  const parsed = parse(csv, {
    fromLine: 3,
    toLine: 3,
  });
  const [M0, C0, M1, C1, R0, M2, C2, R1, C3, D0, M3, C4, D1, D2, regular, icu] = parsed
    .slice(5)
    .map((v: string) => {
      let numStr = v as string;
      if (numStr.endsWith('%')) numStr = numStr.slice(0, -1);
      return Number(numStr);
    });
  return {
    hospitalCapacity: {
      regular,
      icu,
    },
    infectionPool: 100,
    baseNewInfection: 10,
    infectionTransitionProbabilities: {
      C0,
      C1,
      C2,
      C3,
      C4,
      D0,
      D1,
      D2,
      M0,
      M1,
      M2,
      M3,
      R0,
      R1,
    },
  };
}

export function parseSimulationContextFromCSV(csv: string): SimulationContext {
  return {
    actions: parseActionsFromCSV(csv),
    ...parseInitialContextValuesFromCSV(csv),
  };
}
