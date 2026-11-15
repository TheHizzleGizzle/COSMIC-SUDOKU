import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lucide } from '@react-native-vector-icons/lucide';
import { ConfirmSheet } from '@/src/components/ConfirmSheet';
import { PressableScale } from '@/src/components/PressableScale';
import { ScreenHeader, SectionTitle } from '@/src/components/ScreenHeader';
import { Glass } from '@/src/components/ui';
import { POWER_UPS, THEMES } from '@/src/game/content';
import { actions, useStore } from '@/src/game/store';
import type { ThemeId } from '@/src/game/types';
import { usesNativeTabs } from '@/src/navigation';
import { alpha, colors, cosmicPalettes, fonts, radius, spacing, useTheme } from '@/src/theme';

function ThemePreview({ id }: { id: ThemeId }) {
  const p = cosmicPalettes[id];
  const digits = [5, 0, 3, 0, 7, 0, 1, 0, 9];
  return (
    <LinearGradient colors={p.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
      <View style={[styles.mini, { backgroundColor: alpha(p.primary, 0.45), boxShadow: `0 0 10px ${alpha(p.primary, 0.4)}` }]}>
        {digits.map((d, i) => (
          <View key={i} style={[styles.miniCell, { backgroundColor: i === 4 ? alpha(p.primary, 0.35) : p.cell }]}>
            {d ? <Text style={[styles.miniDigit, { color: i % 3 === 0 ? colors.onSurface : p.playerDigit }]}>{d}</Text> : null}
          </View>
        ))}
      </View>
      <View style={styles.swatches}>
        {[p.primary, p.secondary, p.accent].map((c) => <View key={c} style={[styles.swatch, { backgroundColor: c }]} />)}
      </View>
    </LinearGradient>
  );
}

export default function ShopScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const [pending, setPending] = useState<ThemeId | null>(null);
  const pendingDef = THEMES.find((x) => x.id === pending);
  return (
    <View style={styles.root}>
      <ScreenHeader title="Shop" subtitle="Spend stardust earned by playing" testID="shop-title" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (usesNativeTabs ? insets.bottom : 0) + spacing.xl }]}>
        <Glass strong style={[styles.balance, { borderColor: alpha(colors.gold, 0.45) }]}>
          <Lucide name="sparkles" size={30} color={colors.gold} />
          <View>
            <Text testID="shop-balance" style={styles.balanceValue}>{profile.stardust.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>stardust · score ÷ 10 per win, +100 for a Daily</Text>
          </View>
        </Glass>

        <SectionTitle>Power-ups</SectionTitle>
        <View style={styles.list}>
          {POWER_UPS.map((pu) => {
            const afford = profile.stardust >= pu.cost;
            return (
              <Glass key={pu.id} style={styles.item} testID={`shop-powerup-${pu.id}`}>
                <View style={[styles.icon, { backgroundColor: alpha(t.primary, 0.14) }]}><Lucide name={pu.icon} size={22} color={t.primary} /></View>
                <View style={styles.flex}>
                  <Text style={styles.name}>{pu.name}</Text>
                  <Text style={styles.desc}>{pu.description}</Text>
                  <Text testID={`shop-powerup-${pu.id}-owned`} style={styles.owned}>Owned: {profile.inventory[pu.id]}</Text>
                </View>
                <PressableScale testID={`shop-buy-${pu.id}`} onPress={() => actions.buyPowerUp(pu.id)} accessibilityLabel={`Buy ${pu.name} for ${pu.cost} stardust`} style={[styles.buy, !afford && { opacity: 0.45 }]}>
                  <Lucide name="sparkle" size={13} color={colors.onWarning} />
                  <Text style={styles.buyText}>{pu.cost}</Text>
                </PressableScale>
              </Glass>
            );
          })}
        </View>

        <SectionTitle>Cosmic themes</SectionTitle>
        <View style={styles.list}>
          {THEMES.map((th) => {
            const owned = profile.themes.includes(th.id);
            const active = profile.activeTheme === th.id;
            const p = cosmicPalettes[th.id];
            return (
              <Glass key={th.id} style={[styles.theme, active && { borderColor: p.primary }]} testID={`shop-theme-${th.id}`}>
                <ThemePreview id={th.id} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{th.name}</Text>
                  <Text style={styles.desc}>{th.tagline}</Text>
                  <View style={styles.themeAction}>
                    {active ? (
                      <View testID={`shop-theme-${th.id}-equipped`} style={[styles.equipped, { borderColor: p.primary, backgroundColor: alpha(p.primary, 0.14) }]}>
                        <Lucide name="check" size={14} color={p.primary} />
                        <Text style={[styles.equippedText, { color: p.primary }]}>Equipped</Text>
                      </View>
                    ) : owned ? (
                      <PressableScale testID={`shop-theme-${th.id}-apply`} onPress={() => actions.applyTheme(th.id)} style={[styles.apply, { borderColor: p.primary }]}>
                        <Text style={[styles.equippedText, { color: p.primary }]}>Apply</Text>
                      </PressableScale>
                    ) : (
                      <PressableScale testID={`shop-theme-${th.id}-unlock`} onPress={() => (profile.stardust >= th.cost ? setPending(th.id) : actions.buyTheme(th.id))} style={[styles.buy, profile.stardust < th.cost && { opacity: 0.45 }]}>
                        <Lucide name="lock" size={13} color={colors.onWarning} />
                        <Text style={styles.buyText}>Unlock · {th.cost}</Text>
                      </PressableScale>
                    )}
                  </View>
                </View>
              </Glass>
            );
          })}
        </View>
      </ScrollView>
      <ConfirmSheet
        visible={!!pending}
        testID="theme-confirm-sheet"
        title={`Unlock ${pendingDef?.name ?? ''}?`}
        message={`This spends ${pendingDef?.cost ?? 0} of your ${profile.stardust} stardust. The theme is applied straight away.`}
        confirmLabel="Unlock"
        onCancel={() => setPending(null)}
        onConfirm={() => { if (pending) actions.buyTheme(pending); setPending(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg },
  balance: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  balanceValue: { fontFamily: fonts.black, fontSize: 32, color: colors.gold, fontVariant: ['tabular-nums'] },
  balanceLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  list: { gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.onSurface },
  desc: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, lineHeight: 16 },
  owned: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  buy: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.gold },
  buyText: { fontFamily: fonts.black, fontSize: 14, color: colors.onWarning },
  theme: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  themeAction: { flexDirection: 'row', marginTop: spacing.sm },
  preview: { width: 96, height: 96, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mini: { width: 60, flexDirection: 'row', flexWrap: 'wrap', gap: 1, padding: 1, borderRadius: 4 },
  miniCell: { width: 19, height: 19, alignItems: 'center', justifyContent: 'center' },
  miniDigit: { fontFamily: fonts.black, fontSize: 11 },
  swatches: { flexDirection: 'row', gap: 4 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  equipped: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
  apply: { height: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  equippedText: { fontFamily: fonts.black, fontSize: 14 },
});
