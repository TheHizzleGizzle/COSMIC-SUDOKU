import type { Tier } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => dateKey(new Date());
export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(k: string, n: number): string {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
/** Mon–Tue Easy, Wed–Thu Medium, Fri–Sat Hard, Sun Expert. */
export function dailyTier(k: string): Tier {
  const w = parseKey(k).getDay();
  if (w === 0) return 'expert';
  if (w <= 2) return 'easy';
  if (w <= 4) return 'medium';
  return 'hard';
}
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function formatLongDate(k: string): string {
  const d = parseKey(k);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
export function relativeDay(iso: string): string {
  const k = dateKey(new Date(iso));
  const today = todayKey();
  if (k === today) return 'Today';
  if (k === addDays(today, -1)) return 'Yesterday';
  const d = parseKey(k);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
