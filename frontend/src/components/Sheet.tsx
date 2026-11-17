import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { colors, radius, spacing } from '@/src/theme';

/** Bottom sheet on a Modal: Android back closes it (onRequestClose). */
export function Sheet({ visible, onClose, children, testID, scrim = colors.scrim, overlay }: { visible: boolean; onClose: () => void; children: React.ReactNode; testID: string; scrim?: string; overlay?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable testID={`${testID}-backdrop`} accessibilityLabel="Close" style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]} onPress={onClose} />
        {overlay}
        <Animated.View entering={reduce ? undefined : SlideInDown.springify().damping(20)} testID={testID} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grabber} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.sheet, borderTopLeftRadius: radius.lg + 4, borderTopRightRadius: radius.lg + 4, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: spacing.md },
});
