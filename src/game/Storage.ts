import { Stats } from './Game';

export interface Snapshot {
  difficulty: string;
  givens: number[];
  solution: number[];
  values: number[];
  notes: number[][];
  isGiven: boolean[];
  elapsed: number;
  mistakes: number;
}

const GAME_KEY = 'sudoku.currentGame';
const STATS_KEY = 'sudoku.stats';

export const Storage = {
  saveGame(snapshot: Snapshot): void {
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify(snapshot));
    } catch {
      /* ignore */
    }
  },
  loadGame(): Snapshot | null {
    try {
      const raw = localStorage.getItem(GAME_KEY);
      return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      return null;
    }
  },
  clearGame(): void {
    try {
      localStorage.removeItem(GAME_KEY);
    } catch {
      /* ignore */
    }
  },
  loadStats(): Record<string, Stats> {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, Stats>) : {};
    } catch {
      return {};
    }
  },
  saveStats(stats: Record<string, Stats>): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      /* ignore */
    }
  },
};
