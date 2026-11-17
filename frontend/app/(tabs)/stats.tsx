import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide';
import { ScreenHeader, SectionTitle } from '@/src/components/ScreenHeader';
import { Glass } from '@/src/components/ui';
import { ACHIEVEMENTS, TIERS, TIER_LABEL } from '@/src/game/content';
import { addDays, formatDuration, parseKey, relativeDay, todayKey } from '@/src/game/dates';
import { effectiveDailyStreak } from '@/src/game/profile';
import { useStore } from '@/src/game/store';
import { usesNativeTabs } from '@/src/navigation';
import { alpha, colors, fonts, radius, spacing, tierColors, useTheme } from '@/src/theme';

function Heatmap({ activity }: { activity: Record<string, number> }) {
  const today = todayKey();
  const dow = (parseKey(today).getDay() + 6) % 7;
  const start = addDays(today, -dow - 7 * 7);
  const weeks = Array.from({ length: 8 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  const shade = (n: number) => (n <= 0 ? colors.glass : alpha(colors.gold, n === 1 ? 0.35 : n === 2 ? 0.6 : 0.92));
  return (
    <Glass style={styles.heat} testID="stats-heatmap">
      <View style={styles.heatGrid}>
        <View style={styles.heatCol}>
          {['M', '', 'W', '', 'F', '', 'S'].map((l, i) => <Text key={i} style={styles.heatLabel}>{l}</Text>)}
        </View>
        {weeks.map((wk, w) => (
          <View key={w} style={styles.heatCol}>
            {wk.map((k) => <View key={k} style={[styles.heatCell, { backgroundColor: k > today ? 'transparent' : shade(activity[k] ?? 0) }]} />)}
          </View>
        ))}
      </View>
      <Text style={styles.heatFoot}>Last 8 weeks · each square is a day you played</Text>
    </Glass>
  );
}

export default function StatsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const p = useStore((s) => s.profile);
  const winRate = p.played ? Math.round((p.wins / p.played) * 100) : 0;
  const cards = [
    { id: 'played', label: 'Games played', value: p.played, icon: 'gamepad-2' as const },
    { id: 'wins', label: 'Wins', value: p.wins, icon: 'trophy' as const },
    { id: 'win-rate', label: 'Win rate', value: `${winRate}%`, icon: 'target' as const },
    { id: 'win-streak', label: `Win streak · best ${p.bestWinStreak}`, value: p.winStreak, icon: 'flame' as const },
    { id: 'daily-streak', label: `Daily streak · best ${p.daily.best}`, value: effectiveDailyStreak(p.daily, todayKey()), icon: 'calendar-check' as const },
    { id: 'perfect', label: 'Perfect games', value: p.perfectGames, icon: 'sparkles' as const },
  ];
  return (
    <View style={styles.root}>
      <ScreenHeader title="Stats" subtitle={`Level ${p.level} explorer`} testID="stats-title" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (usesNativeTabs ? insets.bottom : 0) + spacing.xl }]}>
        {p.played === 0 ? (
          <Glass style={styles.empty} testID="stats-empty">
            <Lucide name="telescope" size={28} color={t.primary} />
            <Text style={styles.emptyText}>Play a game to start logging cosmic data.</Text>
          </Glass>
        ) : null}
        <View style={styles.cards}>
          {cards.map((c) => (
            <Glass key={c.id} style={styles.card}>
              <Lucide name={c.icon} size={18} color={t.primary} />
              <Text testID={`stats-${c.id}`} style={styles.cardValue}>{c.value}</Text>
              <Text style={styles.cardLabel} numberOfLines={1}>{c.label}</Text>
            </Glass>
          ))}
        </View>

        <SectionTitle>Best & average time</SectionTitle>
        <Glass style={styles.table}>
          {TIERS.map((tr, i) => {
            const s = p.tiers[tr];
            return (
              <View key={tr} style={[styles.tr, i > 0 && styles.trBorder]} testID={`stats-tier-${tr}`}>
                <View style={[styles.dot, { backgroundColor: tierColors[tr] }]} />
                <Text style={styles.tierName}>{TIER_LABEL[tr]}</Text>
                <Text style={styles.cell}>{s.bestSeconds === null ? '—' : formatDuration(s.bestSeconds)}</Text>
                <Text style={styles.cell}>{s.wins ? formatDuration(s.totalSeconds / s.wins) : '—'}</Text>
                <Text style={styles.cellSmall}>{s.wins} won</Text>
              </View>
            );
          })}
          <Text style={styles.tableFoot}>best · average · wins</Text>
        </Glass>

        <SectionTitle>Activity</SectionTitle>
        <Heatmap activity={p.activity} />

        <SectionTitle>Recent games</SectionTitle>
        <Glass style={styles.table} testID="stats-recent">
          {p.history.length === 0 ? <Text style={styles.none}>No games yet.</Text> : null}
          {p.history.slice(0, 10).map((h, i) => (
            <View key={`${h.at}-${i}`} style={[styles.tr, i > 0 && styles.trBorder]}>
              <Lucide name={h.outcome === 'won' ? 'circle-check' : 'circle-x'} size={18} color={h.outcome === 'won' ? colors.success : colors.error} />
              <View style={styles.flex}>
                <Text style={styles.recentTitle}>{h.kind === 'daily' ? 'Daily Cosmic' : `Level ${h.level}`} · {TIER_LABEL[h.tier]}</Text>
                <Text style={styles.recentSub}>{relativeDay(h.at)} · {formatDuration(h.seconds)} · {h.mistakes} mistakes{h.outcome === 'abandoned' ? ' · abandoned' : ''}</Text>
              </View>
              {h.outcome === 'won' ? <Text style={styles.recentDust}>+{h.stardust}</Text> : null}
            </View>
          ))}
        </Glass>

        <SectionTitle>{`Achievements · ${Object.keys(p.achievements).length}/${ACHIEVEMENTS.length}`}</SectionTitle>
        <View style={styles.achGrid}>
          {ACHIEVEMENTS.map((a) => {
            const at = p.achievements[a.id];
            return (
              <Glass key={a.id} style={[styles.ach, !at && { opacity: 0.45 }, at ? { borderColor: alpha(colors.gold, 0.5) } : null]} testID={`achievement-${a.id}`}>
                <View style={[styles.achIcon, { backgroundColor: at ? alpha(colors.gold, 0.16) : colors.glass }]}>
                  <Lucide name={at ? a.icon : 'lock'} size={20} color={at ? colors.gold : colors.muted} />
                </View>
                <Text style={styles.achName} numberOfLines={1}>{a.name}</Text>
                <Text style={styles.achDesc} numberOfLines={2}>{a.description}</Text>
              </Glass>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, marginBottom: spacing.md },
  emptyText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '31.6%', padding: spacing.md, gap: 2 },
  cardValue: { fontFamily: fonts.black, fontSize: 22, color: colors.onSurface, fontVariant: ['tabular-nums'] },
  cardLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted },
  table: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tr: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2 },
  trBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tierName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 14, color: colors.onSurface },
  cell: { width: 56, textAlign: 'right', fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface, fontVariant: ['tabular-nums'] },
  cellSmall: { width: 52, textAlign: 'right', fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  tableFoot: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted, textAlign: 'right', paddingBottom: 4 },
  heat: { padding: spacing.md, alignItems: 'center' },
  heatGrid: { flexDirection: 'row', gap: 5 },
  heatCol: { gap: 5 },
  heatLabel: { height: 22, width: 14, fontFamily: fonts.bold, fontSize: 10, color: colors.muted, lineHeight: 22 },
  heatCell: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  heatFoot: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted, marginTop: spacing.sm },
  none: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, paddingVertical: spacing.md, textAlign: 'center' },
  recentTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface },
  recentSub: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  recentDust: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.gold, fontVariant: ['tabular-nums'] },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ach: { width: '31.6%', padding: spacing.sm + 2, alignItems: 'center', gap: 4 },
  achIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  achName: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.onSurface, textAlign: 'center' },
  achDesc: { fontFamily: fonts.semibold, fontSize: 10, color: colors.muted, textAlign: 'center' },
});
