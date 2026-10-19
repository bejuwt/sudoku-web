export const SUDOKU_SIDE = 9;
export const SUDOKU_CELLS = 81;
export const FULL_MASK = 0x1ff;

export function rowOf(index: number): number {
  return Math.floor(index / 9);
}

export function colOf(index: number): number {
  return index % 9;
}

export function boxOf(index: number): number {
  const r = rowOf(index);
  const c = colOf(index);
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}
