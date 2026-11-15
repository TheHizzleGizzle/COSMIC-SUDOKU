import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/src/theme';
import { Sheet } from './Sheet';
import { Button } from './ui';

export function ConfirmSheet({ visible, title, message, confirmLabel, onConfirm, onCancel, testID, danger }: { visible: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; testID: string; danger?: boolean }) {
  return (
    <Sheet visible={visible} onClose={onCancel} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.msg}>{message}</Text>
      <View style={styles.row}>
        <View style={styles.flex}><Button testID={`${testID}-cancel`} label="Cancel" variant="ghost" onPress={onCancel} /></View>
        <View style={styles.flex}><Button testID={`${testID}-confirm`} label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} /></View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.onSurface, marginBottom: spacing.sm },
  msg: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
