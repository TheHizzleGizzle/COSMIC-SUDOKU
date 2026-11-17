import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initNativeShell } from './native-shell.ts';

// The Capacitor plugins talk to a native bridge that does not exist under Node,
// so the module boundary is the one place a test double is unavoidable.
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn() } }));
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: { hide: vi.fn() } }));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: vi.fn() },
  Style: { Dark: 'DARK' },
}));

describe('initNativeShell', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing on the web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    await initNativeShell();
    expect(StatusBar.setStyle).not.toHaveBeenCalled();
    expect(SplashScreen.hide).not.toHaveBeenCalled();
  });

  it('on Android sets light status-bar icons for the dark UI and hides the splash', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    await initNativeShell();
    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
    expect(SplashScreen.hide).toHaveBeenCalledOnce();
  });

  it('still hides the splash when the status bar call fails, then reports the failure', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(StatusBar.setStyle).mockRejectedValue(new Error('no status bar'));
    await expect(initNativeShell()).rejects.toThrow('no status bar');
    expect(SplashScreen.hide).toHaveBeenCalledOnce();
  });
});
