import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// The cloud container ships its own Chromium; a project-local Playwright bump
// must not break sessions there, so the browser path is explicit (docs/phase0-findings.md §3).
function chromiumPath(): string | undefined {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  if (process.env.CLAUDE_CODE_REMOTE === 'true') return '/opt/pw-browsers/chromium';
  return undefined;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: chromiumPath() } },
    },
  ],
  // Always build first: e2e checks the production bundle (CSP, budget), never a stale one.
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
