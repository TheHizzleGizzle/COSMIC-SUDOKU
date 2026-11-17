import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Lucide } from '@react-native-vector-icons/lucide';
import { POWER_UPS, TIER_LABEL } from '@/src/game/content';
import { WEEKDAYS, formatDuration, parseKey } from '@/src/game/dates';
import { actions, activeGame, useStore } from '@/src/game/store';
import type { PowerUpId } from '@/src/game/types';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { alpha, colors, fonts, radius, spacing, tierColors, useTheme } from '@/src/theme';
import { CosmosMascot } from './CosmosMascot';
import { PressableScale } from './PressableScale';
import { Button, IconButton, StardustPill } from './ui';

function Timer() {
  const t = useTheme();
  const ms = useStore((s) => activeGame(s)?.activeMs ?? 0);
  const freeze = useStore((s) => activeGame(s)?.freezeMs ?? 0);
  return (
    <View style={styles.row}>
      {freeze > 0 ? <Lucide name="snowflake" size={16} color={t.primary} /> : <Lucide name="timer" size={16} color={colors.muted} />}
      <Text testID="hud-timer" style={[styles.timer, freeze > 0 && { color: t.primary }]}>{formatDuration(ms / 1000)}</Text>
      {freeze > 0 ? <Text testID="hud-freeze-remaining" style={[styles.small, { color: t.primary }]}>{Math.ceil(freeze / 1000)}s</Text> : null}
    </View>
  );
}

export function Hud({ onSettings, onNewPuzzle }: { onSettings: () => void; onNewPuzzle: () => void }) {
  const t = useTheme();
  const kind = useStore((s) => s.activeKind);
  const level = useStore((s) => activeGame(s)?.level ?? 1);
  const tier = useStore((s) => activeGame(s)?.tier ?? 'easy');
  const date = useStore((s) => activeGame(s)?.date ?? null);
  const stardust = useStore((s) => s.profile.stardust);
  const mistakes = useStore((s) => activeGame(s)?.mistakes ?? 0);
  const shield = useStore((s) => activeGame(s)?.shieldArmed ?? false);
  return (
    <View style={styles.hud}>
      <View style={styles.hudLeft}>
        <Text testID="hud-level" style={styles.kicker} numberOfLines={1}>{kind === 'daily' ? 'DAILY COSMIC' : `LEVEL ${level}`}</Text>
        <View style={[styles.tier, { borderColor: tierColors[tier], backgroundColor: alpha(tierColors[tier], 0.14) }]}>
          <Text testID="hud-difficulty" style={[styles.tierText, { color: tierColors[tier] }]}>
            {TIER_LABEL[tier]}{kind === 'daily' && date ? ` · ${WEEKDAYS[parseKey(date).getDay()].slice(0, 3)}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.hudMid}>
        <Timer />
        <View style={styles.row}>
          <Lucide name="circle-x" size={13} color={mistakes ? colors.error : colors.muted} />
          <Text testID="hud-mistakes" style={[styles.small, mistakes ? { color: colors.error } : null]}>{mistakes} {mistakes === 1 ? 'mistake' : 'mistakes'}</Text>
          {shield ? <Lucide testID="hud-shield-armed" name="shield-check" size={14} color={colors.success} /> : null}
        </View>
      </View>
      <View style={styles.hudRight}>
        <StardustPill value={stardust} testID="hud-stardust" />
        {kind === 'daily' ? (
          <IconButton testID="hud-back-to-levels" icon="arrow-left" label="Back to levels" onPress={actions.backToLevels} />
        ) : (
          <IconButton testID="hud-new-puzzle" icon="refresh-cw" label="New puzzle" onPress={onNewPuzzle} />
        )}
        <IconButton testID="hud-settings" icon="settings" label="Settings" onPress={onSettings} color={t.primary} />
      </View>
    </View>
  );
}

export function CosmosBubble({ height }: { height: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const cosmos = useStore((s) => s.cosmos);
  return (
    <View style={[styles.row, { height, gap: spacing.sm }]}>
      <CosmosMascot size={height} mood={cosmos.mood} />
      <View style={[styles.bubble, { borderColor: alpha(t.primary, 0.3) }]}>
        <View style={[styles.tail, { borderRightColor: alpha(t.primary, 0.3) }]} />
        <Animated.Text key={cosmos.id} entering={reduce ? undefined : FadeIn.duration(260)} testID="cosmos-message" numberOfLines={2} style={styles.bubbleText}>
          {cosmos.text}
        </Animated.Text>
      </View>
    </View>
  );
}

export function ControlRow({ height }: { height: number }) {
  const t = useTheme();
  const canUndo = useStore((s) => (activeGame(s)?.undo.length ?? 0) > 0);
  const canRedo = useStore((s) => (activeGame(s)?.redo.length ?? 0) > 0);
  const notesMode = useStore((s) => activeGame(s)?.notesMode ?? false);
  const items = [
    { id: 'undo', icon: 'undo-2', label: 'Undo', on: actions.undo, enabled: canUndo },
    { id: 'redo', icon: 'redo-2', label: 'Redo', on: actions.redo, enabled: canRedo },
    { id: 'notes', icon: 'pencil', label: notesMode ? 'Notes on' : 'Notes', on: actions.toggleNotes, enabled: true },
    { id: 'erase', icon: 'eraser', label: 'Erase', on: actions.erase, enabled: true },
  ] as const;
  return (
    <View style={[styles.row, { height, gap: spacing.sm }]}>
      {items.map((it) => {
        const active = it.id === 'notes' && notesMode;
        const c = active ? t.accent : it.enabled ? colors.onSurface : colors.muted;
        return (
          <PressableScale key={it.id} testID={`control-${it.id}`} onPress={it.on} accessibilityRole="button" accessibilityState={{ selected: active, disabled: !it.enabled }} style={[styles.control, active && { borderColor: t.accent, backgroundColor: alpha(t.accent, 0.16) }]}>
            <Lucide name={it.icon} size={17} color={c} />
            <Text style={[styles.controlText, { color: c }]} numberOfLines={1}>{it.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function NumberPad({ rowHeight }: { rowHeight: number }) {
  const t = useTheme();
  const values = useStore((s) => activeGame(s)?.values);
  const solution = useStore((s) => activeGame(s)?.solution ?? '');
  const notesMode = useStore((s) => activeGame(s)?.notesMode ?? false);
  const remaining = useMemo(() => {
    const r = Array(10).fill(9);
    values?.forEach((v, i) => { if (v && v === solution.charCodeAt(i) - 48) r[v]--; });
    return r;
  }, [values, solution]);
  const rows = [[1, 2, 3, 4, 5], [6, 7, 8, 9]];
  return (
    <View style={{ gap: spacing.sm }} testID="number-pad">
      {rows.map((row, ri) => (
        <View key={ri} style={[styles.row, { gap: spacing.sm, height: rowHeight }]}>
          {row.map((d) => {
            const done = remaining[d] === 0;
            return (
              <PressableScale key={d} testID={`pad-digit-${d}`} disabled={done && !notesMode} onPress={() => actions.inputDigit(d)} accessibilityLabel={`${d}, ${remaining[d]} left`} style={[styles.pad, notesMode && { borderColor: alpha(t.accent, 0.6) }, done && styles.padDone]}>
                <Text style={[styles.padDigit, { color: notesMode ? t.accent : colors.onSurface, fontSize: Math.min(28, rowHeight * 0.5) }]}>{d}</Text>
                <Text testID={`pad-digit-${d}-remaining`} style={styles.padCount}>{done ? '✓' : remaining[d]}</Text>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const PU_COLOR = (id: PowerUpId, t: ReturnType<typeof useTheme>) => (id === 'hint' ? colors.gold : id === 'reveal' ? t.accent : id === 'freeze' ? t.primary : colors.success);

function PowerUpTile({ id, height }: { id: PowerUpId; height: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const def = POWER_UPS.find((p) => p.id === id)!;
  const qty = useStore((s) => s.profile.inventory[id]);
  const active = useStore((s) => (id === 'freeze' ? (activeGame(s)?.freezeMs ?? 0) > 0 : id === 'shield' ? !!activeGame(s)?.shieldArmed : false));
  const glowN = useStore((s) => (s.fx.glowId === id ? s.fx.glowN : 0));
  const g = useSharedValue(0);
  const last = useRef(glowN);
  useEffect(() => {
    if (glowN === last.current) return;
    last.current = glowN;
    if (!reduce) g.value = withSequence(withTiming(1, { duration: 160 }), withTiming(0, { duration: 700 }));
  }, [glowN, reduce, g]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: 1 + g.value * 0.12 }], opacity: 1 - g.value * 0.1 }));
  const c = PU_COLOR(id, t);
  return (
    <PressableScale testID={`powerup-${id}`} onPress={() => actions.usePowerUp(id)} accessibilityLabel={`${def.name}, ${qty} left`} style={[styles.pu, { height }, (active || glowN > 0) && { borderColor: c }, active && { boxShadow: `0 0 14px ${alpha(c, 0.55)}`, backgroundColor: alpha(c, 0.12) }, qty === 0 && { opacity: 0.5 }]}>
      <Animated.View style={anim}><Lucide name={def.icon} size={20} color={c} /></Animated.View>
      <Text style={styles.puText} numberOfLines={1}>{active ? (id === 'shield' ? 'Armed' : 'Frozen') : def.short}</Text>
      <View style={[styles.badge, { backgroundColor: qty ? c : colors.glassStrong }]}>
        <Text testID={`powerup-${id}-count`} style={styles.badgeText}>{qty}</Text>
      </View>
    </PressableScale>
  );
}

export function PowerUpRow({ height }: { height: number }) {
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {POWER_UPS.map((p) => <PowerUpTile key={p.id} id={p.id} height={height} />)}
    </View>
  );
}

export function WinPanel({ height }: { height: number }) {
  const t = useTheme();
  const game = useStore(activeGame);
  if (!game) return null;
  const r = game.result;
  return (
    <View testID="win-panel" style={[styles.win, { height, borderColor: alpha(t.primary, 0.4) }]}>
      <Text style={styles.winTitle}>Puzzle solved!</Text>
      <Text style={styles.winSub}>{r ? `+${r.stardust} stardust · ${r.score.toLocaleString()} points` : 'Well done!'}</Text>
      <View style={[styles.row, { gap: spacing.sm, alignSelf: 'stretch' }]}>
        {game.kind === 'level' ? (
          <>
            <View style={styles.flex}><Button testID="win-panel-play-again" label="Play Again" icon="rotate-ccw" variant="ghost" onPress={actions.playAgain} /></View>
            <View style={styles.flex}><Button testID="win-panel-next-level" label="Next Level" icon="play" color={t.primary} onPress={actions.nextLevel} /></View>
          </>
        ) : (
          <View style={styles.flex}><Button testID="win-panel-back-to-levels" label="Back to levels" icon="arrow-left" color={t.primary} onPress={actions.backToLevels} /></View>
        )}
      </View>
      <PressableScale testID="win-panel-results" onPress={actions.openCelebration}><Text style={[styles.link, { color: t.primary }]}>See results</Text></PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
  hud: { flexDirection: 'row', alignItems: 'center', height: 54, gap: spacing.sm },
  hudLeft: { width: 96, gap: 4 },
  hudMid: { flex: 1, alignItems: 'center', gap: 2 },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 1, color: colors.onSurface },
  tier: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  tierText: { fontFamily: fonts.extrabold, fontSize: 11 },
  timer: { fontFamily: fonts.black, fontSize: 20, color: colors.onSurface, fontVariant: ['tabular-nums'] },
  small: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted, fontVariant: ['tabular-nums'] },
  bubble: { flex: 1, justifyContent: 'center', backgroundColor: colors.glass, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 4, alignSelf: 'stretch' },
  tail: { position: 'absolute', left: -7, top: '40%', width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 7, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, color: colors.onSurface },
  control: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  controlText: { fontFamily: fonts.bold, fontSize: 13 },
  pad: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.glassStrong, borderWidth: 1, borderColor: colors.borderStrong },
  padDone: { opacity: 0.35 },
  padDigit: { fontFamily: fonts.black, fontVariant: ['tabular-nums'] },
  padCount: { position: 'absolute', bottom: 3, right: 7, fontFamily: fonts.bold, fontSize: 10, color: colors.muted, fontVariant: ['tabular-nums'] },
  pu: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  puText: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSecondary },
  badge: { position: 'absolute', top: 4, right: 6, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontFamily: fonts.black, fontSize: 11, color: colors.onSurfaceInverse, fontVariant: ['tabular-nums'] },
  win: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, backgroundColor: colors.glass, padding: spacing.md },
  winTitle: { fontFamily: fonts.black, fontSize: 22, color: colors.onSurface },
  winSub: { fontFamily: fonts.bold, fontSize: 14, color: colors.gold },
  link: { fontFamily: fonts.bold, fontSize: 13, padding: 4 },
});
