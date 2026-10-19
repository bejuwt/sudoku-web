import { Difficulty } from '../model/Difficulty';
import { generatePuzzle } from '../model/Generator';
import { Storage } from './Storage';

export interface Stats {
  started: number;
  won: number;
  bestTime?: number;
  totalTime: number;
}

interface Move {
  index: number;
  previousValue: number;
  previousNotes: number[];
  newValue: number;
  newNotes: number[];
}

export type GameStatus = 'playing' | 'paused' | 'won';

export class Game {
  readonly difficulty: Difficulty;
  readonly solution: number[];
  readonly isGiven: boolean[];
  readonly givens: number[];

  values: number[];
  notes: Set<number>[];

  selected: number | null = null;
  pencilMode = false;
  autoCheck = true;
  status: GameStatus = 'playing';
  elapsed = 0;
  mistakes = 0;
  hintsUsed = 0;
  stats: Record<string, Stats>;

  private undoStack: Move[] = [];
  private timerId: number | null = null;
  private secondsSinceSave = 0;

  private constructor(difficulty: Difficulty, givens: number[], solution: number[], stats: Record<string, Stats>) {
    this.difficulty = difficulty;
    this.givens = givens;
    this.solution = solution;
    this.isGiven = givens.map((v) => v !== 0);
    this.values = givens.slice();
    this.notes = new Array(81).fill(0).map(() => new Set<number>());
    this.stats = stats;
  }

  static newGame(difficulty: Difficulty): Game {
    const stats = Storage.loadStats();
    const puzzle = generatePuzzle(difficulty);
    const game = new Game(difficulty, puzzle.givens, puzzle.solution, stats);
    game.registerStart();
    return game;
  }

  static loadOrNew(defaultDifficulty: Difficulty = Difficulty.Easy): Game {
    const snap = Storage.loadGame();
    if (snap && snap.values.length === 81 && snap.solution.length === 81) {
      const stats = Storage.loadStats();
      const game = new Game(snap.difficulty as Difficulty, snap.givens, snap.solution, stats);
      game.values = snap.values.slice();
      game.notes = snap.notes.map((arr) => new Set(arr));
      game.elapsed = snap.elapsed;
      game.mistakes = snap.mistakes;
      if (game.isSolved) {
        game.status = 'won';
      }
      return game;
    }
    return Game.newGame(defaultDifficulty);
  }

  // ---- derived ----
  get timeString(): string {
    const m = Math.floor(this.elapsed / 60);
    const s = this.elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  get isSolved(): boolean {
    for (let i = 0; i < 81; i++) {
      if (this.values[i] !== this.solution[i]) return false;
    }
    return true;
  }
  isError(index: number): boolean {
    if (!this.autoCheck || this.isGiven[index]) return false;
    const v = this.values[index];
    return v !== 0 && v !== this.solution[index];
  }
  remainingCount(digit: number): number {
    let count = 0;
    for (let i = 0; i < 81; i++) if (this.values[i] === digit) count++;
    return Math.max(0, 9 - count);
  }

  // ---- actions ----
  select(index: number): void {
    if (index >= 0 && index < 81) this.selected = index;
  }

  enter(number: number): void {
    if (this.status !== 'playing') return;
    const index = this.selected;
    if (index === null || this.isGiven[index]) return;

    const prevValue = this.values[index];
    const prevNotes = Array.from(this.notes[index]);

    if (this.pencilMode) {
      if (this.values[index] === 0) {
        if (this.notes[index].has(number)) this.notes[index].delete(number);
        else this.notes[index].add(number);
      } else {
        this.values[index] = 0;
        this.notes[index] = new Set([number]);
      }
    } else {
      if (this.values[index] === number) {
        this.values[index] = 0;
      } else {
        this.values[index] = number;
        this.notes[index] = clear();
        if (number !== this.solution[index]) this.mistakes++;
      }
    }

    this.undoStack.push({
      index,
      previousValue: prevValue,
      previousNotes: prevNotes,
      newValue: this.values[index],
      newNotes: Array.from(this.notes[index]),
    });
    this.finishTurn();
  }

  erase(): void {
    if (this.status !== 'playing') return;
    const index = this.selected;
    if (index === null || this.isGiven[index]) return;
    if (this.values[index] === 0 && this.notes[index].size === 0) return;

    this.undoStack.push({
      index,
      previousValue: this.values[index],
      previousNotes: Array.from(this.notes[index]),
      newValue: 0,
      newNotes: [],
    });
    this.values[index] = 0;
    this.notes[index] = clear();
    this.finishTurn();
  }

  undo(): void {
    if (this.status !== 'playing') return;
    const move = this.undoStack.pop();
    if (!move) return;
    this.values[move.index] = move.previousValue;
    this.notes[move.index] = new Set(move.previousNotes);
    this.selected = move.index;
    this.save();
  }

  hint(): void {
    if (this.status !== 'playing') return;
    let target: number | null = null;
    const sel = this.selected;
    if (sel !== null && !this.isGiven[sel] && this.values[sel] !== this.solution[sel]) {
      target = sel;
    } else {
      for (let i = 0; i < 81; i++) {
        if (this.values[i] !== this.solution[i]) { target = i; break; }
      }
    }
    if (target === null) return;
    this.selected = target;
    this.undoStack.push({
      index: target,
      previousValue: this.values[target],
      previousNotes: Array.from(this.notes[target]),
      newValue: this.solution[target],
      newNotes: [],
    });
    this.values[target] = this.solution[target];
    this.notes[target] = clear();
    this.hintsUsed++;
    this.finishTurn();
  }

  togglePencil(): void {
    this.pencilMode = !this.pencilMode;
  }

  // ---- timer ----
  startTimer(): void {
    if (this.timerId !== null || this.status !== 'playing') return;
    this.timerId = window.setInterval(() => this.tick(), 1000);
  }
  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  private tick(): void {
    if (this.status !== 'playing') return;
    this.elapsed++;
    this.secondsSinceSave++;
    if (this.secondsSinceSave >= 5) {
      this.secondsSinceSave = 0;
      this.save();
    }
  }
  pause(): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.stopTimer();
    this.save();
  }
  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'playing';
    this.startTimer();
  }

  // ---- persistence ----
  private finishTurn(): void {
    if (this.isSolved) {
      this.status = 'won';
      this.stopTimer();
      this.registerWin();
      Storage.clearGame();
    } else {
      this.save();
    }
  }
  save(): void {
    if (this.status === 'won') return;
    Storage.saveGame({
      difficulty: this.difficulty,
      givens: this.givens,
      solution: this.solution,
      values: this.values,
      notes: this.notes.map((set) => Array.from(set)),
      isGiven: this.isGiven,
      elapsed: this.elapsed,
      mistakes: this.mistakes,
    });
  }
  private registerStart(): void {
    const entry = this.stats[this.difficulty] || { started: 0, won: 0, totalTime: 0 };
    entry.started++;
    this.stats[this.difficulty] = entry;
    Storage.saveStats(this.stats);
  }
  private registerWin(): void {
    const entry = this.stats[this.difficulty] || { started: 0, won: 0, totalTime: 0 };
    entry.won++;
    entry.totalTime += this.elapsed;
    if (entry.bestTime === undefined || this.elapsed < entry.bestTime) entry.bestTime = this.elapsed;
    this.stats[this.difficulty] = entry;
    Storage.saveStats(this.stats);
  }
}

function clear(): Set<number> {
  return new Set<number>();
}
