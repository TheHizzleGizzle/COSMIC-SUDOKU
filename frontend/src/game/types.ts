import type { Tier } from '@/src/engine/sudoku';

export type { Tier };
export type PowerUpId = 'hint' | 'reveal' | 'freeze' | 'shield';
export type ThemeId = 'default' | 'nebula' | 'aurora' | 'galaxy';
export type AchievementId =
  | 'first-win' | 'speed-demon' | 'perfect-scholar' | 'streak-5' | 'level-10'
  | 'collector' | 'daily-7' | 'pure-logic' | 'cartographer';
export type GameKind = 'level' | 'daily';

export interface CellChange { i: number; v0: number; n0: number; v1: number; n1: number }

export interface WinResult {
  score: number;
  stardust: number;
  base: number;
  timeBonus: number;
  levelBonus: number;
  penalty: number;
  dailyBonus: number;
  activeSeconds: number;
  mistakes: number;
  perfect: boolean;
  newAchievements: AchievementId[];
}

export interface HintMark { cell: number; mask: number; wrong: boolean }

export interface Game {
  id: string;
  kind: GameKind;
  level: number;
  date: string | null;
  tier: Tier;
  seed: string;
  givens: string;
  solution: string;
  values: number[];
  notes: number[];
  revealed: number[];
  selected: number | null;
  notesMode: boolean;
  undo: CellChange[][];
  redo: CellChange[][];
  mistakes: number;
  shielded: number;
  shieldArmed: boolean;
  activeMs: number;
  freezeMs: number;
  paused: boolean;
  status: 'playing' | 'won';
  entries: number;
  notesCells: number[];
  powerUpsUsed: number;
  hintsUsed: number;
  hint: HintMark | null;
  result: WinResult | null;
  startedAt: string;
}

export interface TierStats { wins: number; totalSeconds: number; bestSeconds: number | null }

export interface HistoryEntry {
  at: string;
  kind: GameKind;
  level: number | null;
  tier: Tier;
  outcome: 'won' | 'abandoned';
  seconds: number;
  mistakes: number;
  hints: number;
  powerUps: number;
  score: number;
  stardust: number;
}

export interface DailyRecord {
  results: Record<string, { score: number; seconds: number }>;
  streak: number;
  best: number;
  lastWin: string | null;
}

export interface Profile {
  level: number;
  stardust: number;
  inventory: Record<PowerUpId, number>;
  themes: ThemeId[];
  activeTheme: ThemeId;
  achievements: Partial<Record<AchievementId, string>>;
  played: number;
  wins: number;
  abandons: number;
  winStreak: number;
  bestWinStreak: number;
  perfectGames: number;
  tiers: Record<Tier, TierStats>;
  history: HistoryEntry[];
  activity: Record<string, number>;
  daily: DailyRecord;
}

export interface Settings { haptics: boolean; reduceMotion: 'system' | 'on' | 'off' }
