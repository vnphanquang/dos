import { shuffle } from './shuffle';

/**
 * Randomly select an item from a list of items with specified ratio
 *
 * @remarks
 *
 * Each ratio must be a positive integer
 *
 * @param items - list of items
 * @returns the randomized item
 */
export function randomFromRatioArray<T extends { ratio: number }>(items: T[]): T {
  // create a sample array with given ratios
  let samples: T[] = [];
  for (const item of items) {
    if (!Number.isInteger(item.ratio) || item.ratio < 0) {
      throw new Error('Each ratio must be a positive integer');
    }
    samples.push(...new Array(item.ratio).fill(item));
  }
  samples = shuffle(samples);
  return samples[Math.floor(Math.random() * samples.length)];
}

/**
 * Randomly select an item from a map of ratios
 *
 * @remarks
 *
 * Each ratio must be a positive integer
 *
 * @param ratios - the ratio map
 * @returns the randomized item
 */
export function randomFromRatioMap<T extends Record<string, number>>(ratios: T): keyof T {
  // create a sample array with given ratios
  let samples: Array<keyof T> = [];
  for (const [key, ratio] of Object.entries(ratios)) {
    if (!Number.isInteger(ratio) || ratio < 0) {
      throw new Error('Each ratio must be a positive integer');
    }
    samples.push(...new Array(ratio).fill(key));
  }
  samples = shuffle(samples);
  return samples[Math.floor(Math.random() * samples.length)];
}
