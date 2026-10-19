export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export const difficulties: Difficulty[] = [
  Difficulty.Easy,
  Difficulty.Medium,
  Difficulty.Hard,
];

export function difficultyTitle(d: Difficulty): string {
  switch (d) {
    case Difficulty.Easy: return 'Easy';
    case Difficulty.Medium: return 'Medium';
    case Difficulty.Hard: return 'Hard';
  }
}

export function difficultyClueCount(d: Difficulty): number {
  switch (d) {
    case Difficulty.Easy: return 45;
    case Difficulty.Medium: return 36;
    case Difficulty.Hard: return 30;
  }
}

export function nextDifficulty(d: Difficulty): Difficulty {
  switch (d) {
    case Difficulty.Easy: return Difficulty.Medium;
    case Difficulty.Medium: return Difficulty.Hard;
    case Difficulty.Hard: return Difficulty.Easy;
  }
}
