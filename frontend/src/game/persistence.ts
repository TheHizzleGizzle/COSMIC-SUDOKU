import { storage } from '@/src/utils/storage';
import { ACHIEVEMENTS, POWER_UPS, THEMES, TIERS } from './content';
import { HISTORY_CAP, defaultProfile, defaultSettings } from './profile';
import type { CellChange, Game, GameKind, HistoryEntry, Profile, Settings, ThemeId, Tier, WinResult } from './types';

export const SAVE_KEY = 'cosmic-sudoku:v2';

export interface SaveDoc {
  profile: Profile;
  settings: Settings;
  levelGame: Game | null;
  dailyGame: Game | null;
  activeKind: GameKind;
}

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const int = (x: unknown, d: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(min, Math.floor(x))) : d;
const str = (x: unknown, d: string) => (typeof x === 'string' ? x : d);
const isTier = (x: unknown): x is Tier => TIERS.includes(x as Tier);
const isIdx = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < 81;
const arr81 = (x: unknown, max: number) =>
  Array.isArray(x) && x.length === 81 && x.every((v) => Number.isInteger(v) && v >= 0 && v <= max) ? (x as number[]) : null;
const historyOk = (h: unknown): h is CellChange[][] =>
  Array.isArray(h) && h.every((e) => Array.isArray(e) && e.length > 0 && e.every((c) => isObj(c) && isIdx(c.i) && [c.v0, c.v1].every((n) => Number.isInteger(n)) && [c.n0, c.n1].every((n) => Number.isInteger(n))));

function sanitizeResult(x: unknown): WinResult | null {
  if (!isObj(x)) return null;
  const n = (k: string) => int(x[k], 0);
  return {
    score: n('score'), stardust: n('stardust'), base: n('base'), timeBonus: n('timeBonus'), levelBonus: n('levelBonus'),
    penalty: n('penalty'), dailyBonus: n('dailyBonus'), activeSeconds: n('activeSeconds'), mistakes: n('mistakes'),
    perfect: x.perfect === true,
    newAchievements: Array.isArray(x.newAchievements) ? x.newAchievements.filter((a) => ACHIEVEMENTS.some((d) => d.id === a)) : [],
  };
}

export function sanitizeGame(raw: unknown): Game | null {
  if (!isObj(raw)) return null;
  const { givens, solution } = raw;
  if (typeof givens !== 'string' || typeof solution !== 'string' || !/^[0-9]{81}$/.test(givens) || !/^[1-9]{81}$/.test(solution)) return null;
  const values = arr81(raw.values, 9);
  const notes = arr81(raw.notes, 511);
  if (!values || !notes || !isTier(raw.tier)) return null;
  for (let i = 0; i < 81; i++) if (givens[i] !== '0' && Number(givens[i]) !== values[i]) return null;
  const kind: GameKind = raw.kind === 'daily' ? 'daily' : 'level';
  const hint = isObj(raw.hint) && isIdx(raw.hint.cell) ? { cell: raw.hint.cell, mask: int(raw.hint.mask, 0, 0, 511), wrong: raw.hint.wrong === true } : null;
  return {
    id: str(raw.id, `${kind}-restored`), kind, level: int(raw.level, 1, 0, 1_000_000), date: typeof raw.date === 'string' ? raw.date : null,
    tier: raw.tier, seed: str(raw.seed, 'restored'), givens, solution, values, notes,
    revealed: Array.isArray(raw.revealed) ? raw.revealed.filter(isIdx) : [],
    selected: isIdx(raw.selected) ? raw.selected : null,
    notesMode: raw.notesMode === true,
    undo: historyOk(raw.undo) ? raw.undo : [],
    redo: historyOk(raw.redo) ? raw.redo : [],
    mistakes: int(raw.mistakes, 0), shielded: int(raw.shielded, 0), shieldArmed: raw.shieldArmed === true,
    activeMs: int(raw.activeMs, 0), freezeMs: int(raw.freezeMs, 0, 0, 30000), paused: raw.paused === true,
    status: raw.status === 'won' ? 'won' : 'playing',
    entries: int(raw.entries, 0), notesCells: Array.isArray(raw.notesCells) ? raw.notesCells.filter(isIdx) : [],
    powerUpsUsed: int(raw.powerUpsUsed, 0), hintsUsed: int(raw.hintsUsed, 0), hint,
    result: sanitizeResult(raw.result), startedAt: str(raw.startedAt, new Date().toISOString()),
  };
}

function sanitizeHistory(x: unknown): HistoryEntry[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((e): e is Obj => isObj(e) && typeof e.at === 'string' && isTier(e.tier))
    .slice(0, HISTORY_CAP)
    .map((e) => ({
      at: e.at as string, kind: e.kind === 'daily' ? 'daily' : 'level', level: typeof e.level === 'number' ? e.level : null,
      tier: e.tier as Tier, outcome: e.outcome === 'abandoned' ? 'abandoned' : 'won',
      seconds: int(e.seconds, 0), mistakes: int(e.mistakes, 0), hints: int(e.hints, 0), powerUps: int(e.powerUps, 0),
      score: int(e.score, 0), stardust: int(e.stardust, 0),
    }));
}

/** Ids and numbers only; anything unknown falls back to defaults so new content reaches old saves. */
export function sanitizeProfile(raw: Obj): Profile {
  const d = defaultProfile();
  const inv = isObj(raw.inventory) ? raw.inventory : {};
  const themes = Array.isArray(raw.themes) ? (raw.themes.filter((t) => THEMES.some((th) => th.id === t)) as ThemeId[]) : [];
  if (!themes.includes('default')) themes.unshift('default');
  const ach = isObj(raw.achievements) ? raw.achievements : {};
  const tiers = isObj(raw.tiers) ? raw.tiers : {};
  const daily = isObj(raw.daily) ? raw.daily : {};
  const results: Profile['daily']['results'] = {};
  if (isObj(daily.results)) {
    for (const [k, v] of Object.entries(daily.results)) if (isObj(v)) results[k] = { score: int(v.score, 0), seconds: int(v.seconds, 0) };
  }
  const activity: Record<string, number> = {};
  if (isObj(raw.activity)) for (const [k, v] of Object.entries(raw.activity)) activity[k] = int(v, 0);
  return {
    level: int(raw.level, 1, 1, 1_000_000),
    stardust: int(raw.stardust, d.stardust),
    inventory: Object.fromEntries(POWER_UPS.map((p) => [p.id, int(inv[p.id], p.start, 0, 9999)])) as Profile['inventory'],
    themes,
    activeTheme: themes.includes(raw.activeTheme as ThemeId) ? (raw.activeTheme as ThemeId) : 'default',
    achievements: Object.fromEntries(ACHIEVEMENTS.filter((a) => typeof ach[a.id] === 'string').map((a) => [a.id, ach[a.id] as string])),
    played: int(raw.played, 0), wins: int(raw.wins, 0), abandons: int(raw.abandons, 0),
    winStreak: int(raw.winStreak, 0), bestWinStreak: int(raw.bestWinStreak, 0), perfectGames: int(raw.perfectGames, 0),
    tiers: Object.fromEntries(TIERS.map((t) => {
      const s = isObj(tiers[t]) ? (tiers[t] as Obj) : {};
      return [t, { wins: int(s.wins, 0), totalSeconds: int(s.totalSeconds, 0), bestSeconds: typeof s.bestSeconds === 'number' ? int(s.bestSeconds, 0) : null }];
    })) as Profile['tiers'],
    history: sanitizeHistory(raw.history),
    activity,
    daily: { results, streak: int(daily.streak, 0), best: int(daily.best, 0), lastWin: typeof daily.lastWin === 'string' ? daily.lastWin : null },
  };
}

function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!isObj(raw)) return d;
  return {
    haptics: typeof raw.haptics === 'boolean' ? raw.haptics : d.haptics,
    reduceMotion: raw.reduceMotion === 'on' || raw.reduceMotion === 'off' ? raw.reduceMotion : 'system',
  };
}

/** A damaged save is quarantined under a separate key and the app starts fresh — it never crashes. */
export async function loadSave(): Promise<{ doc: SaveDoc | null; corrupt: boolean }> {
  let raw: string | null = null;
  try {
    raw = await storage.getItem(SAVE_KEY);
  } catch {
    return { doc: null, corrupt: true };
  }
  if (raw == null) return { doc: null, corrupt: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed) || parsed.version !== 2 || !isObj(parsed.profile)) throw new Error('invalid save');
    return {
      corrupt: false,
      doc: {
        profile: sanitizeProfile(parsed.profile),
        settings: sanitizeSettings(parsed.settings),
        levelGame: sanitizeGame(parsed.levelGame),
        dailyGame: sanitizeGame(parsed.dailyGame),
        activeKind: parsed.activeKind === 'daily' ? 'daily' : 'level',
      },
    };
  } catch {
    try {
      await storage.setItem(`cosmic-sudoku:corrupt:${Date.now()}`, raw);
      await storage.removeItem(SAVE_KEY);
    } catch {
      // ignore — we still start fresh
    }
    return { doc: null, corrupt: true };
  }
}

export async function writeSave(doc: SaveDoc): Promise<void> {
  await storage.setItem(SAVE_KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), ...doc }));
}
