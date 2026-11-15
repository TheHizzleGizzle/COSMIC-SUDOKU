import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useStore } from '@/src/game/store';

export function useReduceMotion(): boolean {
  const system = useReducedMotion();
  const pref = useStore((s) => s.settings.reduceMotion);
  return pref === 'on' ? true : pref === 'off' ? false : system;
}

export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active' || AppState.currentState == null);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}
