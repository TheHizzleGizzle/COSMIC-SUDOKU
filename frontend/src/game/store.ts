import { useSyncExternalStore } from 'react';
import { generatePuzzle } from '@/src/engine/sudoku';
import { ACHIEVEMENTS, CORRUPT_NOTICE, COSMOS, DAILY_CLUES, POWER_UPS, THEMES, TIER_LABEL, cluesForLevel, powerUpDef, tierForLevel } from './content';
import { dailyTier, todayKey } from './dates';
import { applyFreeze, applyHint, applyReveal, applyShield, computeResult, createGame, enterDigit, eraseCell, redoMove, tickGame, undoMove } from './game';
import { haptic, type HapticKind } from './haptics';
import { loadSave, writeSave } from './persistence';
import { applyAbandon, applyWin, defaultProfile, defaultSettings, evaluateAchievements, normalizeDailyStreak } from './profile';
import type { AchievementId, Game, GameKind, PowerUpId, Profile, Settings, ThemeId } from './types';

export type Mood = 'happy' | 'cheer' | 'oops' | 'think' | 'wow';
export type ToastTone = 'info' | 'success' | 'error' | 'gold';

export interface AppState {
  ready: boolean;
  profile: Profile;
  settings: Settings;
  levelGame: Game | null;
  dailyGame: Game | null;
  activeKind: GameKind;
  celebrationOpen: boolean;
  toast: { id: number; text: string; tone: ToastTone } | null;
  cosmos: { id: number; text: string; mood: Mood; at: number };
  fx: { shake: number; glowId: PowerUpId | null; glowN: number };
}

let state: AppState = {
  ready: false,
  profile: defaultProfile(),
  settings: defaultSettings(),
  levelGame: null,
  dailyGame: null,
  activeKind: 'level',
  celebrationOpen: false,
  toast: null,
  cosmos: { id: 0, text: COSMOS.welcome, mood: 'happy', at: 0 },
  fx: { shake: 0, glowId: null, glowN: 0 },
};
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getState = () => state;
function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}
export const activeGame = (s: AppState) => (s.activeKind === 'daily' ? s.dailyGame : s.levelGame);

// ---------- helpers ----------
let seq = 1;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const fill = (t: string, vars: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
const rc = (i: number) => ({ r: Math.floor(i / 9) + 1, c: (i % 9) + 1 });
const listJoin = (d: number[]) => (d.length <= 1 ? d.join('') : `${d.slice(0, -1).join(', ')} or ${d[d.length - 1]}`);
const buzz = (k: HapticKind) => haptic(k, state.settings.haptics);
function say(text: string, mood: Mood) { setState({ cosmos: { id: seq++, text, mood, at: Date.now() } }); }
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(text: string, tone: ToastTone = 'info', ms = 2400) {
  const id = seq++;
  setState({ toast: { id, text, tone } });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (state.toast?.id === id) setState({ toast: null }); }, ms);
}
function updateActive(g: Game) { setState(g.kind === 'daily' ? { dailyGame: g } : { levelGame: g }); }
const achName = (id: AchievementId) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;

function makeLevelGame(level: number): Game {
  const seed = `level/${level}/${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;
  return createGame(generatePuzzle(seed, tierForLevel(level), cluesForLevel(level)), 'level', level, null);
}
function makeDailyGame(date: string): Game {
  const tier = dailyTier(date);
  return createGame(generatePuzzle(`cosmic-sudoku/daily/${date}`, tier, DAILY_CLUES[tier]), 'daily', 0, date);
}

function handleWin(game: Game) {
  const base = computeResult(game);
  const { profile, unlocked } = applyWin(state.profile, game, base, todayKey());
  const won: Game = { ...game, result: { ...base, newAchievements: unlocked } };
  setState({ profile, celebrationOpen: true, ...(won.kind === 'daily' ? { dailyGame: won } : { levelGame: won }) });
  buzz('win');
  if (won.kind === 'daily') say(COSMOS.dailyWin, 'cheer');
  else say(profile.winStreak >= 3 ? fill(COSMOS.streak, { n: profile.winStreak }) : pick(COSMOS.win), 'cheer');
}

// ---------- autosave ----------
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saved: unknown[] = [];
let saveWarned = false;
const persisted = () => [state.profile, state.settings, state.levelGame, state.dailyGame, state.activeKind];
export function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!state.ready) return;
  saved = persisted();
  const { profile, settings, levelGame, dailyGame, activeKind } = state;
  writeSave({ profile, settings, levelGame, dailyGame, activeKind }).catch(() => {
    if (!saveWarned) { saveWarned = true; showToast("Couldn't save progress on this phone. You can keep playing.", 'error', 4000); }
  });
}
function startAutosave() {
  saved = persisted();
  subscribe(() => {
    if (saveTimer) return;
    const now = persisted();
    if (now.every((v, i) => v === saved[i])) return;
    saveTimer = setTimeout(() => { saveTimer = null; saveNow(); }, 1500);
  });
}

// ---------- actions ----------
export const actions = {
  async boot() {
    if (state.ready) return;
    const { doc, corrupt } = await loadSave();
    const today = todayKey();
    const profile = normalizeDailyStreak(doc?.profile ?? defaultProfile(), today);
    let levelGame = doc?.levelGame ?? null;
    let dailyGame = doc?.dailyGame ?? null;
    let activeKind: GameKind = doc?.activeKind ?? 'level';
    if (dailyGame && dailyGame.date !== today) dailyGame = null;
    if (!dailyGame) activeKind = 'level';
    if (!levelGame || levelGame.level !== profile.level) levelGame = makeLevelGame(profile.level);
    const returning = !!doc;
    const pause = (g: Game | null) => (g && returning && g.status === 'playing' && g.entries + g.activeMs > 0 ? { ...g, paused: true } : g);
    setState({
      ready: true, profile, settings: doc?.settings ?? defaultSettings(), levelGame: pause(levelGame), dailyGame: pause(dailyGame), activeKind,
      cosmos: { id: seq++, text: returning ? COSMOS.resume : COSMOS.welcome, mood: 'happy', at: Date.now() },
    });
    startAutosave();
    if (corrupt) showToast(CORRUPT_NOTICE, 'error', 6000);
  },

  selectCell(i: number) {
    const g = activeGame(state);
    if (!g || (g.selected === i && !g.paused)) return;
    updateActive({ ...g, selected: i, paused: false });
  },

  inputDigit(d: number) {
    const g = activeGame(state);
    if (!g || g.status !== 'playing') return;
    if (g.selected === null) { showToast('Tap a cell first, then a number.'); return; }
    const { game, outcome } = enterDigit(g, d);
    if (outcome === 'none') return;
    updateActive(game);
    if (outcome === 'mistake') {
      buzz('error');
      setState({ fx: { ...state.fx, shake: state.fx.shake + 1 } });
      say(pick(COSMOS.mistake), 'oops');
    } else if (outcome === 'shielded') {
      buzz('tick');
      say(COSMOS.shield, 'wow');
      showToast('Error Shield absorbed a mistake', 'success');
    } else if (outcome === 'won') handleWin(game);
  },

  erase() {
    const g = activeGame(state);
    const next = g && eraseCell(g);
    if (next) updateActive(next);
  },
  undo() {
    const g = activeGame(state);
    const next = g && undoMove(g);
    if (next) updateActive(next);
  },
  redo() {
    const g = activeGame(state);
    const next = g && redoMove(g);
    if (!next) return;
    updateActive(next);
    if (next.status === 'won') handleWin(next);
  },
  toggleNotes() {
    const g = activeGame(state);
    if (!g || g.status !== 'playing') return;
    updateActive({ ...g, notesMode: !g.notesMode });
  },

  usePowerUp(id: PowerUpId) {
    const g = activeGame(state);
    if (!g) return;
    const def = powerUpDef(id);
    if (g.status !== 'playing') { showToast('This puzzle is already solved!'); return; }
    const qty = state.profile.inventory[id];
    if (qty <= 0) { showToast(`Out of ${def.name} — get more in the Shop.`); return; }
    const charge = (game: Game) => {
      setState({
        profile: { ...state.profile, inventory: { ...state.profile.inventory, [id]: qty - 1 } },
        fx: { ...state.fx, glowId: id, glowN: state.fx.glowN + 1 },
      });
      updateActive(game);
      buzz('tick');
    };
    if (id === 'hint') {
      const res = applyHint(g);
      if (!res.ok) { showToast(res.message); return; }
      charge(res.game);
      const { r, c } = rc(res.cell);
      if (res.kind === 'wrong') say(fill(COSMOS.hintWrong, { d: res.digits[0], r, c }), 'think');
      else if (res.digits.length === 1) say(fill(COSMOS.hintSingle, { d: res.digits[0], r, c }), 'wow');
      else say(fill(COSMOS.hintMany, { r, c, list: listJoin(res.digits) }), 'think');
    } else if (id === 'reveal') {
      const res = applyReveal(g, Math.random);
      if (!res.ok) { showToast(res.message); return; }
      charge(res.game);
      const { r, c } = rc(res.cell);
      say(fill(COSMOS.reveal, { d: res.digit, r, c }), 'wow');
      if (res.won) handleWin(res.game);
    } else {
      const res = id === 'freeze' ? applyFreeze(g) : applyShield(g);
      if (!res.ok) { showToast(res.message); return; }
      charge(res.game);
      say(id === 'freeze' ? COSMOS.freeze : COSMOS.shieldOn, 'happy');
    }
  },

  tick(dt: number) {
    const g = activeGame(state);
    if (!g || g.status !== 'playing' || g.paused) return;
    const next = tickGame(g, dt);
    updateActive(next);
    if (g.freezeMs > 0 && next.freezeMs === 0) say(COSMOS.thaw, 'happy');
  },

  needsAbandonConfirm() {
    const g = state.levelGame;
    return state.activeKind === 'level' && !!g && g.status === 'playing' && g.entries >= 10;
  },
  newPuzzle() {
    if (state.activeKind !== 'level') return;
    const g = state.levelGame;
    const abandoned = !!g && g.status === 'playing' && g.entries >= 10;
    const profile = abandoned && g ? applyAbandon(state.profile, g, todayKey()) : state.profile;
    setState({ profile, levelGame: makeLevelGame(profile.level), celebrationOpen: false });
    say(abandoned ? COSMOS.abandon : pick(COSMOS.fresh), 'happy');
  },
  nextLevel() {
    if (state.levelGame?.status !== 'won') return;
    const level = state.profile.level + 1;
    const ev = evaluateAchievements({ ...state.profile, level });
    setState({ profile: ev.profile, levelGame: makeLevelGame(level), activeKind: 'level', celebrationOpen: false });
    ev.unlocked.forEach((a) => showToast(`Achievement unlocked: ${achName(a)}`, 'gold', 3000));
    if (level % 10 === 0) say(fill(COSMOS.milestone, { n: level }), 'wow');
    else say(fill(pick(COSMOS.nextLevel), { n: level, tier: TIER_LABEL[tierForLevel(level)] }), 'happy');
  },
  playAgain() {
    setState({ levelGame: makeLevelGame(state.profile.level), activeKind: 'level', celebrationOpen: false });
    say(pick(COSMOS.fresh), 'happy');
  },
  startDaily() {
    const today = todayKey();
    let dg = state.dailyGame && state.dailyGame.date === today ? state.dailyGame : null;
    if (!dg) {
      dg = makeDailyGame(today);
      say(fill(COSMOS.dailyStart, { tier: TIER_LABEL[dg.tier] }), 'happy');
    } else {
      dg = { ...dg, paused: false };
      if (dg.status === 'playing') say(COSMOS.dailyResume, 'happy');
    }
    setState({ dailyGame: dg, activeKind: 'daily', celebrationOpen: false });
  },
  backToLevels() {
    setState({ activeKind: 'level', celebrationOpen: false });
    say(fill(COSMOS.levels, { n: state.profile.level }), 'happy');
  },
  closeCelebration() { setState({ celebrationOpen: false }); },
  openCelebration() { if (activeGame(state)?.result) setState({ celebrationOpen: true }); },

  buyPowerUp(id: PowerUpId) {
    const def = powerUpDef(id);
    const p = state.profile;
    if (p.stardust < def.cost) { showToast(`You need ${def.cost - p.stardust} more stardust.`); return; }
    setState({ profile: { ...p, stardust: p.stardust - def.cost, inventory: { ...p.inventory, [id]: p.inventory[id] + 1 } } });
    buzz('tick');
    showToast(`+1 ${def.name}`, 'gold');
  },
  buyTheme(id: ThemeId) {
    const def = THEMES.find((t) => t.id === id);
    const p = state.profile;
    if (!def || p.themes.includes(id)) return;
    if (p.stardust < def.cost) { showToast(`You need ${def.cost - p.stardust} more stardust.`); return; }
    const ev = evaluateAchievements({ ...p, stardust: p.stardust - def.cost, themes: [...p.themes, id], activeTheme: id });
    setState({ profile: ev.profile });
    buzz('tick');
    showToast(`${def.name} unlocked and applied!`, 'gold');
    ev.unlocked.forEach((a) => setTimeout(() => showToast(`Achievement unlocked: ${achName(a)}`, 'gold', 3000), 2500));
  },
  applyTheme(id: ThemeId) {
    if (!state.profile.themes.includes(id)) return;
    setState({ profile: { ...state.profile, activeTheme: id } });
  },
  setSettings(patch: Partial<Settings>) { setState({ settings: { ...state.settings, ...patch } }); },
  resetProgress() {
    const profile = defaultProfile();
    setState({ profile, levelGame: makeLevelGame(1), dailyGame: null, activeKind: 'level', celebrationOpen: false });
    say(COSMOS.reset, 'happy');
    saveNow();
    showToast('Progress reset — a fresh journey begins.', 'success');
  },
  cosmosIdle() {
    const g = activeGame(state);
    if (!g || g.status !== 'playing' || g.paused || Date.now() - state.cosmos.at < 20000) return;
    say(pick(COSMOS.idle), 'happy');
  },
  onBackground() {
    const g = activeGame(state);
    if (g && g.status === 'playing' && !g.paused && (g.entries > 0 || g.activeMs > 0)) updateActive({ ...g, paused: true });
    saveNow();
  },
  onForeground() {
    const today = todayKey();
    const profile = normalizeDailyStreak(state.profile, today);
    if (state.dailyGame && state.dailyGame.date !== today) {
      setState({ profile, dailyGame: null, activeKind: 'level' });
      showToast("A new Daily Cosmic is ready!", 'gold');
    } else if (profile !== state.profile) setState({ profile });
  },
};

export const POWER_UP_IDS = POWER_UPS.map((p) => p.id);
