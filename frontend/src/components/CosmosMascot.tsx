import React, { useEffect, useId } from 'react';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import type { Mood } from '@/src/game/store';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { colors, useTheme } from '@/src/theme';

function Face({ mood }: { mood: Mood }) {
  const eye = colors.onSurfaceInverse;
  switch (mood) {
    case 'cheer':
      return (
        <>
          <Path d="M22 28 q3 -4 6 0" stroke={eye} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M36 28 q3 -4 6 0" stroke={eye} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M24 35 q8 9 16 0 z" fill={eye} />
        </>
      );
    case 'oops':
      return (
        <>
          <Circle cx={25} cy={28} r={2.4} fill={eye} />
          <Circle cx={39} cy={28} r={2.4} fill={eye} />
          <Path d="M25 38 q3.5 -3 7 0 q3.5 3 7 0" stroke={eye} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M47 18 q3 5 0 7 q-3 -2 0 -7" fill="#9be7ff" />
        </>
      );
    case 'think':
      return (
        <>
          <Circle cx={25} cy={28} r={2.6} fill={eye} />
          <Path d="M36 28 h6" stroke={eye} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M28 38 h8" stroke={eye} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
    case 'wow':
      return (
        <>
          <Circle cx={25} cy={27} r={3.4} fill={eye} />
          <Circle cx={39} cy={27} r={3.4} fill={eye} />
          <Circle cx={26} cy={26} r={1.1} fill="#fff" />
          <Circle cx={40} cy={26} r={1.1} fill="#fff" />
          <Ellipse cx={32} cy={38} rx={3} ry={3.6} fill={eye} />
        </>
      );
    default:
      return (
        <>
          <Ellipse cx={25} cy={28} rx={2.6} ry={3.2} fill={eye} />
          <Ellipse cx={39} cy={28} rx={2.6} ry={3.2} fill={eye} />
          <Path d="M25 36 q7 6 14 0" stroke={eye} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      );
  }
}

/** Cosmos: a small glowing star-sprite with an orbit ring. */
export function CosmosMascot({ size = 44, mood }: { size?: number; mood: Mood }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const gid = `cosmos${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const y = useSharedValue(0);
  const s = useSharedValue(1);
  useEffect(() => {
    if (reduce) { y.value = 0; return; }
    y.value = withRepeat(withTiming(-4, { duration: 1600 }), -1, true);
    return () => cancelAnimation(y);
  }, [reduce, y]);
  useEffect(() => {
    if (!reduce) s.value = withSequence(withTiming(1.15, { duration: 120 }), withSpring(1, { damping: 8 }));
  }, [mood, reduce, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: s.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, anim]} accessibilityLabel="Cosmos the mascot">
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={gid} cx="38%" cy="32%" r="72%">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="0.38" stopColor={t.primary} />
            <Stop offset="1" stopColor={t.secondary} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={32} cy={36} rx={29} ry={8} stroke={t.accent} strokeWidth={2} fill="none" opacity={0.55} />
        <Circle cx={32} cy={31} r={20} fill={`url(#${gid})`} />
        <Circle cx={20} cy={34} r={3} fill={t.accent} opacity={0.55} />
        <Circle cx={44} cy={34} r={3} fill={t.accent} opacity={0.55} />
        <Face mood={mood} />
        <Path d="M10 40 Q32 52 54 40" stroke={t.accent} strokeWidth={2} fill="none" opacity={0.9} strokeLinecap="round" />
        <Path d="M32 3 l2 5 5 0.5 -4 3.5 1.3 5 -4.3 -2.7 -4.3 2.7 1.3 -5 -4 -3.5 5 -0.5 z" fill={colors.gold} />
      </Svg>
    </Animated.View>
  );
}
