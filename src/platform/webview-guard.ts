/** The Chrome major version in a user agent, or null when there is none (HeadlessChrome does not count). */
export function parseChromeMajor(userAgent: string): number | null {
  const match = /\bChrome\/(\d+)/.exec(userAgent);
  return match?.[1] === undefined ? null : Number(match[1]);
}

/**
 * True only for an Android WebView old enough that the app cannot run (spec §7.6):
 * the user agent says Android and carries a Chrome major below `minMajor`.
 * Anything we cannot judge is treated as fine, so the guard never blocks by mistake.
 */
export function isOutdatedAndroidWebView(userAgent: string, minMajor: number): boolean {
  if (!/\bAndroid\b/.test(userAgent)) return false;
  const major = parseChromeMajor(userAgent);
  return major !== null && major < minMajor;
}
