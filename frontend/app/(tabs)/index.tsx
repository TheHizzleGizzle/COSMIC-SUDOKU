import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Board } from '@/src/components/Board';
import { Celebration } from '@/src/components/Celebration';
import { ConfirmSheet } from '@/src/components/ConfirmSheet';
import { ControlRow, CosmosBubble, Hud, NumberPad, PowerUpRow, WinPanel } from '@/src/components/PlayParts';
import { SettingsSheet } from '@/src/components/SettingsSheet';
import { actions, activeGame, useStore } from '@/src/game/store';
import { useAppActive } from '@/src/hooks/useReduceMotion';
import { usesNativeTabs } from '@/src/navigation';
import { spacing } from '@/src/theme';

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [areaH, setAreaH] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [focused, setFocused] = useState(true);
  const appActive = useAppActive();
  const status = useStore((s) => activeGame(s)?.status ?? 'playing');
  const hasGame = useStore((s) => !!activeGame(s));
  const entries = useStore((s) => s.levelGame?.entries ?? 0);
  const streak = useStore((s) => s.profile.winStreak);
  const celebrationOpen = useStore((s) => s.celebrationOpen);

  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));

  const running = focused && appActive && !settingsOpen && !confirmNew && !celebrationOpen && status === 'playing';
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => { const now = Date.now(); actions.tick(now - last); last = now; }, 250);
    const idle = setInterval(actions.cosmosIdle, 8000);
    return () => { clearInterval(id); clearInterval(idle); };
  }, [running]);

  const onNewPuzzle = () => (actions.needsAbandonConfirm() ? setConfirmNew(true) : actions.newPuzzle());

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const compact = areaH > 0 && areaH < 600;
  const gap = compact ? 6 : 10;
  const rowH = compact ? 44 : 52;
  const bubbleH = compact ? 38 : 46;
  const controlsH = compact ? 40 : 44;
  const powerH = compact ? 52 : 60;
  const below = bubbleH + controlsH + rowH * 2 + spacing.sm + powerH + gap * 4;
  const boardSize = Math.max(234, Math.min(width - 24, areaH - below, 520));

  return (
    <View testID="play-screen" style={[styles.root, { paddingTop: insets.top + 2, paddingBottom: bottomChrome + spacing.sm }]}>
      <Hud onSettings={() => setSettingsOpen(true)} onNewPuzzle={onNewPuzzle} />
      <View style={[styles.area, { gap }]} onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}>
        {areaH > 0 && hasGame ? (
          <>
            <View style={styles.center}><Board size={boardSize} /></View>
            <CosmosBubble height={bubbleH} />
            {status === 'won' && !celebrationOpen ? (
              <WinPanel height={controlsH + rowH * 2 + spacing.sm + gap} />
            ) : (
              <>
                <ControlRow height={controlsH} />
                <NumberPad rowHeight={rowH} />
              </>
            )}
            <PowerUpRow height={powerH} />
          </>
        ) : null}
      </View>
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ConfirmSheet
        visible={confirmNew}
        testID="abandon-sheet"
        title="Start a new puzzle?"
        message={`You've placed ${entries} digits. Starting over counts as an abandoned game${streak ? ` and resets your ${streak}-win streak` : ''}.`}
        confirmLabel="New puzzle"
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => { setConfirmNew(false); actions.newPuzzle(); }}
      />
      <Celebration />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.md },
  area: { flex: 1, justifyContent: 'space-between', paddingTop: 4 },
  center: { alignItems: 'center' },
});
