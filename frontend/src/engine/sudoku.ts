import { createRng, type Rng } from './rng';

export type Tier = 'easy' | 'medium' | 'hard' | 'expert';
export const GENERATOR_VERSION = 1;

export interface Puzzle {
  seed: string;
  tier: Tier;
  givens: string; // 81 chars, '0' = empty
  solution: string;
  clues: number;
  generatorVersion: number;
}

export const ROW_OF: number[] = [];
export const COL_OF: number[] = [];
export const BOX_OF: number[] = [];
for (let i = 0; i < 81; i++) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  ROW_OF.push(r);
  COL_OF.push(c);
  BOX_OF.push(Math.floor(r / 3) * 3 + Math.floor(c / 3));
}
export const PEERS: number[][] = [];
for (let i = 0; i < 81; i++) {
  const p: number[] = [];
  for (let j = 0; j < 81; j++) {
    if (j !== i && (ROW_OF[j] === ROW_OF[i] || COL_OF[j] === COL_OF[i] || BOX_OF[j] === BOX_OF[i])) p.push(j);
  }
  PEERS.push(p);
}

const ALL = 0x1ff;
const POP = new Uint8Array(512);
for (let m = 1; m < 512; m++) POP[m] = POP[m >> 1] + (m & 1);

export const digitBit = (d: number) => 1 << (d - 1);

export function maskToDigits(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) out.push(d);
  return out;
}

interface SolveState {
  cells: number[];
  rows: number[];
  cols: number[];
  boxes: number[];
}

function prepare(board: ArrayLike<number>): SolveState | null {
  const st: SolveState = { cells: Array.from(board), rows: Array(9).fill(0), cols: Array(9).fill(0), boxes: Array(9).fill(0) };
  for (let i = 0; i < 81; i++) {
    const v = st.cells[i];
    if (!v) continue;
    const bit = 1 << (v - 1);
    if (st.rows[ROW_OF[i]] & bit || st.cols[COL_OF[i]] & bit || st.boxes[BOX_OF[i]] & bit) return null;
    st.rows[ROW_OF[i]] |= bit;
    st.cols[COL_OF[i]] |= bit;
    st.boxes[BOX_OF[i]] |= bit;
  }
  return st;
}

/** DFS with minimum-remaining-values. `onSolution` returns true to stop. */
function search(st: SolveState, empties: number[], onSolution: (cells: number[]) => boolean, rng?: Rng): boolean {
  let best = -1, bestMask = 0, bestCount = 10;
  for (let k = 0; k < empties.length; k++) {
    const i = empties[k];
    if (st.cells[i] !== 0) continue;
    const mask = ALL & ~(st.rows[ROW_OF[i]] | st.cols[COL_OF[i]] | st.boxes[BOX_OF[i]]);
    const cnt = POP[mask];
    if (cnt === 0) return false;
    if (cnt < bestCount) {
      best = i; bestMask = mask; bestCount = cnt;
      if (cnt === 1) break;
    }
  }
  if (best === -1) return onSolution(st.cells);
  const digits = maskToDigits(bestMask);
  if (rng) rng.shuffle(digits);
  const r = ROW_OF[best], c = COL_OF[best], b = BOX_OF[best];
  for (const d of digits) {
    const bit = 1 << (d - 1);
    st.cells[best] = d; st.rows[r] |= bit; st.cols[c] |= bit; st.boxes[b] |= bit;
    const stop = search(st, empties, onSolution, rng);
    st.cells[best] = 0; st.rows[r] &= ~bit; st.cols[c] &= ~bit; st.boxes[b] &= ~bit;
    if (stop) return true;
  }
  return false;
}

const emptiesOf = (cells: number[]) => cells.reduce<number[]>((acc, v, i) => (v === 0 ? (acc.push(i), acc) : acc), []);

export function countSolutions(board: ArrayLike<number>, limit = 2): number {
  const st = prepare(board);
  if (!st) return 0;
  let count = 0;
  search(st, emptiesOf(st.cells), () => ++count >= limit);
  return count;
}

export function solve(board: ArrayLike<number>, rng?: Rng): number[] | null {
  const st = prepare(board);
  if (!st) return null;
  let found: number[] | null = null;
  search(st, emptiesOf(st.cells), (cells) => { found = cells.slice(); return true; }, rng);
  return found;
}

/** Seeded generator: full grid, then remove cells in seeded order while the solution stays unique. */
export function generatePuzzle(seed: string, tier: Tier, targetClues: number): Puzzle {
  const rng = createRng(seed);
  const solution = solve(new Array(81).fill(0), rng) as number[];
  const puzzle = solution.slice();
  const order = rng.shuffle(Array.from({ length: 81 }, (_, i) => i));
  let clues = 81;
  for (const i of order) {
    if (clues <= targetClues) break;
    const v = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[i] = v;
    else clues--;
  }
  return { seed, tier, givens: puzzle.join(''), solution: solution.join(''), clues, generatorVersion: GENERATOR_VERSION };
}

/** Digits not used by any peer of cell i. */
export function candidatesMask(values: ArrayLike<number>, i: number): number {
  let used = 0;
  for (const p of PEERS[i]) if (values[p]) used |= 1 << (values[p] - 1);
  return ALL & ~used;
}

/** Always recomputed from the whole board: true where a peer holds the same digit. */
export function findConflicts(values: ArrayLike<number>): boolean[] {
  const out = new Array<boolean>(81).fill(false);
  for (let i = 0; i < 81; i++) {
    const v = values[i];
    if (!v) continue;
    for (const p of PEERS[i]) if (values[p] === v) { out[i] = true; break; }
  }
  return out;
}
