import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { initNativeShell } from './platform/native-shell.ts';
import { isOutdatedAndroidWebView, MIN_WEBVIEW_MAJOR } from './platform/webview-guard.ts';
import { App } from './ui/App.tsx';
import { WebViewUpdateScreen } from './ui/WebViewUpdateScreen.tsx';
import './ui/styles/tokens.css';
import './ui/styles/base.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

const outdated = isOutdatedAndroidWebView(navigator.userAgent, MIN_WEBVIEW_MAJOR);

// flushSync makes the first render synchronous, so the marker below really
// means "the shell is on screen" (the Android smoke test waits for it).
flushSync(() => {
  createRoot(container).render(
    <StrictMode>{outdated ? <WebViewUpdateScreen /> : <App />}</StrictMode>,
  );
});

// Hide the splash and style the system bars in both cases, so even the update
// screen is visible. Only a playable shell announces itself as ready.
const nativeShell = initNativeShell().catch((error: unknown) => {
  console.error('Native shell setup failed', error);
});
if (!outdated) void nativeShell.then(() => console.log('cosmic:ready'));
