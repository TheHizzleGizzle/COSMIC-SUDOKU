import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide';
import { ScreenHeader, SectionTitle } from '@/src/components/ScreenHeader';
import { Glass, Button, IconButton } from '@/src/components/ui';
import { TIER_LABEL } from '@/src/game/content';
import { MONTHS, addDays, dailyTier, dateKey, formatDuration, formatLongDate, parseKey, todayKey } from '@/src/game/dates';
import { effectiveDailyStreak } from '@/src/game/profile';
import { actions, useStore } from '@/src/game/store';
import { usesNativeTabs } from '@/src/navigation';
import { alpha, colors, fonts, radius, spacing, tierColors, useTheme } from '@/src/theme';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DailyScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [today, setToday] = useState(todayKey());
  const [monthOffset, setMonthOffset] = useState(0);
  useFocusEffect(useCallback(() => setToday(todayKey()), []));
  const dailyGame = useStore((s) => s.dailyGame);
  const daily = useStore((s) => s.profile.daily);
  const tier = dailyTier(today);
  const tg = dailyGame && dailyGame.date === today ? dailyGame : null;
  const result = daily.results[today];
  const status = result || tg?.status === 'won' ? 'won' : tg ? 'progress' : 'new';
  const streak = effectiveDailyStreak(daily, today);
  const todayDow = (parseKey(today).getDay() + 6) % 7;

  const cal = useMemo(() => {
    const base = parseKey(today);
    const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) cells.push(dateKey(new Date(first.getFullYear(), first.getMonth(), d)));
    while (cells.length % 7) cells.push(null);
    return { title: `${MONTHS[first.getMonth()]} ${first.getFullYear()}`, cells };
  }, [today, monthOffset]);
  const monthWins = cal.cells.filter((k) => k && daily.results[k]).length;

  const start = () => { actions.startDaily(); router.navigate('/'); };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Daily Cosmic" subtitle="One sky for everyone, every day" testID="daily-title" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (usesNativeTabs ? insets.bottom : 0) + spacing.xl }]}>
        <Glass strong style={[styles.hero, { borderColor: alpha(tierColors[tier], 0.5) }]} testID="daily-hero">
          <Text testID="daily-date" style={styles.date}>{formatLongDate(today)}</Text>
          <View style={styles.heroRow}>
            <View style={[styles.tier, { borderColor: tierColors[tier], backgroundColor: alpha(tierColors[tier], 0.15) }]}>
              <Text testID="daily-difficulty" style={[styles.tierText, { color: tierColors[tier] }]}>{TIER_LABEL[tier]}</Text>
            </View>
            <View style={styles.streak}>
              <Lucide name="flame" size={18} color={streak ? colors.warning : colors.muted} />
              <Text testID="daily-streak" style={styles.streakText}>{streak}-day streak</Text>
              <Text style={styles.best}>· best {daily.best}</Text>
            </View>
          </View>
          {status === 'won' ? (
            <View style={styles.done} testID="daily-completed">
              <Lucide name="circle-check" size={22} color={colors.success} />
              <View style={styles.flex}>
                <Text style={styles.doneTitle}>Completed today</Text>
                <Text style={styles.doneSub}>
                  {result ? `${result.score.toLocaleString()} pts in ${formatDuration(result.seconds)}` : 'Nice work!'} · new puzzle at midnight
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.reward}>{"Win for your score's stardust plus a +100 daily bonus. One attempt — pause any time."}</Text>
              <Button testID="daily-start-button" label={status === 'progress' ? 'Continue' : 'Start'} icon="play" color={t.primary} onPress={start} />
              {tg ? <Text style={styles.progress}>{tg.entries} digits placed · {formatDuration(tg.activeMs / 1000)} so far</Text> : null}
            </>
          )}
        </Glass>

        <SectionTitle>{"This week's ramp"}</SectionTitle>
        <View style={styles.week}>
          {WEEK.map((d, i) => {
            const key = addDays(today, i - todayDow);
            const tr = dailyTier(key);
            const isToday = i === todayDow;
            return (
              <View key={d} style={[styles.weekDay, isToday && { borderColor: t.primary, backgroundColor: alpha(t.primary, 0.12) }]}>
                <Text style={[styles.weekLabel, isToday && { color: t.primary }]}>{d}</Text>
                {daily.results[key] ? <Lucide name="star" size={14} color={colors.gold} /> : <View style={[styles.dot, { backgroundColor: tierColors[tr] }]} />}
                <Text style={styles.weekTier}>{TIER_LABEL[tr].slice(0, 3)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.calHead}>
          <SectionTitle>{cal.title}</SectionTitle>
          <View style={styles.calNav}>
            <IconButton testID="daily-cal-prev" icon="chevron-left" label="Previous month" onPress={() => setMonthOffset((m) => m - 1)} />
            <IconButton testID="daily-cal-next" icon="chevron-right" label="Next month" onPress={() => setMonthOffset((m) => Math.min(0, m + 1))} color={monthOffset < 0 ? colors.onSurface : colors.muted} />
          </View>
        </View>
        <Glass style={styles.cal} testID="daily-calendar">
          <View style={styles.calRow}>{WEEK.map((d) => <Text key={d} style={styles.calDow}>{d[0]}</Text>)}</View>
          <View style={styles.calGrid}>
            {cal.cells.map((k, i) => {
              if (!k) return <View key={i} style={styles.calCell} />;
              const won = !!daily.results[k];
              const isToday = k === today;
              const future = k > today;
              return (
                <View key={k} testID={`daily-cal-${k}`} style={[styles.calCell, isToday && [styles.calToday, { borderColor: t.primary }]]}>
                  {won ? <Lucide name="star" size={18} color={colors.gold} /> : <Text style={[styles.calNum, future && { opacity: 0.3 }, !future && !isToday && { opacity: 0.55 }]}>{parseKey(k).getDate()}</Text>}
                </View>
              );
            })}
          </View>
          <Text style={styles.calFoot}>{monthWins} daily {monthWins === 1 ? 'win' : 'wins'} this month</Text>
        </Glass>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  hero: { padding: spacing.lg, gap: spacing.md },
  date: { fontFamily: fonts.black, fontSize: 22, color: colors.onSurface },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  tier: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 3 },
  tierText: { fontFamily: fonts.extrabold, fontSize: 13 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.onSurface },
  best: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  reward: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  progress: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, textAlign: 'center' },
  done: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doneTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.success },
  doneSub: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textSecondary },
  week: { flexDirection: 'row', gap: 6 },
  weekDay: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
  weekLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary },
  weekTier: { fontFamily: fonts.semibold, fontSize: 10, color: colors.muted },
  dot: { width: 10, height: 10, borderRadius: 5, marginVertical: 2 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calNav: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cal: { padding: spacing.md },
  calRow: { flexDirection: 'row' },
  calDow: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  calToday: { borderWidth: 2 },
  calNum: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface },
  calFoot: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
});
