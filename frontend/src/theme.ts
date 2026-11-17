import { useMemo } from 'react';
import { useStore } from '@/src/game/store';
import type { ThemeId, Tier } from '@/src/game/types';

/** Base tokens — same keys as the `color` block of design_guidelines.json, plus glass helpers. */
export const colors = {
  surface: '#0a0a1a',
  onSurface: '#ffffff',
  surfaceSecondary: '#1a1b3a',
  onSurfaceSecondary: '#e2e8f0',
  surfaceTertiary: '#2d3561',
  onSurfaceTertiary: '#cbd5e1',
  surfaceInverse: '#ffffff',
  onSurfaceInverse: '#0a0a1a',
  brand: '#00f5ff',
  onBrand: '#000000',
  brandPrimary: '#00f5ff',
  onBrandPrimary: '#000000',
  brandSecondary: '#c471ed',
  onBrandSecondary: '#ffffff',
  brandTertiary: '#ff6b9d',
  onBrandTertiary: '#000000',
  success: '#00e676',
  onSuccess: '#000000',
  warning: '#ffd700',
  onWarning: '#000000',
  error: '#ff5a1f',
  onError: '#ffffff',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.25)',
  divider: 'rgba(255, 255, 255, 0.05)',
  muted: 'rgba(255, 255, 255, 0.5)',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassStrong: 'rgba(255, 255, 255, 0.11)',
  glassHighlight: 'rgba(255, 255, 255, 0.22)',
  scrim: 'rgba(5, 5, 16, 0.72)',
  sheet: '#141631',
  tabBar: '#0c0d22',
  gold: '#ffd700',
};

export const tierColors: Record<Tier, string> = { easy: '#4ade80', medium: '#38bdf8', hard: '#fb7185', expert: '#c084fc' };

export interface CosmicPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: readonly [string, string, string];
  star: string;
  playerDigit: string;
  cell: string;
  thinLine: string;
}

export const cosmicPalettes: Record<ThemeId, CosmicPalette> = {
  default: { primary: '#00f5ff', secondary: '#c471ed', accent: '#ff6b9d', bg: ['#0a0a1a', '#1a1b3a', '#2d3561'], star: '#e6fbff', playerDigit: '#00e5ee', cell: '#141733', thinLine: '#272b55' },
  nebula: { primary: '#ff4081', secondary: '#ce5ee0', accent: '#ff7aa8', bg: ['#0d0814', '#201233', '#3a1e5d'], star: '#ffe3f0', playerDigit: '#ff6699', cell: '#1a0f29', thinLine: '#35214c' },
  aurora: { primary: '#00e676', secondary: '#9ccc65', accent: '#5fd38d', bg: ['#05110a', '#0b2b1a', '#134d32'], star: '#e3fff0', playerDigit: '#33ff99', cell: '#0c1d15', thinLine: '#1e3d2e' },
  galaxy: { primary: '#7f8cf5', secondary: '#a98be0', accent: '#8c9eff', bg: ['#080914', '#16193b', '#2a3070'], star: '#e8ebff', playerDigit: '#8c9eff', cell: '#12142e', thinLine: '#272b5a' },
};

export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function buildTheme(id: ThemeId) {
  const p = cosmicPalettes[id] ?? cosmicPalettes.default;
  return {
    ...colors,
    ...p,
    id,
    selected: alpha(p.primary, 0.3),
    peer: alpha(p.primary, 0.09),
    same: alpha(p.primary, 0.2),
    glow: alpha(p.primary, 0.5),
    primarySoft: alpha(p.primary, 0.15),
    thickLine: alpha(p.primary, 0.45),
  };
}
export type Theme = ReturnType<typeof buildTheme>;

export function useTheme(): Theme {
  const id = useStore((s) => s.profile.activeTheme);
  return useMemo(() => buildTheme(id), [id]);
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const fontSize = { sm: 12, base: 14, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const fonts = {
  regular: 'Nunito-Regular',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extrabold: 'Nunito-ExtraBold',
  black: 'Nunito-Black',
};
