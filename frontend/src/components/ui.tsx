import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Lucide } from '@react-native-vector-icons/lucide';
import type { IconName } from '@/src/game/content';
import { colors, fonts, radius, spacing } from '@/src/theme';
import { PressableScale } from './PressableScale';

/** Frosted-glass tile: translucent fill + soft border + inner top highlight (no live blur). */
export function Glass({ style, children, testID, strong }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; testID?: string; strong?: boolean }) {
  return (
    <View testID={testID} style={[styles.glass, strong && styles.strong, style]}>
      <View pointerEvents="none" style={styles.highlight} />
      {children}
    </View>
  );
}

export function IconButton({ icon, onPress, testID, color = colors.onSurface, size = 20, label }: { icon: IconName; onPress: () => void; testID: string; color?: string; size?: number; label: string }) {
  return (
    <PressableScale testID={testID} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.iconBtn} hitSlop={4}>
      <Lucide name={icon} size={size} color={color} />
    </PressableScale>
  );
}

export function StardustPill({ value, testID }: { value: number; testID: string }) {
  return (
    <View style={styles.pill} accessibilityLabel={`${value} stardust`}>
      <Lucide name="sparkle" size={14} color={colors.gold} />
      <Text testID={testID} style={styles.pillText}>{value.toLocaleString()}</Text>
    </View>
  );
}

export function Button({ label, icon, onPress, testID, variant = 'primary', color, disabled }: { label: string; icon?: IconName; onPress: () => void; testID: string; variant?: 'primary' | 'ghost' | 'danger'; color?: string; disabled?: boolean }) {
  const c = color ?? colors.brandPrimary;
  const bg = variant === 'primary' ? c : variant === 'danger' ? colors.error : colors.glassStrong;
  const fg = variant === 'primary' ? colors.onBrand : colors.onSurface;
  return (
    <PressableScale testID={testID} onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, variant === 'ghost' && styles.ghost]}>
      {icon ? <Lucide name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  glass: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  strong: { backgroundColor: colors.glassStrong, borderColor: colors.borderStrong },
  highlight: { position: 'absolute', top: 0, left: 14, right: 14, height: 1, backgroundColor: colors.glassHighlight },
  iconBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 10, height: 32, borderRadius: radius.pill, backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' },
  pillText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.gold, fontVariant: ['tabular-nums'] },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 50, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  ghost: { borderWidth: 1, borderColor: colors.borderStrong },
  btnText: { fontFamily: fonts.extrabold, fontSize: 16 },
});
