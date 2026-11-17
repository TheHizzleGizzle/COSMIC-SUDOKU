import { ACHIEVEMENTS, POWER_UPS } from './content';
import { addDays } from './dates';
import type { AchievementId, DailyRecord, Game, HistoryEntry, Profile, Settings, WinResult } from './types';

export const HISTORY_CAP = 200;

export function defaultProfile(): Profile {
  const blank = () => ({ wins: 0, totalSeconds: 0, bestSeconds: null });
  return {
    level: 1,
    stardust: 100,
    inventory: Object.fromEntries(POWER_UPS.map((p) => [p.id, p.start])) as Profile['inventory'],
    themes: ['default'],
    activeTheme: 'default',
    achievements: {},
    played: 0, wins: 0, abandons: 0, winStreak: 0, bestWinStreak: 0, perfectGames: 0,
    tiers: { easy: blank(), medium: blank(), hard: blank(), expert: blank() },
    history: [],
    activity: {},
    daily: { results: {}, streak: 0, best: 0, lastWin: null },
  };
}

export const defaultSettings = (): Settings => ({ haptics: true, reduceMotion: 'system' });

export const effectiveDailyStreak = (d: DailyRecord, today: string) =>
  d.lastWin === today || d.lastWin === addDays(today, -1) ? d.streak : 0;

/** A missed day resets the daily streak. */
export function normalizeDailyStreak(p: Profile, today: string): Profile {
  const s = effectiveDailyStreak(p.daily, today);
  return s === p.daily.streak ? p : { ...p, daily: { ...p.daily, streak: s } };
}

interface Ctx { game?: Game; result?: WinResult }
const CHECKS: Record<AchievementId, (p: Profile, c: Ctx) => boolean> = {
  'first-win': (p) => p.wins >= 1,
  'speed-demon': (_, c) => !!c.result && c.result.activeSeconds < 180,
  'perfect-scholar': (_, c) => !!c.result && c.result.perfect,
  'streak-5': (p) => p.winStreak >= 5,
  'level-10': (p) => p.level >= 10,
  collector: (p) => p.themes.length >= 3,
  'daily-7': (p) => p.daily.streak >= 7,
  'pure-logic': (_, c) => !!c.game && !!c.result && (c.game.tier === 'hard' || c.game.tier === 'expert') && c.game.powerUpsUsed === 0,
  cartographer: (_, c) => !!c.game && !!c.result && c.game.notesCells.length >= 20,
};

export function evaluateAchievements(p: Profile, ctx: Ctx = {}): { profile: Profile; unlocked: AchievementId[] } {
  const unlocked = ACHIEVEMENTS.map((a) => a.id).filter((id) => !p.achievements[id] && CHECKS[id](p, ctx));
  if (!unlocked.length) return { profile: p, unlocked };
  const now = new Date().toISOString();
  const achievements = { ...p.achievements };
  for (const id of unlocked) achievements[id] = now;
  return { profile: { ...p, achievements }, unlocked };
}

function bumpActivity(activity: Record<string, number>, today: string) {
  const cutoff = addDays(today, -70);
  const next: Record<string, number> = {};
  for (const [k, v] of Object.entries(activity)) if (k >= cutoff) next[k] = v;
  next[today] = (next[today] ?? 0) + 1;
  return next;
}

function entry(g: Game, outcome: HistoryEntry['outcome'], r: WinResult | null): HistoryEntry {
  return {
    at: new Date().toISOString(), kind: g.kind, level: g.kind === 'level' ? g.level : null, tier: g.tier, outcome,
    seconds: Math.floor(g.activeMs / 1000), mistakes: g.mistakes, hints: g.hintsUsed, powerUps: g.powerUpsUsed,
    score: r?.score ?? 0, stardust: r?.stardust ?? 0,
  };
}

export function applyWin(p: Profile, g: Game, r: WinResult, today: string): { profile: Profile; unlocked: AchievementId[] } {
  const t = p.tiers[g.tier];
  const winStreak = p.winStreak + 1;
  let daily = p.daily;
  if (g.kind === 'daily' && g.date) {
    const streak = daily.lastWin === g.date ? daily.streak : daily.lastWin === addDays(g.date, -1) ? daily.streak + 1 : 1;
    daily = { results: { ...daily.results, [g.date]: { score: r.score, seconds: r.activeSeconds } }, streak, best: Math.max(daily.best, streak), lastWin: g.date };
  }
  const next: Profile = {
    ...p,
    stardust: p.stardust + r.stardust,
    played: p.played + 1,
    wins: p.wins + 1,
    winStreak,
    bestWinStreak: Math.max(p.bestWinStreak, winStreak),
    perfectGames: p.perfectGames + (r.perfect ? 1 : 0),
    tiers: { ...p.tiers, [g.tier]: { wins: t.wins + 1, totalSeconds: t.totalSeconds + r.activeSeconds, bestSeconds: t.bestSeconds === null ? r.activeSeconds : Math.min(t.bestSeconds, r.activeSeconds) } },
    history: [entry(g, 'won', r), ...p.history].slice(0, HISTORY_CAP),
    activity: bumpActivity(p.activity, today),
    daily,
  };
  return evaluateAchievements(next, { game: g, result: r });
}

/** Abandoning after 10+ digits counts as a loss and resets the win streak. */
export function applyAbandon(p: Profile, g: Game, today: string): Profile {
  return {
    ...p,
    played: p.played + 1,
    abandons: p.abandons + 1,
    winStreak: 0,
    history: [entry(g, 'abandoned', null), ...p.history].slice(0, HISTORY_CAP),
    activity: bumpActivity(p.activity, today),
  };
}
