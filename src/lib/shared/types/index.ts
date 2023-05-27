export type Role =
  | 'PM' // policy maker - 1
  | 'CL' // community leader - 1
  | 'HM' // hospital manager - 1
  | 'C'; // citizen - 4

export type Action = {
  id: string;
  name: string;
  numInfections: number;
};

export type HospitalBed = 'regular' | 'icu';

export type InfectionState = 'mild' | 'critical' | 'recovered' | 'dead';

export const app_version = `v${__BUILD_VERSION__}#${__BUILD_HASH__}/${__BUILD_TIMESTAMP__}`;
