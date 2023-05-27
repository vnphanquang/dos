/**
 * Shuffles array in place
 *
 * @param array
 * @returns a shuffled copy of the array
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}
