import type { ComponentProps } from 'react';
import type { Lucide } from '@react-native-vector-icons/lucide';
import type { AchievementId, PowerUpId, ThemeId, Tier } from './types';

export type IconName = ComponentProps<typeof Lucide>['name'];

export const TIERS: Tier[] = ['easy', 'medium', 'hard', 'expert'];
export const TIER_LABEL: Record<Tier, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };
export const TIER_MULTIPLIER: Record<Tier, number> = { easy: 1, medium: 1.5, hard: 2, expert: 2.5 };

export function tierForLevel(level: number): Tier {
  if (level <= 10) return 'easy';
  if (level <= 25) return 'medium';
  if (level <= 50) return 'hard';
  return 'expert';
}

/** Fewer givens as the level rises inside each band (puzzles always stay single-solution). */
export function cluesForLevel(level: number): number {
  if (level <= 10) return 45 - Math.round(((level - 1) * 5) / 9);
  if (level <= 25) return 36 - Math.round(((level - 11) * 5) / 14);
  if (level <= 50) return 30 - Math.round(((level - 26) * 4) / 24);
  return 25 - Math.round((Math.min(level - 51, 49) * 3) / 49);
}

export const DAILY_CLUES: Record<Tier, number> = { easy: 42, medium: 33, hard: 28, expert: 24 };

export interface PowerUpDef { id: PowerUpId; name: string; short: string; icon: IconName; cost: number; start: number; description: string }
export const POWER_UPS: PowerUpDef[] = [
  { id: 'hint', name: 'Stellar Hint', short: 'Hint', icon: 'lightbulb', cost: 50, start: 3, description: 'Shows the possible numbers for the selected cell, or points out a wrong digit.' },
  { id: 'reveal', name: 'Cosmic Reveal', short: 'Reveal', icon: 'sparkles', cost: 100, start: 1, description: 'Fills the selected empty cell with the correct digit — or a random cell if none is selected.' },
  { id: 'freeze', name: 'Time Freeze', short: 'Freeze', icon: 'snowflake', cost: 75, start: 2, description: 'Stops the scoring clock for 30 seconds of play.' },
  { id: 'shield', name: 'Error Shield', short: 'Shield', icon: 'shield', cost: 60, start: 2, description: 'Absorbs your next mistake: no penalty, and Perfect stays intact.' },
];
export const powerUpDef = (id: PowerUpId) => POWER_UPS.find((p) => p.id === id) as PowerUpDef;

export interface ThemeDef { id: ThemeId; name: string; cost: number; tagline: string }
export const THEMES: ThemeDef[] = [
  { id: 'default', name: 'Classic Cosmos', cost: 0, tagline: 'Stellar cyan, aurora pink, galaxy purple' },
  { id: 'nebula', name: 'Nebula Dreams', cost: 500, tagline: 'Rose-pink clouds of newborn stars' },
  { id: 'aurora', name: 'Aurora Borealis', cost: 750, tagline: 'Emerald lights over a polar sky' },
  { id: 'galaxy', name: 'Galaxy Explorer', cost: 1000, tagline: 'Deep indigo of the outer arms' },
];

export interface AchievementDef { id: AchievementId; name: string; description: string; icon: IconName }
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-win', name: 'First Victory', description: 'Complete your first puzzle', icon: 'trophy' },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Win in under 3 minutes', icon: 'zap' },
  { id: 'perfect-scholar', name: 'Perfect Scholar', description: 'Win without a mistake', icon: 'target' },
  { id: 'streak-5', name: 'On Fire', description: 'Win 5 games in a row', icon: 'flame' },
  { id: 'level-10', name: 'Rising Star', description: 'Reach level 10', icon: 'star' },
  { id: 'collector', name: 'Cosmic Collector', description: 'Unlock 3 cosmic themes', icon: 'orbit' },
  { id: 'daily-7', name: 'Daily Devotee', description: 'Reach a 7-day daily streak', icon: 'calendar-check' },
  { id: 'pure-logic', name: 'Pure Logic', description: 'Win Hard or Expert without power-ups', icon: 'brain' },
  { id: 'cartographer', name: 'Cartographer', description: 'Win after using notes in 20+ cells', icon: 'map' },
];

export const COSMOS = {
  welcome: "Hi, I'm Cosmos! Tap a cell, then a number. Let's chart some stars.",
  resume: 'Welcome back, star navigator! Tap the board to resume.',
  idle: [
    "You're doing stellar!",
    'Every number finds its place in the cosmos.',
    'Scan a row, a column, a box… the stars will align.',
    'Notes are star maps — sketch the possibilities.',
    'Look for the cell with the fewest options.',
    'Your brain is out of this world!',
    'Cosmic wisdom guides you.',
  ],
  mistake: [
    'Even stars flicker sometimes. Keep shining!',
    "Course correction! That digit doesn't fit.",
    "Just cosmic dust — try another number.",
    'Every explorer makes course corrections.',
  ],
  shield: 'My shield caught that one — no penalty, still perfect!',
  shieldOn: 'Shield up! Your next mistake is on me.',
  hintWrong: "Psst… the {d} at row {r}, column {c} doesn't belong.",
  hintSingle: 'Only a {d} fits at row {r}, column {c}!',
  hintMany: 'Row {r}, column {c} could be {list}.',
  reveal: 'Ta-da! A {d} from the stars at row {r}, column {c}.',
  freeze: 'Time is frozen for 30 seconds. No rush…',
  thaw: 'The clock is ticking again. You got this!',
  win: [
    "Magnificent! You've conquered another galaxy!",
    'Stellar performance, cosmic champion!',
    'The universe celebrates your victory!',
    "You're a true star navigator!",
  ],
  streak: '{n} wins in a row — blazing like a comet!',
  nextLevel: ['Level {n} — onward through the stars!', 'Level {n}, {tier}. Ready for lift-off?'],
  milestone: 'Level {n}! A milestone — a whole new galaxy awaits.',
  fresh: ['A fresh sky of numbers. Good luck!', 'New puzzle, new constellations!'],
  abandon: 'Starting fresh. Your streak resets, but I still believe in you.',
  dailyStart: "Today's Daily Cosmic is {tier}. Same sky for everyone — make it count!",
  dailyResume: 'Back to the Daily Cosmic. Keep going!',
  dailyWin: 'Daily Cosmic complete! +100 bonus stardust and your streak grows.',
  levels: 'Back to the levels. Level {n} awaits!',
  reset: 'A brand-new journey begins. Hi again!',
};

export const CORRUPT_NOTICE = "Your saved game couldn't be read, so a fresh journey has begun.";
