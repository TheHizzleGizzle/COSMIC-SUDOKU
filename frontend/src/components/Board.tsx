import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Lucide } from '@react-native-vector-icons/lucide';
import { BOX_OF, COL_OF, ROW_OF, findConflicts } from '@/src/engine/sudoku';
import { actions, activeGame, useStore } from '@/src/game/store';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { alpha, colors, fonts, type Theme, useTheme } from '@/src/theme';

interface CellProps {
  index: number;
  value: number;
  notes: number;
  given: boolean;
  revealed: boolean;
  wrong: boolean;
  conflict: boolean;
  selected: boolean;
  peer: boolean;
  same: boolean;
  hintMask: number;
  hintWrong: boolean;
  size: number;
  t: Theme;
  reduce: boolean;
}

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const Cell = memo(function Cell(p: CellProps) {
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (p.value && !p.reduce) scale.value = withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, { damping: 9, stiffness: 260 }));
  }, [p.value, p.reduce, scale]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { t, size: s } = p;
  const tint = p.selected ? t.selected : p.same ? t.same : p.peer ? t.peer : null;
  const color = p.wrong ? colors.error : p.given ? colors.onSurface : p.revealed ? colors.gold : t.playerDigit;
  const showMask = p.hintMask || (p.value ? 0 : p.notes);
  const state = p.given ? 'given' : p.wrong ? 'wrong' : p.conflict ? 'conflict' : p.revealed ? 'revealed' : '';
  return (
    <Pressable
      testID={`cell-${p.index}`}
      {...(Platform.OS === 'web' ? { onPress: () => actions.selectCell(p.index) } : { onPressIn: () => actions.selectCell(p.index) })}
      accessibilityLabel={`Row ${Math.floor(p.index / 9) + 1}, column ${(p.index % 9) + 1}, ${p.value || 'empty'} ${state}`}
      style={[styles.cell, { width: s, height: s, backgroundColor: t.cell }]}
    >
      {tint ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} /> : null}
      {p.wrong || p.conflict ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.error, 0.16) }]} /> : null}
      {p.selected ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, { borderColor: t.primary, boxShadow: `0 0 10px ${t.glow}` }]} /> : null}
      {p.hintMask || p.hintWrong ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, { borderColor: colors.gold }]} /> : null}
      {p.value ? (
        <Animated.Text testID={`cell-${p.index}-value`} style={[styles.digit, { fontSize: s * 0.56, lineHeight: s * 0.72, color, fontFamily: p.given ? fonts.black : fonts.extrabold }, anim]}>
          {p.value}
        </Animated.Text>
      ) : showMask ? (
        <View style={styles.notes} testID={`cell-${p.index}-notes`}>
          {NOTE_DIGITS.map((d) => (
            <Text key={d} style={[styles.note, { fontSize: s * 0.24, lineHeight: s * 0.3, color: p.hintMask ? colors.gold : colors.textSecondary, fontFamily: p.hintMask ? fonts.black : fonts.bold }]}>
              {showMask & (1 << (d - 1)) ? d : ' '}
            </Text>
          ))}
        </View>
      ) : null}
      {p.wrong ? (
        <View pointerEvents="none" style={styles.badge}><Lucide name="x" size={Math.max(9, s * 0.28)} color={colors.error} /></View>
      ) : p.conflict ? (
        <View pointerEvents="none" style={styles.badge}><Lucide name="triangle-alert" size={Math.max(9, s * 0.26)} color={colors.error} /></View>
      ) : null}
    </Pressable>
  );
});

export function Board({ size }: { size: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const values = useStore((s) => activeGame(s)?.values);
  const notes = useStore((s) => activeGame(s)?.notes);
  const selected = useStore((s) => activeGame(s)?.selected ?? null);
  const givens = useStore((s) => activeGame(s)?.givens ?? '');
  const solution = useStore((s) => activeGame(s)?.solution ?? '');
  const revealed = useStore((s) => activeGame(s)?.revealed);
  const hint = useStore((s) => activeGame(s)?.hint ?? null);
  const paused = useStore((s) => activeGame(s)?.paused ?? false);
  const shake = useStore((s) => s.fx.shake);
  const conflicts = useMemo(() => (values ? findConflicts(values) : []), [values]);

  const x = useSharedValue(0);
  const shakeRef = useRef(shake);
  useEffect(() => {
    if (shake === shakeRef.current) return;
    shakeRef.current = shake;
    if (!reduce) x.value = withSequence(withTiming(-7, { duration: 50 }), withTiming(7, { duration: 60 }), withTiming(-4, { duration: 60 }), withTiming(0, { duration: 60 }));
  }, [shake, reduce, x]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  if (!values || !notes || !revealed) return null;
  const cell = Math.floor((size - 18) / 9);
  const selVal = selected !== null ? values[selected] : 0;
  const boxes = [];
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    const cells = [];
    for (let k = 0; k < 9; k++) {
      const i = (br + Math.floor(k / 3)) * 9 + bc + (k % 3);
      const given = givens.charCodeAt(i) !== 48;
      const v = values[i];
      cells.push(
        <Cell
          key={i}
          index={i}
          value={v}
          notes={notes[i]}
          given={given}
          revealed={revealed.includes(i)}
          wrong={v !== 0 && !given && v !== solution.charCodeAt(i) - 48}
          conflict={conflicts[i]}
          selected={selected === i}
          peer={selected !== null && selected !== i && (ROW_OF[i] === ROW_OF[selected] || COL_OF[i] === COL_OF[selected] || BOX_OF[i] === BOX_OF[selected])}
          same={selVal !== 0 && selected !== i && v === selVal}
          hintMask={hint && hint.cell === i && !hint.wrong && !v ? hint.mask : 0}
          hintWrong={!!hint && hint.cell === i && hint.wrong}
          size={cell}
          t={t}
          reduce={reduce}
        />,
      );
    }
    boxes.push(<View key={b} style={[styles.box, { width: cell * 3 + 2, backgroundColor: t.thinLine }]}>{cells}</View>);
  }
  return (
    <Animated.View testID="sudoku-board" style={[styles.frame, { borderColor: alpha(t.primary, 0.4), backgroundColor: alpha(t.primary, 0.08), boxShadow: `0 0 22px ${alpha(t.primary, 0.22)}` }, shakeStyle]}>
      <View style={[styles.grid, { width: cell * 9 + 10, backgroundColor: t.thickLine }]}>{boxes}</View>
      {paused ? (
        <View pointerEvents="none" style={styles.pausedWrap}>
          <View testID="board-paused-overlay" style={[styles.pausedPill, { borderColor: t.primary }]}>
            <Lucide name="play" size={16} color={t.primary} />
            <Text style={styles.pausedText}>Paused — tap the board to resume</Text>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { padding: 3, borderRadius: 14, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, borderRadius: 10, overflow: 'hidden' },
  box: { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  cell: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { borderWidth: 2, borderRadius: 3 },
  digit: { textAlign: 'center', fontVariant: ['tabular-nums'], ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : null) },
  notes: { width: '100%', height: '100%', flexDirection: 'row', flexWrap: 'wrap', padding: 1 },
  note: { width: '33.33%', textAlign: 'center' },
  badge: { position: 'absolute', top: 1, right: 1 },
  pausedWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pausedPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, backgroundColor: 'rgba(10,10,26,0.88)' },
  pausedText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface },
});
