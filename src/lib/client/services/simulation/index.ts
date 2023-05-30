// const INITIAL_NUM_INFECTION = 100;
// /** mild : critical */
// const INITIAL_INFECTION_RATIO = 7 / 3;

// type InfectionPool = {
//   mild: number;
//   critical: number;
// };
// export function randomizeInfectionPool(): InfectionPool {
//   const critical = INITIAL_NUM_INFECTION / (1 + INITIAL_INFECTION_RATIO);
//   const mild = INITIAL_NUM_INFECTION - critical;
//   return { mild, critical };
// }

export * from './simulation.dataset';
export * from './simulation.infection';
export * from './simulation.store';
export * from './simulation.utils';
