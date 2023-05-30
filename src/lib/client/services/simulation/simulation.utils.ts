import { shuffle } from '$shared/utils/shuffle';

export function randomizeFromProbabilities<P extends string>(probabilities: Array<[P, number]>): P {
  let samples: P[] = [];
  for (const [key, probability] of probabilities) {
    samples.push(...new Array(probability).fill(key));
  }
  samples = shuffle(samples);
  return samples[Math.floor(Math.random() * samples.length)];
}
