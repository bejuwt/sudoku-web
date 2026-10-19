import { Difficulty, difficultyClueCount } from './Difficulty';
import { FULL_MASK, boxOf, colOf, rowOf } from './Sudoku';
import { countSolutions } from './Solver';

export interface Puzzle {
  givens: number[];
  solution: number[];
  difficulty: Difficulty;
}

export function generateSolved(): number[] {
  const grid = new Array(81).fill(0);
  const rowMask = new Array(9).fill(0);
  const colMask = new Array(9).fill(0);
  const boxMask = new Array(9).fill(0);
  fillRandom(grid, rowMask, colMask, boxMask);
  return grid;
}

function fillRandom(grid: number[], rowMask: number[], colMask: number[], boxMask: number[]): boolean {
  let firstEmpty = -1;
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) { firstEmpty = i; break; }
  }
  if (firstEmpty === -1) return true;

  const r = rowOf(firstEmpty), c = colOf(firstEmpty), b = boxOf(firstEmpty);
  const used = rowMask[r] | colMask[c] | boxMask[b];
  const available = (~used) & FULL_MASK;

  const choices: number[] = [];
  let mask = available;
  while (mask !== 0) {
    const lsb = mask & -mask;
    mask &= mask - 1;
    choices.push(lsb);
  }

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  for (const lsb of choices) {
    const value = lowestSetBit(lsb) + 1;
    grid[firstEmpty] = value;
    rowMask[r] |= lsb;
    colMask[c] |= lsb;
    boxMask[b] |= lsb;

    if (fillRandom(grid, rowMask, colMask, boxMask)) return true;

    grid[firstEmpty] = 0;
    rowMask[r] &= ~lsb;
    colMask[c] &= ~lsb;
    boxMask[b] &= ~lsb;
  }
  return false;
}

function dig(solution: number[], targetClues: number): number[] {
  const givens = solution.slice();
  let clues = 81;

  for (let idx = 0; idx < 81; idx++) {
    const backup = givens[idx];
    if (backup === 0) continue;
    givens[idx] = 0;
    const { count } = countSolutions(givens, 2);
    if (count === 1) {
      clues -= 1;
    } else {
      givens[idx] = backup;
    }
    if (clues <= targetClues) break;
  }
  return givens;
}

export function generatePuzzle(difficulty: Difficulty): Puzzle {
  const solution = generateSolved();
  const givens = dig(solution, difficultyClueCount(difficulty));
  return { givens, solution, difficulty };
}

function lowestSetBit(n: number): number {
  if (n === 0) return 0;
  let idx = 0;
  while (((n >> idx) & 1) === 0) idx++;
  return idx;
}
