export const ROLES = ['Policy Maker', 'Community Leader', 'Hospital Manager', 'Citizen'] as const;
export type Role = (typeof ROLES)[number];

export const HOSPITAL_BEDS = ['regular', 'icu'] as const;
export type HospitalBed = (typeof HOSPITAL_BEDS)[number];

export const INFECTION_TRANSITION = [
  'M0',
  'C0',
  // mild, not hospitalized
  'M1',
  'C1',
  'R0',
  // mid, hospitalized into regular bed
  'M2',
  'C2',
  'R1',
  // critical, hospitalized into regular bed
  'C3',
  'D0',
  // critical, hospitalized into ICU
  'M3',
  'C4',
  'D1',
  // critical, not hospitalized
  'D2',
] as const;
export type InfectionTransition = (typeof INFECTION_TRANSITION)[number];

export type InfectionState = 'mild' | 'critical' | 'recovered' | 'dead';

export type Action = {
  id: string;
  role: Role;
  name?: string;
  description?: string;
  hospitalCapacityDelta: Record<HospitalBed, number>;
  infectionDelta: number;
  infectionTransitionProbabilityDelta: Record<InfectionTransition, number>;
};

export type ActionDatasetKey =
  | keyof Omit<Action, 'infectionTransitionProbabilityDelta' | 'hospitalCapacityDelta'>
  | keyof Action['infectionTransitionProbabilityDelta']
  | keyof Action['hospitalCapacityDelta'];

export type ActionDatasetModel = Record<ActionDatasetKey, string>;

export type SimulationContext = {
  actions: Action[];
  infectionTransitionProbabilities: Record<InfectionTransition, number>;
  totalInfections: number;
  newInfectionBaseDelta: number;
  hospitalCapacity: Record<HospitalBed, number>;
};

export type Infection = {
  state: InfectionState;
  hospitalization: HospitalBed | null;
};

export type SimulationState = {
  infections: Infection[];
};
