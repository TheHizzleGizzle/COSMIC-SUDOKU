import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children?: React.ReactNode };

export function PressableScale({ style, scaleTo = 0.93, onPressIn, onPressOut, children, ...rest }: Props) {
  const reduce = useReduceMotion();
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        if (!reduce) s.set(withTiming(scaleTo, { duration: 80 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}
