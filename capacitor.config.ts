import type { CapacitorConfig } from '@capacitor/cli';

// Loaded by the Capacitor CLI through Node's native type stripping (TypeScript 7 has no
// compiler API for it), so only erasable syntax is allowed in this file.
const config: CapacitorConfig = {
  appId: 'io.github.thehizzlegizzle.cosmicsudoku',
  appName: 'Cosmic Sudoku',
  webDir: 'dist',
  // The app is fully offline and loads its own bundle: never set `server.url`.
  server: { androidScheme: 'https' },
  android: { minWebViewVersion: 117 },
  plugins: {
    // The shell hides the splash itself once the first render is done; the timeout is
    // only a ceiling so a failed start can never leave the splash up forever.
    SplashScreen: { launchAutoHide: true, launchShowDuration: 3000, backgroundColor: '#0a0a1a' },
  },
};

export default config;
