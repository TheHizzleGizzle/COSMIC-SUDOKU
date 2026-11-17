import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { createRng } from '@/src/engine/rng';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { alpha, useTheme } from '@/src/theme';

const rng = createRng('cosmic-stars');
const STARS = Array.from({ length: 54 }, (_, k) => ({
  x: rng.nextInt(1000) / 10,
  y: rng.nextInt(1000) / 10,
  size: 1 + rng.nextInt(3) * 0.7,
  g: k % 3,
}));

function StarGroup({ group, color, reduce }: { group: number; color: string; reduce: boolean }) {
  const o = useSharedValue(0.85);
  useEffect(() => {
    if (reduce) { o.value = 0.75; return; }
    o.value = withDelay(group * 700, withRepeat(withTiming(0.2, { duration: 2400 + group * 600 }), -1, true));
    return () => cancelAnimation(o);
  }, [reduce, group, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {STARS.filter((s) => s.g === group).map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: s.size, backgroundColor: color }} />
      ))}
    </Animated.View>
  );
}

/** Deep-space gradient with soft nebula glows and slowly twinkling stars, tinted by the active theme. */
export function SpaceBackground() {
  const t = useTheme();
  const reduce = useReduceMotion();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={t.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.nebula, { top: -60, right: -40, boxShadow: `0 0 140px 110px ${alpha(t.secondary, 0.16)}`, backgroundColor: alpha(t.secondary, 0.16) }]} />
      <View style={[styles.nebula, { bottom: 80, left: -60, boxShadow: `0 0 140px 100px ${alpha(t.primary, 0.1)}`, backgroundColor: alpha(t.primary, 0.1) }]} />
      {[0, 1, 2].map((g) => <StarGroup key={g} group={g} color={t.star} reduce={reduce} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  nebula: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
});
