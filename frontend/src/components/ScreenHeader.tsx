import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '@/src/theme';
import { StardustPill } from './ui';
import { useStore } from '@/src/game/store';

/** Sticky header for the Daily / Stats / Shop tabs. */
export function ScreenHeader({ title, subtitle, testID }: { title: string; subtitle: string; testID: string }) {
  const insets = useSafeAreaInsets();
  const stardust = useStore((s) => s.profile.stardust);
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.flex}>
        <Text testID={testID} style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <StardustPill value={stardust} testID={`${testID}-stardust`} />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function useNoop() { useEffect(() => undefined, []); }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  flex: { flex: 1 },
  title: { fontFamily: fonts.black, fontSize: fontSize.xxxl - 4, color: colors.onSurface },
  sub: { fontFamily: fonts.semibold, fontSize: fontSize.sm + 1, color: colors.muted },
  section: { fontFamily: fonts.black, fontSize: fontSize.lg, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 0.3 },
});
