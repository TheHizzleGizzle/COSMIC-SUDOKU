import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { actions, useStore } from '@/src/game/store';
import type { Settings } from '@/src/game/types';
import { alpha, colors, fonts, radius, spacing, useTheme } from '@/src/theme';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { Button } from './ui';

const MOTION: { id: Settings['reduceMotion']; label: string }[] = [
  { id: 'system', label: 'Phone' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const settings = useStore((s) => s.settings);
  const [confirm, setConfirm] = useState(false);
  const close = () => { setConfirm(false); onClose(); };
  return (
    <Sheet visible={visible} onClose={close} testID="settings-sheet">
      <Text style={styles.title}>{confirm ? 'Reset everything?' : 'Settings'}</Text>
      {confirm ? (
        <>
          <Text style={styles.msg}>{"This erases your level, stardust, power-ups, themes, achievements, stats and the puzzle in progress. It can't be undone."}</Text>
          <View style={styles.rowGap}>
            <View style={styles.flex}><Button testID="settings-reset-cancel" label="Cancel" variant="ghost" onPress={() => setConfirm(false)} /></View>
            <View style={styles.flex}><Button testID="settings-reset-confirm" label="Reset everything" variant="danger" onPress={() => { actions.resetProgress(); close(); }} /></View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.item}>
            <View style={styles.flex}>
              <Text style={styles.label}>Vibration feedback</Text>
              <Text style={styles.hint}>Buzz on mistakes, tick on power-ups, a pattern on wins</Text>
            </View>
            <Switch testID="settings-haptics-switch" value={settings.haptics} onValueChange={(v) => actions.setSettings({ haptics: v })} trackColor={{ true: t.primary, false: colors.glassStrong }} thumbColor={colors.onSurface} />
          </View>
          <View style={styles.itemCol}>
            <Text style={styles.label}>Reduce motion</Text>
            <View style={styles.seg}>
              {MOTION.map((m) => {
                const on = settings.reduceMotion === m.id;
                return (
                  <PressableScale key={m.id} testID={`settings-motion-${m.id}`} onPress={() => actions.setSettings({ reduceMotion: m.id })} accessibilityState={{ selected: on }} style={[styles.segBtn, on && { backgroundColor: alpha(t.primary, 0.2), borderColor: t.primary }]}>
                    <Text style={[styles.segText, on && { color: t.primary }]}>{m.label}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>
          <View style={styles.reset}>
            <Button testID="settings-reset-button" label="Reset all progress" icon="trash-2" variant="ghost" onPress={() => setConfirm(true)} />
          </View>
          <Text style={styles.foot}>Cosmic Sudoku works fully offline. Progress is saved on this phone.</Text>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.onSurface, marginBottom: spacing.md },
  msg: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xl },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  itemCol: { gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface },
  hint: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  seg: { flexDirection: 'row', gap: spacing.sm },
  segBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
  segText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textSecondary },
  reset: { marginTop: spacing.lg },
  foot: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.md },
  rowGap: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
