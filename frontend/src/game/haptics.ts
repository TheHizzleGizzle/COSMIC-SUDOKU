import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'error' | 'tick' | 'win';

const safe = (p: Promise<unknown>) => p.catch(() => undefined);

/** A buzz on a mistake, a tick on a power-up, a celebratory pattern on a win. */
export function haptic(kind: HapticKind, enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  if (kind === 'error') safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  else if (kind === 'tick') safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  else {
    safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(() => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)), 220);
    setTimeout(() => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)), 400);
  }
}
