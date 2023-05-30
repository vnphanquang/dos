export function randomizeFromProbabilities<P extends string>(probabilities: Array<[P, number]>): P {
  const samples: P[] = [];
  for (const [key, probability] of probabilities) {
    samples.push(...new Array(probability).fill(key));
  }
  return samples[Math.floor(Math.random() * samples.length)];
}
