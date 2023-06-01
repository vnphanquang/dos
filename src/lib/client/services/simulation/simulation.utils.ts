import { shuffle } from '$shared/utils/shuffle';

export function randomizeFromProbabilities<P extends string>(probabilities: Array<[P, number]>): P {
  let samples: P[] = [];
  for (const [key, probability] of probabilities) {
    samples.push(...new Array(probability).fill(key));
  }
  samples = shuffle(samples);
  return samples[Math.floor(Math.random() * samples.length)];
}

export type RecursiveRecord<T> = {
  [key: string]: T | RecursiveRecord<T>;
};

export function recursiveTransform<T, R extends object>(
  a: R,
  b: R,
  transform: (a: T, b: T) => T,
): R {
  const result: R = {} as R;
  for (const key in a) {
    // eslint-disable-next-line no-prototype-builtins
    if (!a.hasOwnProperty(key)) continue;
    if (typeof a[key] === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[key] = recursiveTransform(a[key] as R, b[key] as R, transform) as any;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[key] = transform(a[key] as any, b[key] as any) as any;
    }
  }
  return result;
}
