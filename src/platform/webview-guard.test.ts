import { describe, expect, it } from 'vitest';
import { isOutdatedAndroidWebView, parseChromeMajor } from './webview-guard.ts';

const androidWebView = (chrome: string) =>
  `Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${chrome} Mobile Safari/537.36`;

const desktopChrome100 =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36';
const desktopFirefox = 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0';
const androidFirefox = 'Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0';

describe('parseChromeMajor', () => {
  it('reads the major version from an Android WebView user agent', () => {
    expect(parseChromeMajor(androidWebView('124.0.6367.82'))).toBe(124);
  });

  it('reads desktop Chrome', () => {
    expect(parseChromeMajor(desktopChrome100)).toBe(100);
  });

  it('returns null when there is no Chrome token', () => {
    expect(parseChromeMajor('garbage')).toBeNull();
    expect(parseChromeMajor('')).toBeNull();
    expect(parseChromeMajor(desktopFirefox)).toBeNull();
  });

  it('does not mistake HeadlessChrome or a version-less token for Chrome', () => {
    expect(parseChromeMajor('HeadlessChrome/120.0.0.0')).toBeNull();
    expect(parseChromeMajor('Chrome/')).toBeNull();
  });
});

describe('isOutdatedAndroidWebView', () => {
  it('accepts a WebView at or above the minimum', () => {
    expect(isOutdatedAndroidWebView(androidWebView('124.0.6367.82'), 117)).toBe(false);
    expect(isOutdatedAndroidWebView(androidWebView('117.0.0.0'), 117)).toBe(false);
  });

  it('flags a WebView below the minimum', () => {
    expect(isOutdatedAndroidWebView(androidWebView('100.0.0.0'), 117)).toBe(true);
    expect(isOutdatedAndroidWebView(androidWebView('116.0.0.0'), 117)).toBe(true);
  });

  it('never flags non-Android browsers, however old', () => {
    expect(isOutdatedAndroidWebView(desktopChrome100, 117)).toBe(false);
    expect(isOutdatedAndroidWebView(desktopFirefox, 117)).toBe(false);
  });

  it('never flags an Android browser with no Chrome version to judge', () => {
    expect(isOutdatedAndroidWebView(androidFirefox, 117)).toBe(false);
  });

  it('never flags empty or garbage user agents', () => {
    expect(isOutdatedAndroidWebView('', 117)).toBe(false);
    expect(isOutdatedAndroidWebView('garbage', 117)).toBe(false);
  });
});
