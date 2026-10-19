import { FULL_MASK, boxOf, colOf, rowOf } from './Sudoku';

export function countSolutions(input: number[], limit = 2): { grid: number[] | null; count: number } {
  const grid = input.slice();
  const rowMask = new Array(9).fill(0);
  const colMask = new Array(9).fill(0);
  const boxMask = new Array(9).fill(0);

  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v !== 0) {
      const bit = 1 << (v - 1);
      const r = rowOf(i), c = colOf(i), b = boxOf(i);
      if ((rowMask[r] & bit) !== 0 || (colMask[c] & bit) !== 0 || (boxMask[b] & bit) !== 0) {
        return { grid: null, count: 0 };
      }
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
    }
  }

  let count = 0;
  let firstSolution: number[] | null = null;

  function backtrack(): void {
    if (count >= limit) return;

    let bestIndex = -1;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const r = rowOf(i), c = colOf(i), b = boxOf(i);
        const used = rowMask[r] | colMask[c] | boxMask[b];
        const available = (~used) & FULL_MASK;
        const n = bitCount(available);
        if (n === 0) return;
        if (n < bestCount) {
          bestCount = n;
          bestIndex = i;
          if (n === 1) break;
        }
      }
    }

    if (bestIndex === -1) {
      count++;
      if (firstSolution === null) firstSolution = grid.slice();
      return;
    }

    const r = rowOf(bestIndex), c = colOf(bestIndex), b = boxOf(bestIndex);
    const used = rowMask[r] | colMask[c] | boxMask[b];
    let mask = (~used) & FULL_MASK;
    while (mask !== 0) {
      const lsb = mask & -mask;
      mask &= mask - 1;
      const value = lowestSetBit(lsb) + 1;

      grid[bestIndex] = value;
      rowMask[r] |= lsb;
      colMask[c] |= lsb;
      boxMask[b] |= lsb;

      backtrack();
      if (count >= limit) {
        grid[bestIndex] = 0;
        rowMask[r] &= ~lsb;
        colMask[c] &= ~lsb;
        boxMask[b] &= ~lsb;
        return;
      }

      grid[bestIndex] = 0;
      rowMask[r] &= ~lsb;
      colMask[c] &= ~lsb;
      boxMask[b] &= ~lsb;
    }
  }

  backtrack();
  return { grid: firstSolution, count };
}

export function isUnique(grid: number[]): boolean {
  const res = countSolutions(grid, 2);
  return res.count === 1;
}

function bitCount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

function lowestSetBit(n: number): number {
  if (n === 0) return 0;
  let idx = 0;
  while (((n >> idx) & 1) === 0) idx++;
  return idx;
}
