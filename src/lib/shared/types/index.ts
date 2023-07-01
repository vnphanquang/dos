export const ROLES = ['Policy Maker', 'Community Leader', 'Hospital Manager', 'Citizen'] as const;
export type Role = (typeof ROLES)[number];

export const HOSPITAL_BEDS = ['regular', 'icu'] as const;
export type HospitalBed = (typeof HOSPITAL_BEDS)[number];
export const HOSPITALIZATIONS = ['none', ...HOSPITAL_BEDS] as const;
export type Hospitalization = (typeof HOSPITALIZATIONS)[number];

export const INFECTION_TRANSITION = [
  'M0', // initial mild
  'C0', // initial critical

  'MM', // mild -> mild
  'MC', // mild -> critical
  'MR', // mild -> recovered

  'CM', // critical -> mild
  'CD', // critical -> dead
  'CC', // critical -> critical
] as const;
export type InfectionTransition = (typeof INFECTION_TRANSITION)[number];

export const INFECTION_STATES = ['mild', 'critical', 'recovered', 'dead'] as const;
export type InfectionState = (typeof INFECTION_STATES)[number];

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

export type SimulationRuntime = {
  infectionPool: Infection[];
  infections: Infection[];
  queuedActions: Action[];
};

export type Simulation = {
  context: SimulationContext;
  runtime: SimulationRuntime;
};

export type Infection = {
  id: string;
  state: InfectionState;
};

export type SimulationState = {
  infections: Infection[];
};

export type InfectionStats = {
  total: number;
  byState: Record<
    InfectionState,
    {
      total: number;
    }
  >;
};
