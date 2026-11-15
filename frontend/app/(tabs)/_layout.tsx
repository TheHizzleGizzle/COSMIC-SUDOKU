import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { NativeTabs } from 'expo-router/native-tabs';
import { Lucide } from '@react-native-vector-icons/lucide';
import { SpaceBackground } from '@/src/components/SpaceBackground';
import type { IconName } from '@/src/game/content';
import { usesNativeTabs } from '@/src/navigation';
import { alpha, colors, fonts, useTheme } from '@/src/theme';

const TABS: { name: string; title: string; icon: IconName; sf: 'gamecontroller.fill' | 'calendar' | 'chart.bar.fill' | 'bag.fill' }[] = [
  { name: 'index', title: 'Play', icon: 'gamepad-2', sf: 'gamecontroller.fill' },
  { name: 'daily', title: 'Daily', icon: 'calendar-days', sf: 'calendar' },
  { name: 'stats', title: 'Stats', icon: 'chart-column', sf: 'chart.bar.fill' },
  { name: 'shop', title: 'Shop', icon: 'store', sf: 'bag.fill' },
];

export default function TabsLayout() {
  const t = useTheme();
  if (usesNativeTabs) {
    return (
      <View style={styles.root}>
        <SpaceBackground />
        <NativeTabs tintColor={t.primary}>
          {TABS.map((tab) => (
            <NativeTabs.Trigger key={tab.name} name={tab.name}>
              <NativeTabs.Trigger.Icon sf={tab.sf} />
              <NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          ))}
        </NativeTabs>
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <SpaceBackground />
      <Tabs
        backBehavior="firstRoute"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarActiveTintColor: t.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border, borderTopWidth: 1, ...(Platform.OS === 'web' ? { height: 64 } : {}) },
          tabBarItemStyle: { alignSelf: 'center' },
          tabBarLabelStyle: { fontFamily: fonts.extrabold, fontSize: 11 },
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarButtonTestID: `tab-${tab.title.toLowerCase()}`,
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.icon, focused && { backgroundColor: alpha(t.primary, 0.16) }]}>
                  <Lucide name={tab.icon} size={20} color={color} />
                </View>
              ),
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  icon: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
