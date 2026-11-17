import { PEERS, candidatesMask, digitBit, maskToDigits, type Puzzle } from '@/src/engine/sudoku';
import { TIER_MULTIPLIER } from './content';
import type { CellChange, Game, GameKind, WinResult } from './types';

/** Pure game rules: every function returns a new Game and performs no side effects. */

export function createGame(p: Puzzle, kind: GameKind, level: number, date: string | null): Game {
  return {
    id: `${kind}-${p.seed}`, kind, level, date, tier: p.tier, seed: p.seed,
    givens: p.givens, solution: p.solution,
    values: p.givens.split('').map(Number), notes: new Array(81).fill(0), revealed: [],
    selected: null, notesMode: false, undo: [], redo: [],
    mistakes: 0, shielded: 0, shieldArmed: false, activeMs: 0, freezeMs: 0, paused: false,
    status: 'playing', entries: 0, notesCells: [], powerUpsUsed: 0, hintsUsed: 0,
    hint: null, result: null, startedAt: new Date().toISOString(),
  };
}

export const isGiven = (g: Game, i: number) => g.givens.charCodeAt(i) !== 48;
export const isLocked = (g: Game, i: number) => isGiven(g, i) || g.revealed.includes(i);
export const solutionAt = (g: Game, i: number) => g.solution.charCodeAt(i) - 48;
export const isWrong = (g: Game, i: number) => g.values[i] !== 0 && !isGiven(g, i) && g.values[i] !== solutionAt(g, i);
export const isSolved = (g: Game) => g.values.every((v, i) => v === solutionAt(g, i));

export type MoveOutcome = 'none' | 'note' | 'filled' | 'mistake' | 'shielded' | 'won' | 'erased';

function commit(g: Game, changes: CellChange[], extra: Partial<Game>): Game {
  const values = g.values.slice();
  const notes = g.notes.slice();
  for (const ch of changes) { values[ch.i] = ch.v1; notes[ch.i] = ch.n1; }
  return { ...g, ...extra, values, notes, undo: [...g.undo, changes], redo: [] };
}

function peerNoteClears(g: Game, i: number, d: number): CellChange[] {
  const bit = digitBit(d);
  const out: CellChange[] = [];
  for (const p of PEERS[i]) {
    if (g.values[p] === 0 && g.notes[p] & bit) out.push({ i: p, v0: 0, n0: g.notes[p], v1: 0, n1: g.notes[p] & ~bit });
  }
  return out;
}

export function enterDigit(g: Game, d: number): { game: Game; outcome: MoveOutcome } {
  const i = g.selected;
  if (i === null || g.status !== 'playing' || isLocked(g, i)) return { game: g, outcome: 'none' };
  if (g.notesMode) {
    if (g.values[i] !== 0) return { game: g, outcome: 'none' };
    const bit = digitBit(d);
    const n1 = g.notes[i] ^ bit;
    const notesCells = n1 & bit && !g.notesCells.includes(i) ? [...g.notesCells, i] : g.notesCells;
    return { game: commit(g, [{ i, v0: 0, n0: g.notes[i], v1: 0, n1 }], { notesCells, paused: false }), outcome: 'note' };
  }
  if (g.values[i] === d) return { game: g, outcome: 'none' };
  const changes: CellChange[] = [{ i, v0: g.values[i], n0: g.notes[i], v1: d, n1: 0 }, ...peerNoteClears(g, i, d)];
  const wrong = d !== solutionAt(g, i);
  let { mistakes, shielded, shieldArmed } = g;
  let outcome: MoveOutcome = 'filled';
  if (wrong) {
    if (shieldArmed) { shieldArmed = false; shielded++; outcome = 'shielded'; }
    else { mistakes++; outcome = 'mistake'; }
  }
  let next = commit(g, changes, { mistakes, shielded, shieldArmed, entries: g.entries + 1, hint: null, paused: false });
  if (!wrong && isSolved(next)) { next = { ...next, status: 'won', selected: null }; outcome = 'won'; }
  return { game: next, outcome };
}

export function eraseCell(g: Game): Game | null {
  const i = g.selected;
  if (i === null || g.status !== 'playing' || isLocked(g, i)) return null;
  if (g.values[i] === 0 && g.notes[i] === 0) return null;
  return commit(g, [{ i, v0: g.values[i], n0: g.notes[i], v1: 0, n1: 0 }], { hint: null, paused: false });
}

/** Undo/redo restore cells only — never mistakes, power-up charges or time. Revealed cells stay put. */
export function undoMove(g: Game): Game | null {
  if (g.status !== 'playing' || g.undo.length === 0) return null;
  const entry = g.undo[g.undo.length - 1];
  const values = g.values.slice();
  const notes = g.notes.slice();
  for (let k = entry.length - 1; k >= 0; k--) {
    const ch = entry[k];
    if (g.revealed.includes(ch.i)) continue;
    values[ch.i] = ch.v0; notes[ch.i] = ch.n0;
  }
  return { ...g, values, notes, undo: g.undo.slice(0, -1), redo: [...g.redo, entry], hint: null, selected: entry[0].i, paused: false };
}

export function redoMove(g: Game): Game | null {
  if (g.status !== 'playing' || g.redo.length === 0) return null;
  const entry = g.redo[g.redo.length - 1];
  const values = g.values.slice();
  const notes = g.notes.slice();
  for (const ch of entry) {
    if (g.revealed.includes(ch.i)) continue;
    values[ch.i] = ch.v1; notes[ch.i] = ch.n1;
  }
  let next: Game = { ...g, values, notes, redo: g.redo.slice(0, -1), undo: [...g.undo, entry], hint: null, selected: entry[0].i, paused: false };
  if (isSolved(next)) next = { ...next, status: 'won', selected: null };
  return next;
}

export type PowerFail = { ok: false; message: string };

export function applyHint(g: Game):
  | PowerFail
  | { ok: true; game: Game; kind: 'wrong' | 'candidates'; cell: number; digits: number[] } {
  const w = g.values.findIndex((_, i) => isWrong(g, i));
  const used = { hintsUsed: g.hintsUsed + 1, powerUpsUsed: g.powerUpsUsed + 1, paused: false };
  if (w >= 0) {
    return { ok: true, kind: 'wrong', cell: w, digits: [g.values[w]], game: { ...g, ...used, selected: w, hint: { cell: w, mask: 0, wrong: true } } };
  }
  const i = g.selected;
  if (i === null || isLocked(g, i) || g.values[i] !== 0) return { ok: false, message: 'Select an empty cell first, then use Stellar Hint.' };
  const mask = candidatesMask(g.values, i);
  return { ok: true, kind: 'candidates', cell: i, digits: maskToDigits(mask), game: { ...g, ...used, hint: { cell: i, mask, wrong: false } } };
}

export function applyReveal(g: Game, random: () => number): PowerFail | { ok: true; game: Game; cell: number; digit: number; won: boolean } {
  const fillable = (k: number) => !isLocked(g, k) && g.values[k] !== solutionAt(g, k);
  let i = g.selected;
  if (i !== null) {
    if (!fillable(i)) return { ok: false, message: 'That cell is already right — pick an empty one.' };
  } else {
    const all = g.values.map((_, k) => k).filter(fillable);
    const empties = all.filter((k) => g.values[k] === 0);
    const pool = empties.length ? empties : all;
    if (!pool.length) return { ok: false, message: 'Nothing left to reveal!' };
    i = pool[Math.floor(random() * pool.length)];
  }
  const d = solutionAt(g, i);
  const values = g.values.slice();
  const notes = g.notes.slice();
  values[i] = d;
  notes[i] = 0;
  for (const ch of peerNoteClears(g, i, d)) notes[ch.i] = ch.n1;
  let next: Game = { ...g, values, notes, revealed: [...g.revealed, i], selected: i, hint: null, powerUpsUsed: g.powerUpsUsed + 1, paused: false };
  const won = isSolved(next);
  if (won) next = { ...next, status: 'won', selected: null };
  return { ok: true, game: next, cell: i, digit: d, won };
}

export function applyFreeze(g: Game): PowerFail | { ok: true; game: Game } {
  if (g.freezeMs > 0) return { ok: false, message: 'Time is already frozen!' };
  return { ok: true, game: { ...g, freezeMs: 30000, powerUpsUsed: g.powerUpsUsed + 1, paused: false } };
}

export function applyShield(g: Game): PowerFail | { ok: true; game: Game } {
  if (g.shieldArmed) return { ok: false, message: 'Your Error Shield is already up.' };
  return { ok: true, game: { ...g, shieldArmed: true, powerUpsUsed: g.powerUpsUsed + 1, paused: false } };
}

/** Freeze is consumed before the scoring clock accrues. */
export function tickGame(g: Game, dtMs: number): Game {
  if (g.status !== 'playing' || g.paused) return g;
  let dt = Math.max(0, Math.min(dtMs, 1000));
  let freezeMs = g.freezeMs;
  if (freezeMs > 0) {
    const use = Math.min(freezeMs, dt);
    freezeMs -= use;
    dt -= use;
  }
  return { ...g, freezeMs, activeMs: g.activeMs + dt };
}

export function computeResult(g: Game): WinResult {
  const activeSeconds = Math.floor(g.activeMs / 1000);
  const base = Math.round(1000 * TIER_MULTIPLIER[g.tier]);
  const timeBonus = Math.max(0, 600 - activeSeconds);
  const levelBonus = g.kind === 'level' ? g.level * 10 : 0;
  const penalty = 25 * g.mistakes;
  const score = Math.max(0, Math.round(base + timeBonus + levelBonus - penalty));
  const dailyBonus = g.kind === 'daily' ? 100 : 0;
  return {
    score, stardust: Math.floor(score / 10) + dailyBonus, base, timeBonus, levelBonus, penalty, dailyBonus,
    activeSeconds, mistakes: g.mistakes, perfect: g.mistakes === 0, newAchievements: [],
  };
}
