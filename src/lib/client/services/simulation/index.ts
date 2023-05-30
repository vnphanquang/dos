import { parse } from 'csv/browser/esm/sync';
import z from 'zod';

import {
  ROLES,
  type Action,
  type ActionDatasetKey,
  INFECTION_TRANSITION_PROBABILITY,
  type InfectionTransitionProbability,
  HOSPITAL_BEDS,
  type HospitalBed,
  type ActionDatasetModel,
} from '$shared/types';

const INITIAL_NUM_INFECTION = 100;
/** mild : critical */
const INITIAL_INFECTION_RATIO = 7 / 3;

type InfectionPool = {
  mild: number;
  critical: number;
};

export function randomizeInfectionPool(): InfectionPool {
  const critical = INITIAL_NUM_INFECTION / (1 + INITIAL_INFECTION_RATIO);
  const mild = INITIAL_NUM_INFECTION - critical;
  return { mild, critical };
}

export function round() {
  //
}

const ActionSchema = z.object({
  id: z.string(),
  role: z.enum(ROLES),
  name: z.string().default(''),
  description: z.string().default(''),
  infectionDelta: z.coerce.number().default(0),
  infectionTransitionProbabilityDelta: z.object(
    INFECTION_TRANSITION_PROBABILITY.reduce((acc, key) => {
      acc[key] = z.coerce.number().default(0);
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any) as Record<InfectionTransitionProbability, z.ZodNumber>,
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
    from: 3,
    skipEmptyLines: true,
    columns: [
      'id',
      'role',
      'name',
      'description',
      'infectionDelta',
      ...INFECTION_TRANSITION_PROBABILITY,
      ...HOSPITAL_BEDS,
    ] satisfies Array<ActionDatasetKey>,
  });
  for (const record of records) {
    const action = ActionSchema.parse({
      ...record,
      infectionTransitionProbabilityDelta: INFECTION_TRANSITION_PROBABILITY.reduce((acc, key) => {
        acc[key] = (record[key] ?? '').slice(0, -1);
        return acc;
      }, {} as any) as Record<InfectionTransitionProbability, string>,
      hospitalCapacityDelta: {
        regular: record.regular,
        icu: record.icu,
      },
    });
    actions.push(action);
  }
  return actions;
}
