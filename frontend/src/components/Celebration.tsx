import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { Lucide } from '@react-native-vector-icons/lucide';
import { ACHIEVEMENTS } from '@/src/game/content';
import { formatDuration } from '@/src/game/dates';
import { actions, activeGame, useStore } from '@/src/game/store';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { alpha, colors, fonts, radius, spacing, useTheme } from '@/src/theme';
import { CosmosMascot } from './CosmosMascot';
import { Sheet } from './Sheet';
import { Button, IconButton } from './ui';

function Piece({ x, delay, color, h, rot, w }: { x: number; delay: number; color: string; h: number; rot: number; w: number }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(delay, withTiming(1, { duration: 2400, easing: Easing.in(Easing.quad) })); }, [delay, p]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - p.value * 0.6, transform: [{ translateY: -30 + p.value * (h + 60) }, { translateX: Math.sin(p.value * 6 + x) * 18 }, { rotate: `${rot * p.value}deg` }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: x, width: w, height: w * 1.6, borderRadius: 2, backgroundColor: color }, style]} />;
}

function Spark({ angle, color }: { angle: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }); }, [p]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ translateX: Math.cos(angle) * 70 * p.value }, { translateY: Math.sin(angle) * 70 * p.value }, { scale: 1 - p.value * 0.5 }] }));
  return <Animated.View pointerEvents="none" style={[styles.spark, style]}><Lucide name="sparkle" size={14} color={color} /></Animated.View>;
}

function Confetti() {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => {
    const palette = [t.primary, t.secondary, t.accent, colors.gold, '#ffffff'];
    return Array.from({ length: 36 }, (_, k) => ({ x: Math.random() * width, delay: Math.random() * 500, color: palette[k % palette.length], rot: 180 + Math.random() * 540, w: 5 + Math.random() * 5 }));
  });
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{pieces.map((p, i) => <Piece key={i} {...p} h={height} />)}</View>;
}

/** Win celebration: shows exactly what was credited. Dismissible; the board stays visible above it. */
export function Celebration() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const open = useStore((s) => s.celebrationOpen);
  const game = useStore(activeGame);
  const streak = useStore((s) => s.profile.daily.streak);
  const r = game?.result;
  if (!game || !r) return null;
  const daily = game.kind === 'daily';
  const perf = r.perfect && r.activeSeconds < 180 ? 'Absolutely stellar!' : r.perfect ? 'Perfect precision!' : r.activeSeconds < 300 ? 'Lightning fast!' : 'Well done, navigator!';
  const stats = [
    { id: 'score', label: 'Score', value: r.score.toLocaleString(), icon: 'trophy' as const, color: t.primary },
    { id: 'time', label: 'Time', value: formatDuration(r.activeSeconds), icon: 'timer' as const, color: colors.onSurface },
    { id: 'mistakes', label: 'Mistakes', value: String(r.mistakes), icon: 'circle-x' as const, color: r.mistakes ? colors.error : colors.success },
    { id: 'stardust', label: 'Stardust', value: `+${r.stardust}`, icon: 'sparkle' as const, color: colors.gold },
  ];
  return (
    <Sheet visible={open} onClose={actions.closeCelebration} testID="celebration-sheet" scrim="rgba(5,5,16,0.35)" overlay={!reduce && open ? <Confetti /> : null}>
      <View style={styles.close}><IconButton testID="celebration-close" icon="x" label="Close" onPress={actions.closeCelebration} /></View>
      <View style={styles.head}>
        {!reduce ? Array.from({ length: 12 }, (_, i) => <Spark key={i} angle={(i / 12) * Math.PI * 2} color={colors.gold} />) : null}
        <CosmosMascot size={64} mood="cheer" />
      </View>
      <Text testID="celebration-title" style={styles.title}>{daily ? 'Daily Cosmic complete!' : `Level ${game.level} complete!`}</Text>
      <Text style={[styles.perf, { color: t.accent }]}>{perf}</Text>
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.id} style={styles.stat}>
            <Lucide name={s.icon} size={18} color={s.color} />
            <Text testID={`celebration-${s.id}`} style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text testID="celebration-breakdown" style={styles.breakdown}>
        Base {r.base} + time {r.timeBonus}{r.levelBonus ? ` + level ${r.levelBonus}` : ''}{r.penalty ? ` − mistakes ${r.penalty}` : ''} = {r.score}
        {r.dailyBonus ? `  ·  +${r.dailyBonus} daily bonus  ·  ${streak}-day streak` : ''}
      </Text>
      {r.newAchievements.length ? (
        <View style={styles.chips}>
          {r.newAchievements.map((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id)!;
            return (
              <View key={id} style={[styles.chip, { borderColor: colors.gold, backgroundColor: alpha(colors.gold, 0.12) }]} testID={`celebration-achievement-${id}`}>
                <Lucide name={a.icon} size={14} color={colors.gold} />
                <Text style={styles.chipText}>{a.name}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      <View style={styles.buttons}>
        {daily ? (
          <View style={styles.flex}><Button testID="celebration-back-to-levels" label="Back to levels" icon="arrow-left" color={t.primary} onPress={actions.backToLevels} /></View>
        ) : (
          <>
            <View style={styles.flex}><Button testID="celebration-play-again" label="Play Again" icon="rotate-ccw" variant="ghost" onPress={actions.playAgain} /></View>
            <View style={styles.flex}><Button testID="celebration-next-level" label="Next Level" icon="play" color={t.primary} onPress={actions.nextLevel} /></View>
          </>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', right: spacing.md, top: spacing.md, zIndex: 2 },
  head: { alignItems: 'center', justifyContent: 'center', height: 72 },
  spark: { position: 'absolute' },
  title: { fontFamily: fonts.black, fontSize: 24, color: colors.onSurface, textAlign: 'center' },
  perf: { fontFamily: fonts.extrabold, fontSize: 15, textAlign: 'center', marginBottom: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  statValue: { fontFamily: fonts.black, fontSize: 18, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted },
  breakdown: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.gold },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  flex: { flex: 1 },
});
