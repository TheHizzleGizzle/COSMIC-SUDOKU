import { expect, test } from '@playwright/test';

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

test('shows the Cosmic Sudoku heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Cosmic Sudoku' })).toBeVisible();
});

test('makes no third-party requests', async ({ page, baseURL }) => {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.goto('/');
  await expect(page.getByTestId('shell')).toBeVisible();
  await page.waitForLoadState('networkidle');

  const pageOrigin = new URL(baseURL ?? 'http://localhost').origin;
  const foreign = urls.filter(
    (url) => !url.startsWith('data:') && new URL(url).origin !== pageOrigin,
  );
  expect(urls.length).toBeGreaterThan(0);
  expect(foreign).toEqual([]);
});

test('ships the exact CSP in the production build', async ({ page }) => {
  await page.goto('/');
  const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(meta).toHaveAttribute('content', CSP);
});

test('animates the starfield by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('starfield')).not.toHaveCSS('animation-name', 'none');
});

test('honours prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByTestId('starfield')).toHaveCSS('animation-name', 'none');
});

test('logs cosmic:ready', async ({ page }) => {
  const ready = page.waitForEvent('console', {
    predicate: (message) => message.text() === 'cosmic:ready',
  });
  await page.goto('/');
  expect((await ready).text()).toBe('cosmic:ready');
});

test('loads without console errors or CSP violations', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('shell')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});

const androidWebView = (chrome: string) =>
  `Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${chrome} Mobile Safari/537.36`;

test.describe('outdated Android WebView (Chrome 100)', () => {
  test.use({ userAgent: androidWebView('100.0.0.0') });

  test('shows the update screen instead of the game', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Update Android System WebView to keep playing' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cosmic Sudoku' })).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(logs).not.toContain('cosmic:ready');
  });
});

test.describe('current Android WebView (Chrome 124)', () => {
  test.use({ userAgent: androidWebView('124.0.6367.82') });

  test('plays normally', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cosmic Sudoku' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Update Android System WebView/ })).toHaveCount(
      0,
    );
  });
});
