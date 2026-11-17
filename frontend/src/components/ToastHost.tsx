import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useStore } from '@/src/game/store';
import { colors, fonts, radius, spacing } from '@/src/theme';

const TONE = {
  info: { icon: 'info', color: colors.brandPrimary },
  success: { icon: 'circle-check', color: colors.success },
  error: { icon: 'triangle-alert', color: colors.error },
  gold: { icon: 'sparkles', color: colors.gold },
} as const;

export function ToastHost() {
  const toast = useStore((s) => s.toast);
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const tone = TONE[toast.tone];
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + spacing.sm }]}>
      <Animated.View key={toast.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)} style={[styles.toast, { borderColor: tone.color }]}>
        <Lucide name={tone.icon} size={18} color={tone.color} />
        <Text testID="toast-message" style={styles.text}>{toast.text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.sheet, borderWidth: 1, maxWidth: 520, boxShadow: '0 8px 24px rgba(0,0,0,0.45)' },
  text: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface, flexShrink: 1 },
});
