import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Native-only setup. A no-op on the web. On Android it asks for light status-bar icons
 * (the UI is dark) and hides the splash screen. The splash is hidden even when the
 * status-bar call fails, so a missing plugin can never leave the player on the splash.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Capacitor names styles after the background: `Dark` means light icons for a dark UI.
    await StatusBar.setStyle({ style: Style.Dark });
  } finally {
    await SplashScreen.hide();
  }
}
