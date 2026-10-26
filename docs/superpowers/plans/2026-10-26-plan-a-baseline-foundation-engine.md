# Cosmic Sudoku 2.0 — Plan A: Baseline, Foundation, Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the riskiest parts of the rebuild: capture the original app as a visual and data reference, ship an empty cosmic shell as a web page and as a CI-built, signed Android APK on the owner's phone, and build the pure, deterministic Sudoku engine with tests.

**Architecture:** A guardrailed TypeScript 7 / Vite 8 / Biome toolchain whose layer rule (`ui → game → engine`) is enforced by tsconfig and lint. A Capacitor 8 Android wrapper around the same web build, built only by CI. A framework-free engine: seeded integer RNG, solver, 11-technique grader, generator with a work-count budget, and hints.

**Tech Stack:** pnpm · TypeScript 7 · Vite 8 · React 19 · Tailwind 4 · Biome 2 · Vitest 5 + fast-check · Playwright · knip · Capacitor 8 · Gradle/JDK 21 (CI) · GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-26-cosmic-sudoku-rebuild-design.md` (rev 2.1, on `main` as `8bcc875`). Read it first. This plan records only the decisions the spec leaves open. Plan A covers spec phases 0–2. Plans B (game, persistence, UI) and C (new-feature UI, hardening, release) are written after Plan A's exit criteria are met.

## Global Constraints

Values copied from the spec. Every task's requirements include this section.

- **Runtime:** `engines.node` is `>=22.12` in the spec; this plan raises the *tooling* floor to `>=22.18` (native type stripping for `node scripts/*.ts`, and Capacitor's loader for `capacitor.config.ts` under TS 7). Task 3 amends the spec. CI runs Node 22 and 24.
- **Versions, pinned exactly (no ranges):** react / react-dom 19.3.1 · vite 8.3.5 · @vitejs/plugin-react 6.1.2 · tailwindcss and @tailwindcss/vite 4.3.3 · typescript 7.0.2 · vitest and @vitest/coverage-v8 5.0.5 · fast-check 4.10.2 · @biomejs/biome 2.6.3 · knip 6.43.0 · @capacitor/core, cli, android 8.5.3 · @capacitor/splash-screen 8.0.2 · @capacitor/status-bar 8.0.4 · @playwright/test per Task 2's decision (container has Playwright 1.63.0).
- **TypeScript:** `strict`. The core projects (`engine`, `game`, `persistence`, `content`) compile with `lib: ["ES2023"]` and `types: []`, so no DOM. Test files compile in a separate Node-typed project.
- **Layers (spec §5.1):** dependencies point down only. `engine` imports nothing from the other layers; no React, DOM, storage or clock anywhere in core. Capacitor is imported only from `src/platform/`.
- **Engine purity:** no `Math.random`, `Date`, `performance` or timers under `src/engine/`. Integer-only RNG. The generator's budget counts work (candidate attempts and solver nodes), never time.
- **Lint and format:** Biome 2 only. No ESLint, no Prettier.
- **Android:** application id `io.github.thehizzlegizzle.cosmicsudoku`; debug builds add suffix `.debug` and label "Cosmic Sudoku (debug)", and are signed with a fixed committed debug keystore. minSdk 24, compileSdk and targetSdk 36, AGP 8.13.0, Gradle 8.14.3, JDK 21. `android.minWebViewVersion` is 117. Release builds: non-debuggable, R8 on, cleartext off, no `INTERNET` permission, `allowBackup=true` with the Capacitor Preferences file in the backup rules. No `server.url` in the Capacitor config.
- **Versioning:** the tag `vMAJOR.MINOR.PATCH` is the source of truth. `versionCode = MAJOR × 1,000,000 + MINOR × 1,000 + PATCH`.
- **Signing isolation:** `ANDROID_SIGNING_PASSPHRASE` is an environment secret in the `android-release` environment (limited to `main` and `v*` tags), referenced only by `release.yml` and `android-keygen.yml`.
- **CSP** (production builds only): `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'`.
- **Build:** `base: './'`. Initial JS ≤ 150,000 bytes gzip. Release APK ≤ 12 MB.
- **Tier ladder (spec Appendix B):** rung 1 naked-single, 2 hidden-single (Easy); 3 naked-pair, 4 hidden-pair, 5 pointing, 6 box-line (Medium); 7 naked-triple, 8 hidden-triple, 9 x-wing (Hard); 10 xy-wing, 11 swordfish (Expert). A puzzle's tier is the tier of the highest rung its canonical solve (easiest technique first) needs.
- **Commits:** every commit message ends with the two trailer lines `Co-Authored-By: Claude <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01SAp6JKkEcs8KtPf48N44Sb`. No model names in commits, PR text, code or comments.
- **Branch:** work on `ccr-f3b683c3-r6qbqy` only (already restarted from `main`). The one exception is `chore/android-signing-key`, which the keygen workflow creates in CI.
- **Cloud limits:** this environment has no Android SDK and no emulator. Android changes are verified by CI runs, read through the GitHub tools. Everything else runs locally.
- **Before every commit from Task 3 onward:** `pnpm check:fast` must pass.

## Review Focus

Failure modes the spec implies that most likely bite a person using the software. Each has a test in the named task.

1. **Malformed boards** (wrong length, non-digit characters, duplicate digits already on the board): the engine throws, returns 0 solutions, or reports conflicts, and never hangs. Tasks 12, 13.
2. **Generator budget exhaustion:** a tiny budget throws `GenerationBudgetExceeded`. It never returns an off-tier or non-unique puzzle, and the default budgets never throw across the audit seeds. Tasks 19, 20.
3. **Hostile seeds and arguments:** empty, emoji and 10,000-character seeds produce valid deterministic output, and bad `nextInt` arguments throw. Task 11.
4. **Release version edge cases:** `v1.2.3-rc1`, leading zeros, minor ≥ 1000, `versionCode` above Android's 2,100,000,000 limit, a tag that already exists. Tasks 5, 7.
5. **Hook payload edge cases:** malformed JSON, `../` traversal, absolute paths outside the project, and the same Stop failure repeating. Task 9.

## Plan map and spec amendments

| Tasks | Spec phase | Lands in |
|---|---|---|
| (this document) | Plan | PR-0 (docs only) |
| 1–2 | 0 Baseline | PR-1 |
| 3–10 | 1 Foundation | PR-1 (merged by the owner as soon as green) |
| 11–22 | 2 Engine | PR-2 |

Each PR starts from a branch restarted from the latest `main` after the previous PR merges.

**Deferred to Plans B and C** (they need code that does not exist yet): the `@claude` workflow (`claude.yml`), the `add-content` and `verify-ui` skills, the self-hosted font, the web PWA, visual snapshots, and the install-over-previous-release emulator check.

The plan makes these small amendments to the spec. Each is applied by the task named.

| # | Amendment | Why | Task |
|---|---|---|---|
| a | Old app deleted in phase 1, not phase 6 | The new scaffold occupies the same paths. The old app stays in git history (`46f5c93`) and in `docs/reference/`. | 3 |
| b | Tooling Node floor `>=22.18` | Native type stripping is unflagged from 22.18. | 3 |
| c | Technique weights live in `src/engine/techniques/weights.ts` | The engine's rating needs them and cannot import from `game/`. `levels.ts` holds windows and budgets. | 14 |
| d | Generator throws `GenerationBudgetExceeded` when no in-tier candidate exists within the budget | Keeps "never out of tier" true. Default budgets are tuned so it never happens. | 19 |
| e | Signing archive uses Node `crypto` AES-256-GCM, not `openssl enc` | Testable, authenticated, no CLI dependency. | 7 |
| f | Phase-1 smoke test checks only `cosmic:ready` (twice); `cosmic:resumed` arrives with persistence in Plan B | There is no saved game yet. | 6 |
| g | Golden daily file stores the full `givens` strings, not hashes | Same contract, readable diffs. | 21 |
| h | Stop hook compares failure fingerprints instead of stopping at the first `stop_hook_active` | Claude Code already caps consecutive stop continuations at 8; fingerprints stop a loop only when no progress is made. | 9 |

## Spec §12 checklist coverage

| Item | Where it is answered |
|---|---|
| 1 pnpm bootstrap, 2 Playwright, 4 type stripping, 6 option names, 14 Docker, 16 repo visibility | Task 2 |
| 3 toolchain installs and builds together, 5 knip | Task 3 |
| 7 font subset size | Plan C (font is added with the UI) |
| 8 old-app baseline | Task 1 |
| 9 no `INTERNET` permission, 11 native build, 12 minWebView | Tasks 6, 8, 10 |
| 10 runners have SDK 36 and KVM | Tasks 8, 10 |
| 13 `@capacitor/assets` | Task 2 |
| 15 in-session SDK (optional) | Not in Plan A (needs the owner to allow `dl.google.com`) |

## Target file structure (end of Plan A)

```
.claude/            settings.json · hooks/{setup,guard,format,verify}.mjs · rules/{engine,ui,tests,android}.md · skills/{build-apk,release,tune-difficulty}/SKILL.md · agents/puzzle-auditor.md
.github/            workflows/{ci,deploy,release,android-keygen}.yml · dependabot.yml
android/            Capacitor project (committed) · app/debug.keystore · signing/release.enc (created by CI)
docs/               reference/ · phase0-findings.md · android.md · claude-code.md · engine-tour.md · engine-audit.md · adr/000{1,2,3}-*.md
e2e/                shell.spec.ts · determinism.spec.ts · global-setup.ts · engine-entry.ts
fixtures/legacy-v1/ fresh.json · midgame.json · maxed.json
scripts/            android-version.ts · android-signing.ts · check-budget.ts · audit-puzzles.ts · mine-technique-puzzles.ts · gen-starter-pool.ts · gen-golden-daily.ts · *.test.ts
src/engine/         types · rng · seed · grid · validate · solver · candidates · grader · hints · generator · index · techniques/{index,weights,singles,subsets,intersections,fish,wings} · testing/{dig,sound,fixtures/technique-puzzles.json} · golden/daily.json
src/game/           levels.ts · daily.ts
src/content/        starter-pool.json · starter-pool.ts
src/platform/       webview-guard.ts · native-shell.ts
src/ui/             App.tsx · styles/{tokens,base}.css · WebViewUpdateScreen.tsx
src/main.tsx
```

---

## Phase 0 — Baseline

### Task 1: Baseline the original app

**Files:**
- Create: `docs/reference/{default,nebula,aurora,galaxy}-{phone,desktop}.png`, `docs/reference/README.md`
- Create: `fixtures/legacy-v1/{fresh,midgame,maxed}.json`
- Scratch only (not committed, under the scratchpad directory): the old-app worktree and the capture script.

**Interfaces:**
- Produces: 8 reference screenshots (phone 390×844, desktop 1280×800) for Plan C's visual-parity checks. Each fixture is a flat `{ "<localStorage key>": "<raw string value>" }` object holding exactly the five v1 keys (`cosmic-sudoku-stats`, `cosmic-sudoku-achievements`, `cosmic-sudoku-themes`, `cosmic-sudoku-powerups`, `cosmic-sudoku-current-theme`), as the original app wrote them. Plan B's migration tests consume these.

- [ ] **Step 1: Create a worktree of the original app outside the repo**

Run: `git worktree add <scratchpad>/old-app 46f5c93`
Expected: the directory contains the original `package.json` and `src/`.

- [ ] **Step 2: Build it**

Run in the worktree: `npm ci && npm run build`
Expected: `dist/index.html` exists. If `npm ci` fails on `steercode-tagger`, delete that dev dependency, its import, and the `componentTagger()` call from the scratch copy's `package.json` and `vite.config.ts` (it is a dev-only plugin), then rerun.

- [ ] **Step 3: Serve it** with `npx vite preview` in the background (its config fixes port 3000).

- [ ] **Step 4: Capture the screenshots** (a scratchpad script using the preinstalled `playwright` module)

For each theme id in `default`, `nebula`, `aurora`, `galaxy`, and each viewport (390×844, 1280×800):
- Create a fresh context.
- Add an init script that seeds the five v1 keys with the "midgame" state (level 12, stardust 340, themes `default`+`nebula`+`aurora`+`galaxy` unlocked, `cosmic-sudoku-current-theme` set to the theme under capture), replaces `Math.random` with a fixed-seed generator, and freezes `Date.now`.
- Load `http://localhost:3000/`, wait for `.cosmic-bg`, inject `*{animation:none!important;transition:none!important}`.
- Take a viewport-sized (not full-page) screenshot to `docs/reference/<theme>-<phone|desktop>.png`.

- [ ] **Step 5: Capture the fixtures**

For three seeded states, load the app, then read back `JSON.stringify({...localStorage})` after the app's own effects have written all five keys. This guarantees real v1 shapes. The three states:
- `fresh`: untouched defaults.
- `midgame`: level 12, stardust 340, 3 achievements unlocked with ISO `unlockedAt` strings, themes `default` and `nebula` unlocked.
- `maxed`: level 60, stardust 9999, every achievement and theme unlocked.

- [ ] **Step 6: Verify**

Run: `file docs/reference/*.png` and `node -e "for (const f of ['fresh','midgame','maxed']) { const o = JSON.parse(require('fs').readFileSync('fixtures/legacy-v1/'+f+'.json','utf8')); console.log(f, Object.keys(o).length) }"`
Expected: 8 PNGs with the expected dimensions, each over 20 kB; each fixture prints `5`.

- [ ] **Step 7: Write `docs/reference/README.md`** (commit `46f5c93`, viewports, seeded state, what is frozen and why) and remove the worktree: `git worktree remove <scratchpad>/old-app --force`.

- [ ] **Step 8: Commit**

```bash
git add docs/reference fixtures/legacy-v1
git commit -m "docs: capture reference screenshots and v1 save fixtures of the original app"
```

### Task 2: Phase-0 environment probes

**Files:**
- Create: `docs/phase0-findings.md`

**Interfaces:**
- Produces decisions consumed by later tasks: **PNPM_PIN** (Task 3), **PW_STRATEGY** (Task 4), **PNPM_OPTIONS** (Task 3), **ICON_STRATEGY** (Plan C), **REPO_PRIVATE** (Task 10).

- [ ] **Step 1: pnpm bootstrap.** In a scratch directory, write a `package.json` with `"packageManager": "pnpm@12.15.0"` and run `pnpm --version`.
  Expected `12.15.0`. If it fails, record `PNPM_PIN = 10.28.0` (the preinstalled version). Otherwise `PNPM_PIN = 12.15.0`.

- [ ] **Step 2: pnpm option names.** Read the pnpm docs for the exact setting names for delaying brand-new releases and for allowlisting dependency install scripts (spec §12 item 6). Record them as **PNPM_OPTIONS**, with the delay set to 1,440 minutes (1 day).

- [ ] **Step 3: Playwright.** Run `node -e "require('playwright').chromium.launch().then(async b => { console.log(b.version()); await b.close() })"`; then repeat with `{ executablePath: '/opt/pw-browsers/chromium' }` if the default fails or the path exists.
  Record which works and set **PW_STRATEGY**: pin `@playwright/test` to 1.63.0 *and* honour `PW_CHROMIUM_PATH`.

- [ ] **Step 4: Type stripping.** Write `x.ts` containing `const n: number = 1; console.log(n satisfies number)` and run `node x.ts`.
  Expected: prints `1` on Node 22.22.

- [ ] **Step 5: `@capacitor/assets`.** Run `npm view @capacitor/assets@3.0.5 peerDependencies dependencies`.
  Record **ICON_STRATEGY = own icon script** unless it explicitly supports Capacitor 8.

- [ ] **Step 6: Repo visibility.** Use the GitHub `search_repositories` tool with `repo:TheHizzleGizzle/COSMIC-SUDOKU` and record `private`. Add a note that the owner must confirm in Settings → Environments that deployment-branch and tag rules are available.

- [ ] **Step 7: Docker.** Run `docker info 2>&1 | head -3`; record "client only, daemon not running" (informational, spec §12 item 14).

- [ ] **Step 8: Write `docs/phase0-findings.md`** with one section per probe (command, output, decision) and commit.

```bash
git add docs/phase0-findings.md
git commit -m "docs: record phase-0 environment findings and decisions"
```

---

## Phase 1 — Foundation

### Task 3: Clean slate and guardrailed toolchain

**Files:**
- Delete: `src/` (all), `index.html`, `package.json`, `package-lock.json`, `bun.lock`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `components.json`, `nixpacks.toml`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.github/workflows/{static,staticx,jekyll-gh-pages}.yml`, `public/{favicon.ico,apple-touch-icon.png,placeholder.svg,manifest.json}`
- Create: `package.json`, `pnpm-workspace.yaml` (pnpm settings), `.nvmrc` (`22`), `biome.json`, `knip.json`, `tsconfig.json`, `tsconfig.core.json`, `tsconfig.app.json`, `tsconfig.test.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `src/engine/index.ts`, `src/engine/purity.test.ts`, `README.md` (short and truthful about the rebuild), `docs/adr/0002-toolchain.md`
- Modify: `.gitignore`, `docs/superpowers/specs/2026-10-26-cosmic-sudoku-rebuild-design.md` (§8.1 Node floor; §10 deletion timing)

**Interfaces:**
- Produces: package scripts `dev`, `build`, `preview`, `lint` (`biome ci .`), `format`, `typecheck` (`tsc -b`), `knip`, `test` (`vitest run`), `test:cov`, `check:fast` (`pnpm lint && pnpm typecheck && pnpm knip && pnpm test`), `check` (`pnpm check:fast && pnpm test:cov && pnpm build && node scripts/check-budget.ts && pnpm e2e`), `e2e`, `e2e:update`, `build:native`, `android:sync`, `android:debug`, `audit:puzzles`. (Scripts whose targets arrive in later tasks are added by those tasks.)
- Produces: `findForbidden(source: string): string[]` inside `src/engine/purity.test.ts`; the layer rules in the table below.

**Layer rules** (Biome `noRestrictedImports` per directory; tsconfig supplies the no-DOM rule):

| Directory | Must not import |
|---|---|
| `src/engine/**` | `react`, `react-dom`, `@capacitor/*`, and anything under `src/{game,persistence,content,platform,worker,ui}` |
| `src/game/**` | `react`, `react-dom`, `@capacitor/*`, and anything under `src/{persistence,platform,worker,ui}` |
| `src/persistence/**` | `react`, `react-dom`, `@capacitor/*`, and anything under `src/{platform,worker,ui}` |
| `src/content/**` | `react`, `react-dom`, `@capacitor/*`, and anything under `src/{game,persistence,platform,worker,ui}` |
| `src/platform/**`, `src/worker/**` | anything under `src/ui` (and `react` for `worker`) |

- [ ] **Step 1: Remove the original app in its own commit**

```bash
git rm -r -q src index.html package.json package-lock.json bun.lock vite.config.ts tailwind.config.ts postcss.config.js eslint.config.js components.json nixpacks.toml tsconfig.json tsconfig.app.json tsconfig.node.json public .github/workflows/static.yml .github/workflows/staticx.yml .github/workflows/jekyll-gh-pages.yml
git commit -m "chore: remove the original vibe-coded app (recoverable at 46f5c93)"
```

- [ ] **Step 2: Write `package.json` and pnpm settings.** `"type": "module"`, `engines.node >=22.18`, `packageManager` from **PNPM_PIN**, exact pinned versions from Global Constraints, the settings from **PNPM_OPTIONS** (1-day release delay; install-script allowlist limited to what the lockfile truly needs). Then run `pnpm install`.
  Expected: exit 0. **If install or `tsc -b` fails because of TS 7, Vite 8 or Biome interplay, stop and report the exact error to the owner.** Do not silently fall back (spec §8.1 describes the fallback but it changes tooling, so the owner decides).

- [ ] **Step 3: Write the configs.** tsconfigs per Global Constraints: `tsconfig.core.json` includes `src/{engine,game,persistence,content}`, excludes `**/*.test.ts` and `src/engine/testing/**`; `tsconfig.test.json` includes the tests and `src/engine/testing/**` with `types: ["node"]` and no DOM; `tsconfig.app.json` covers `src/{ui,platform,worker}` and `src/main.tsx` with DOM and references core; `tsconfig.node.json` covers `scripts/`, `e2e/` and tool configs; `tsconfig.json` is the solution file. `erasableSyntaxOnly` on for scripts. `biome.json`: formatter, recommended lint rules, the a11y rules, the React domain, and the layer table above as per-directory overrides. `knip.json` entries: `src/main.tsx`, `src/engine/index.ts`, `src/content/starter-pool.ts`, `src/game/*.ts`, `e2e/**/*.ts`, `scripts/**/*.ts`, `playwright.config.ts`, `vitest.config.ts`, `vite.config.ts`. `vitest.config.ts`: node environment; include `src/**/*.test.ts` and `scripts/**/*.test.ts`; the v8 coverage provider with `include: ['src/engine/**', 'src/game/**']` and exclusions for tests, `src/engine/testing/**` and `src/engine/golden/**` (the thresholds arrive with the first engine code, in Task 11). Core tsconfigs enable `resolveJsonModule`. `vite.config.ts`: React and Tailwind plugins, `base: './'`.

- [ ] **Step 4: Write the purity test.** `src/engine/purity.test.ts` with `findForbidden(source: string): string[]` returning each forbidden token found (`Math.random`, `Date`, `performance`, `setTimeout`, `setInterval`; word-boundary matches), and:
  - Test `findForbidden detects each forbidden token`: asserts the exact array for `'Math.random()'`, `'new Date()'`, `'performance.now()'`, `'setTimeout(f)'` and `[]` for `'const date = 1'` (word boundary).
  - Test `engine sources contain no forbidden tokens`: reads every non-test `.ts` under `src/engine/` and asserts `findForbidden` returns `[]` for each.
  Add `src/engine/index.ts` as `export {}` for now.

- [ ] **Step 5: Run the checks.** `pnpm check:fast`
  Expected: PASS.

- [ ] **Step 6: Prove the guardrails fail when violated.** For each probe, create the file, run the command, confirm the failure, then delete the probe:
  - `src/engine/_probe.ts` containing `export const x = window.innerWidth;` → `pnpm typecheck` FAILS (no DOM in core).
  - `src/engine/_probe.ts` containing `import "react";` → `pnpm lint` FAILS (restricted import).
  - `src/engine/_probe.ts` containing `export const x = Math.random();` → `pnpm test` FAILS (purity).
  Expected: all three fail with those specific causes; `git status` clean afterwards.

- [ ] **Step 7: Write `docs/adr/0002-toolchain.md`** (why Biome rather than ESLint; TS 7 notes; any version workaround) and a short truthful `README.md`. Amend the spec: §8.1 "Runtime support" to `>=22.18` for tooling with the type-stripping reason, and §10's "Deleted at the end" paragraph to say the old app was deleted in phase 1.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "build: scaffold guardrailed TS 7 / Vite 8 / Biome toolchain with layer rules"
```

### Task 4: Cosmic shell, web e2e and bundle budget

**Files:**
- Create: `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/ui/styles/tokens.css`, `src/ui/styles/base.css`, `playwright.config.ts`, `e2e/shell.spec.ts`, `scripts/check-budget.ts`, `scripts/check-budget.test.ts`
- Modify: `vite.config.ts` (CSP plugin), `package.json` (`e2e`, `e2e:update`)

**Interfaces:**
- Produces: the page logs `cosmic:ready` via `console.log` once the first render completes (Task 6's smoke test consumes it); root element `data-testid="shell"`; `gzipBytes(dir: string): number` and `BUDGET_BYTES = 150_000` in `scripts/check-budget.ts`.

- [ ] **Step 1: Write the failing e2e tests** in `e2e/shell.spec.ts`:
  - `shows the Cosmic Sudoku heading`: `getByRole('heading', { name: 'Cosmic Sudoku' })` is visible.
  - `makes no third-party requests`: record every request URL during load; assert every origin equals the page origin.
  - `ships the exact CSP in the production build`: the `<meta http-equiv="Content-Security-Policy">` content equals the Global Constraints string.
  - `honours prefers-reduced-motion`: with `reducedMotion: 'reduce'`, the starfield element's computed `animation-name` is `none`.
  - `logs cosmic:ready`: a console message with exactly that text arrives.

- [ ] **Step 2: Run to confirm failure.** `pnpm e2e`
  Expected: FAIL (no app).

- [ ] **Step 3: Implement the shell.** `index.html` (`lang="en"`, `viewport-fit=cover`, `theme-color #0a0a1a`). `main.tsx` renders `<App/>` then logs `cosmic:ready`. `App.tsx`: deep-space gradient, floating Cosmos 🌟, heading "Cosmic Sudoku", subtitle "Preparing the cosmos…". `tokens.css` holds the spec §7.2 palette as Tailwind 4 `@theme` tokens (`#0a0a1a`, `#1a1b3a`, `#2d3561`, `#00f5ff`, `#ff6b9d`, `#c471ed`, `#ffd700`, `#ff4500`, `#0f0f23`) and one glass-tile utility. `base.css` holds the starfield (CSS gradients plus a twinkle animation) and a `prefers-reduced-motion` block that disables every animation. No remote fonts.

- [ ] **Step 4: Write `playwright.config.ts`.** Chromium only locally; `webServer` runs `pnpm build && pnpm preview --port 4173`; `launchOptions.executablePath` comes from `PW_CHROMIUM_PATH` when set, or `/opt/pw-browsers/chromium` when `CLAUDE_CODE_REMOTE === 'true'` (per **PW_STRATEGY**). CI adds Firefox and WebKit in Task 8.

- [ ] **Step 5: Add the CSP.** A Vite plugin with `apply: 'build'` and `transformIndexHtml` that inserts the CSP meta tag.

- [ ] **Step 6: Write the budget script test** `scripts/check-budget.test.ts`: `gzipBytes` on a temp directory containing one file with known content returns the exact gzip size of that content; it ignores non-`.js` files; `BUDGET_BYTES` equals `150000`. Implement `gzipBytes(dir)` summing gzip sizes of `dir/assets/*.js`, and a CLI mode that exits 1 above budget.

- [ ] **Step 7: Run everything.** `pnpm e2e && pnpm build && node scripts/check-budget.ts && pnpm check:fast`
  Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add the cosmic shell with web e2e checks and a bundle budget"
```

### Task 5: Android pure helpers (version and WebView guard)

**Files:**
- Create: `scripts/android-version.ts`, `scripts/android-version.test.ts`, `src/platform/webview-guard.ts`, `src/platform/webview-guard.test.ts`

**Interfaces:**
- Produces:
  - `computeAndroidVersion(tag: string | undefined): { versionName: string; versionCode: number }`. A CLI mode, `node scripts/android-version.ts <tag>`, prints `COSMIC_VERSION_NAME=…` and `COSMIC_VERSION_CODE=…` lines for Gradle and the workflows.
  - `parseChromeMajor(userAgent: string): number | null`
  - `isOutdatedAndroidWebView(userAgent: string, minMajor: number): boolean`

- [ ] **Step 1: Write the failing version tests** (`describe('computeAndroidVersion')`):
  - `'v1.2.3'` → `{ versionName: '1.2.3', versionCode: 1002003 }`.
  - `'v0.1.0'` → versionCode `1000`; `'v10.20.30'` → `10020030`.
  - `undefined` → `{ versionName: '0.0.0', versionCode: 1 }`.
  - Throws on `'1.2.3'` (no `v`), `'v1.2'`, `'v1.2.3-rc1'`, `'v01.2.3'`, `'v1.1000.0'`, `'v1.0.1000'`, and `'v2100.0.1'` (above 2,100,000,000). `'v2100.0.0'` is accepted.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- scripts/android-version.test.ts`
  Expected: FAIL (module missing).

- [ ] **Step 3: Implement `computeAndroidVersion`** with one strict regex (no leading zeros, three numeric parts, parts below 1000 for minor and patch) plus the versionCode ceiling. Run the tests. Expected: PASS.

- [ ] **Step 4: Write the failing guard tests.** User-agent fixtures:
  - Android WebView: `Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.82 Mobile Safari/537.36` → `parseChromeMajor` is `124`; `isOutdatedAndroidWebView(ua, 117)` is `false`.
  - Same string with `Chrome/100.0.0.0` → `true`.
  - Desktop Chrome 100 (no `Android`) → `false`. Desktop Firefox → `false`. `''` → `false`. `'garbage'` → `false`, and `parseChromeMajor('garbage')` is `null`.

- [ ] **Step 5: Implement the guard** (outdated only when the UA contains `Android` and a parseable `Chrome/<major>` below `minMajor`). Run the tests. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/android-version.* src/platform/webview-guard.*
git commit -m "feat: add Android version computation and the WebView version guard"
```

### Task 6: Capacitor and the Android project

**Files:**
- Create: `capacitor.config.ts`, `android/**` (generated, then customized), `android/app/debug.keystore`, `android/app/src/release/AndroidManifest.xml`, `android/app/src/main/res/xml/{data_extraction_rules,backup_rules}.xml`, `src/platform/native-shell.ts`, `src/ui/WebViewUpdateScreen.tsx`, `scripts/android-config.test.ts`
- Modify: `package.json` (deps; scripts `build:native`, `android:sync`, `android:debug`), `.gitignore` (synced assets; `!android/app/debug.keystore`), `src/main.tsx`, `e2e/shell.spec.ts`, spec §7.6 note on the Phase-1 smoke marker

**Interfaces:**
- Consumes: `isOutdatedAndroidWebView` (Task 5), `computeAndroidVersion` (Task 5).
- Produces:
  - Gradle reads `COSMIC_VERSION_NAME`, `COSMIC_VERSION_CODE`, and, for release, `COSMIC_KEYSTORE_PATH`, `COSMIC_KEYSTORE_PASSWORD`, `COSMIC_KEY_ALIAS`, `COSMIC_KEY_PASSWORD` from the environment. Debug uses the committed `android/app/debug.keystore` (alias `androiddebugkey`, store and key password `android`).
  - `initNativeShell(): Promise<void>` in `src/platform/native-shell.ts`: a no-op on the web; on Android it sets a light status-bar style and hides the splash screen.
  - `capacitor.config.ts` is a TypeScript file (the Capacitor 8.5.3 CLI loads it through Node's native type stripping when TS 7 lacks the compiler API; `erasableSyntaxOnly` applies).

- [ ] **Step 1: Write the failing invariants test** `scripts/android-config.test.ts`. It parses files and asserts:
  - `appId and name`: config `appId` is `io.github.thehizzlegizzle.cosmicsudoku`, `appName` is `Cosmic Sudoku`.
  - `sdk levels`: `android/variables.gradle` has `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`.
  - `release manifest removes INTERNET`: the release overlay contains `tools:node="remove"` for `android.permission.INTERNET`.
  - `debug build uses the suffix and the committed keystore`: `app/build.gradle` has `applicationIdSuffix ".debug"`, and `android/app/debug.keystore` exists.
  - `backup rules include the Preferences file`: both XML files mention `CapacitorStorage`.
  - `config has no server.url and uses https`: no `url` under `server`, `androidScheme` is `https`.
  - `minWebViewVersion is 117`: under `android`.
  - `release signing reads env vars`: `app/build.gradle` references the four `COSMIC_KEY*` env names and contains no literal password.
  - `versions come from env`: references `COSMIC_VERSION_NAME` and `COSMIC_VERSION_CODE`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- scripts/android-config.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Add dependencies and generate the project.** Install the pinned Capacitor packages, write `capacitor.config.ts` (`webDir: 'dist'`, the values above, no `server.url`), then run `pnpm build:native && pnpm exec cap add android`.
  Expected: `android/` exists. (This needs no Android SDK.) If the CLI cannot load `capacitor.config.ts`, record the error in the ADR and use `capacitor.config.json` instead, then adjust this task's test and spec §5.2 accordingly.

- [ ] **Step 4: Customize `android/`** to satisfy the invariants: label strings "Cosmic Sudoku" and "Cosmic Sudoku (debug)"; `applicationIdSuffix ".debug"` and the committed debug keystore for the debug build type; env-driven release signing and version fields; the release manifest overlay; the two backup XML files, referenced from the manifest with `allowBackup="true"`; `usesCleartextTraffic="false"`; R8 on for release. Generate the debug keystore with `keytool -genkeypair -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"` and un-ignore it in `.gitignore`. Ignore the synced assets directory.

- [ ] **Step 5: Integrate in the app.** `initNativeShell()` as specified. `main.tsx`: if `isOutdatedAndroidWebView(navigator.userAgent, 117)`, render `WebViewUpdateScreen` ("Update Android System WebView to keep playing") instead of `App`; otherwise render `App`, call `initNativeShell()`, then log `cosmic:ready`. Add an e2e test to `e2e/shell.spec.ts`: with a user agent of an Android WebView on Chrome 100, the update screen is shown and the Cosmic Sudoku heading is not.

- [ ] **Step 6: Verify locally.** `pnpm android:sync && test -f android/app/src/main/assets/public/index.html && pnpm test && pnpm e2e && pnpm check:fast`
  Expected: all PASS. (Gradle cannot run here; CI proves it in Task 10.)

- [ ] **Step 7: Amend spec §7.6** to say the Phase-1 smoke test checks `cosmic:ready` before and after a relaunch, and that `cosmic:resumed` arrives with persistence in Plan B. Commit.

```bash
git add -A
git commit -m "feat: add the Capacitor Android project, native shell and WebView update screen"
```

### Task 7: Signing and release tooling

**Files:**
- Create: `scripts/android-signing.ts`, `scripts/android-signing.test.ts`, `.github/workflows/android-keygen.yml`, `.github/workflows/release.yml`, `docs/android.md`
- Modify: `package.json` (`android:release` script), spec Appendix E cipher line

**Interfaces:**
- Produces: `encryptBlob(plain: Uint8Array, passphrase: string): Uint8Array` and `decryptBlob(encrypted: Uint8Array, passphrase: string): Uint8Array`. Format: ASCII magic `COSMICKEY1`, then 16-byte salt, 12-byte IV, 16-byte GCM tag, then ciphertext. Key derivation: PBKDF2-HMAC-SHA256, 600,000 iterations, 32-byte key. Cipher: AES-256-GCM. CLI: `node scripts/android-signing.ts encrypt|decrypt <in> <out>`, passphrase from `ANDROID_SIGNING_PASSPHRASE`. Bundle JSON stored inside: `{ "keystoreBase64": string, "alias": string, "password": string }`.

- [ ] **Step 1: Write the failing tests** (`describe('android-signing')`):
  - `round-trips arbitrary bytes`: `decryptBlob(encryptBlob(b, p), p)` equals `b` for 0 bytes, 1 byte and 100,000 random bytes.
  - `wrong passphrase throws`.
  - `tampered ciphertext throws` (flip one byte of the ciphertext, then one byte of the tag).
  - `output is salted`: two encryptions of the same input differ.
  - `starts with the magic header`.
  - `rejects a passphrase shorter than 16 characters` on both functions.
  - `rejects input without the magic header`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- scripts/android-signing.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement both functions and the CLI** with Node's `crypto` (`pbkdf2Sync`, `createCipheriv`, `createDecipheriv`). Run the tests. Expected: PASS.

- [ ] **Step 4: Write `android-keygen.yml`.** Trigger `workflow_dispatch` only; `environment: android-release`; a guard step that fails unless `github.ref == 'refs/heads/main'`; `permissions: contents: write`. Steps: create a PKCS12 keystore with `keytool` (RSA 4096, 10,000 days, alias `cosmic`) using a random 32-character password; `::add-mask::` every generated value before use; build the JSON bundle; encrypt with the CLI; commit only `android/signing/release.enc` to a new branch `chore/android-signing-key` and push it. Never print the bundle or keystore.

- [ ] **Step 5: Write `release.yml`.** Trigger `workflow_dispatch` only, input `version` (e.g. `1.0.0`); `environment: android-release`; a guard that the ref is `main`; `permissions: contents: write`. Steps in order:
  - Compute the tag with `android-version.ts` (invalid input fails before anything is built).
  - Fail if the tag already exists (`git ls-remote --tags`).
  - `pnpm install --frozen-lockfile`, `pnpm check:fast`, `pnpm android:sync`.
  - Decrypt the bundle to the runner temp directory and export `COSMIC_KEYSTORE_PATH`, `COSMIC_KEYSTORE_PASSWORD`, `COSMIC_KEY_ALIAS`, `COSMIC_KEY_PASSWORD`.
  - `./gradlew assembleRelease`, then verify with `apksigner verify --verbose` and dump permissions with `aapt2 dump permissions` (the log must not list `INTERNET`).
  - Write `SHA256SUMS`, create the tag, and `gh release create` with the APK and the checksum.
  The install-over-previous-release emulator check is added in Plan C, because the first release has no predecessor.

- [ ] **Step 6: Write `docs/android.md`.** Sections: install on a phone (open the Release, download, allow "Install unknown apps" for the browser or file manager, install); updating (install a newer APK over the old one); signing-key custody (the environment, the passphrase, what loss means); one-time setup order (create the environment, add the secret, run `android-keygen.yml`, merge the key branch, run `release.yml`); how to carry progress into the APK (the web build imports v1 saves on first launch, then Export; in the APK, Import), because the APK cannot read browser storage.

- [ ] **Step 7: Amend spec Appendix E** to name AES-256-GCM with PBKDF2 (600,000 iterations) in place of `openssl enc`. Commit.

```bash
git add -A
git commit -m "feat: add Android signing archive tooling and the release and keygen workflows"
```

### Task 8: CI, deploy, Dependabot and workflow invariants

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/dependabot.yml`, `scripts/workflows.test.ts`, `docs/adr/0003-action-pinning.md`
- Modify: `package.json` (add the `yaml` dev dependency for the invariants test)

**Interfaces:**
- Produces: invariants every workflow must satisfy (tested below). Job names: `ci.yml` → `check`, `web`, `android-debug`, `android-smoke`; `deploy.yml` → `build`, `deploy`.

- [ ] **Step 1: Write the failing invariants test** `scripts/workflows.test.ts`, parsing every file in `.github/workflows/`:
  - `all workflows parse`.
  - `no workflow uses pull_request_target`.
  - `every workflow declares top-level permissions`.
  - `the signing secret is referenced only by release.yml and android-keygen.yml`, and in each, only in jobs with `environment: android-release`.
  - `ci.yml references no secrets other than GITHUB_TOKEN`.
  - `release.yml and android-keygen.yml trigger only on workflow_dispatch`.
  - `deploy.yml uses concurrency group pages with cancel-in-progress false`.
  - `every uses: is pinned to a 40-hex commit SHA`, except actions listed in `docs/adr/0003-action-pinning.md`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- scripts/workflows.test.ts`
  Expected: FAIL (`ci.yml` and `deploy.yml` missing).

- [ ] **Step 3: Resolve action SHAs.** For each action used, resolve the commit SHA of its latest stable major tag (try `git ls-remote https://github.com/<owner>/<repo> 'refs/tags/v*'` from the shell). If the sandbox cannot reach those repositories, pin by major tag and list each exception with its reason in `docs/adr/0003-action-pinning.md`; the Dependabot `github-actions` entry then proposes SHA-pinned updates.

- [ ] **Step 4: Write `ci.yml`.** Triggers: `pull_request` and `push` to `main`; `permissions: contents: read`.
  - `check`: Node 22 and 24 matrix; frozen install; `pnpm check:fast`.
  - `web`: build, budget script, `pnpm e2e` (Chromium, Firefox and WebKit via `playwright install --with-deps`); upload the Playwright report on failure.
  - `android-debug`: runs when `src/**`, `android/**`, `capacitor.config.ts` or `package.json` change; JDK 21; `pnpm android:sync`; `./gradlew assembleDebug` in `android/`; upload the APK artifact; Gradle cache keyed on the wrapper and lockfiles.
  - `android-smoke`: runs on `push` to `main` or on PRs labelled `android`; Android emulator (API 34, x86_64, KVM enabled); install the debug APK; clear logcat; launch; wait up to 90 s for `cosmic:ready`; screenshot; force-stop; relaunch; wait for `cosmic:ready` again; upload the screenshot.

- [ ] **Step 5: Write `deploy.yml`.** Triggers: push to `main` and `workflow_dispatch`; `permissions: contents: read, pages: write, id-token: write`; concurrency `pages`; `build` then `deploy` jobs using `configure-pages`, `upload-pages-artifact` (path `dist`) and `deploy-pages`.

- [ ] **Step 6: Write `dependabot.yml`:** weekly, grouped updates for `npm`, `github-actions` and `gradle` (directory `/android`), each with a cooldown.

- [ ] **Step 7: Run the invariants.** `pnpm test -- scripts/workflows.test.ts && pnpm check:fast`
  Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "ci: add CI, Pages deploy and Dependabot, with workflow invariant tests"
```

### Task 9: Claude Code layer

**Files:**
- Create: `CLAUDE.md`, `.claude/settings.json`, `.claude/hooks/{setup,guard,format,verify}.mjs`, `.claude/rules/{engine,ui,tests,android}.md`, `.claude/skills/build-apk/SKILL.md`, `.claude/skills/release/SKILL.md`, `docs/adr/0001-engine-first.md`, `docs/claude-code.md`, `scripts/claude-config.test.ts`, `scripts/claude-hooks.test.ts`
- Modify: `.gitignore` (`*.jks`, `*.keystore` with the debug-keystore exception)

**Interfaces:**
- Produces hook contracts (stdin is the JSON Claude Code sends; stderr is shown to Claude):
  - `guard.mjs` (PreToolUse `Edit|Write`): reads `tool_input.file_path`. Exit 2 with a reason for protected paths: `src/engine/golden/**`, `android/signing/**`, any `*.jks` or `*.keystore` except `android/app/debug.keystore`, and `pnpm-lock.yaml`, unless `COSMIC_ALLOW_PROTECTED=1`. Paths are normalised relative to `CLAUDE_PROJECT_DIR` (or `cwd`), so `../` and absolute forms resolve before matching. Exit 0 otherwise. Malformed JSON exits 0 with a one-line warning on stderr.
  - `format.mjs` (PostToolUse `Edit|Write`): for a path inside the project with a supported extension, runs `pnpm exec biome format --write <file>`; always exits 0.
  - `verify.mjs` (Stop): runs `pnpm check:fast`. On success exits 0. On failure writes the last 40 lines to stderr and exits 2, unless `stop_hook_active` is true and the failure output has the same SHA-256 fingerprint as the previous run (stored in the OS temp directory keyed by `session_id`), in which case it exits 0 with a "no progress" note.
  - `setup.mjs` (SessionStart `startup|resume`): runs `pnpm install --frozen-lockfile` when `node_modules` is missing or older than `pnpm-lock.yaml`; exits 0 even if the install fails (stderr gets the message).
- Produces: `CLAUDE.md` (fewer than 200 lines) containing the exact commands (`pnpm check:fast`, `pnpm check`, `pnpm test`, `pnpm e2e`, `pnpm android:sync`), the layer rule, the determinism rules, the "write the failing test first" rule, the definition of done, and a note that APKs build in CI.

- [ ] **Step 1: Write the failing hook tests** `scripts/claude-hooks.test.ts`, spawning each hook with a JSON payload:
  - `guard blocks protected paths`: `src/engine/golden/daily.json`, `android/signing/release.enc`, `foo.keystore`, `pnpm-lock.yaml` → exit 2 with a reason; `android/app/debug.keystore` and `src/ui/App.tsx` → exit 0.
  - `guard normalises traversal and absolute paths`: `src/ui/../engine/golden/daily.json` and the absolute project path of the same file → exit 2; an absolute path outside the project → exit 0.
  - `guard honours the override`: `COSMIC_ALLOW_PROTECTED=1` → exit 0.
  - `guard fails open on malformed input`: payload `not json` → exit 0 and stderr non-empty.
  - `format ignores paths outside the project` → exit 0, no file touched.
  - `verify exits 0 when checks pass`; `verify blocks on failure with the output tail` (stub `pnpm` via a `PATH` shim that fails); `verify gives up only on an identical repeated failure when stop_hook_active is true` (second identical run → 0; a *different* failure → 2 again).

- [ ] **Step 2: Write the failing config tests** `scripts/claude-config.test.ts`:
  - `settings.json is valid and wired`: parses; has `$schema`; hooks reference only existing files under `.claude/hooks/`; `permissions.deny` contains reads of `.env*`, `*.keystore` and `*.jks`.
  - `CLAUDE.md stays small and truthful`: fewer than 200 lines, and every `pnpm <script>` it mentions exists in `package.json`.
  - `skills and rules have valid frontmatter`: every `SKILL.md` has `name` and `description`; every rule has a `paths` array.

- [ ] **Step 3: Run to confirm failure.** `pnpm test -- scripts/claude-hooks.test.ts scripts/claude-config.test.ts`
  Expected: FAIL.

- [ ] **Step 4: Implement the four hooks** (plain Node ESM, no `jq`) to the contracts above.

- [ ] **Step 5: Write `.claude/settings.json`:** `$schema`; allow `Bash(pnpm run *)`, `Bash(pnpm exec *)`, `Bash(pnpm install *)`, `Bash(git status *)`, `Bash(git diff *)`, `Bash(git log *)`; the deny list above; the four hooks (`command: "node"`, `args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.mjs"]`, `timeout` 300 / 30 / 30 / 300 for setup, guard, format, verify respectively).

- [ ] **Step 6: Write `CLAUDE.md`, the four rules and the two skills.** Rules use `paths` globs: `engine.md` → `src/engine/**` (determinism, integer math, no DOM or React, bump `GENERATOR_VERSION` on algorithm change); `ui.md` → `src/ui/**` (accessibility checklist, tokens only, reduced motion); `tests.md` → `**/*.test.ts`, `e2e/**` (failing test first; regression tests named after the defect); `android.md` → `android/**`, `capacitor.config.ts` (never hand-edit synced output; run `pnpm android:sync`; the application id never changes; `versionCode` only increases; never print or commit key material). `build-apk` dispatches the CI build for the current branch, waits, reports the artifact, and on failure reads the job logs. `release` confirms `check` is green and dispatches `release.yml`. Write `docs/adr/0001-engine-first.md` and `docs/claude-code.md`.

- [ ] **Step 7: Run everything.** `pnpm test && pnpm check:fast`
  Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add the Claude Code layer: CLAUDE.md, rules, hooks, settings and skills"
```

### Task 10: Ship phase 1

**Files:**
- Modify: `docs/phase0-findings.md` (append a "Phase 1 results" section)

**Interfaces:**
- Consumes: everything from Tasks 3–9. Produces: Pages deployment, a CI-built debug APK, a signed release APK of the shell on the owner's phone.

- [ ] **Step 1: Push and open a draft PR (PR-1)** with a summary of Phases 0–1. Subscribe to PR activity.

- [ ] **Step 2: Drive CI to green** using the GitHub tools (`get_check_runs`, `get_job_logs`). Fix failures at the root cause. This includes the first real Gradle build: every Android defect surfaces here, not locally. Never skip or disable a test.

- [ ] **Step 3: Run the emulator smoke test.** Add the label `android` to the PR and confirm `android-smoke` passes. Expected: the log shows `cosmic:ready` twice and the screenshot artifact exists.

- [ ] **Step 4: Check the debug APK.** From the `android-debug` job log, confirm the build output, and record the APK size against the 12 MB budget in the findings doc.

- [ ] **Step 5: Mark ready and hand over.** Tell the owner PR-1 is green and list their steps: merge; set Pages → Source to "GitHub Actions"; create the `android-release` environment (deployment branches and tags limited to `main` and `v*`); add the secret `ANDROID_SIGNING_PASSPHRASE`; run `android-keygen.yml`; merge the `chore/android-signing-key` branch; run `release.yml` with version `0.1.0`.

- [ ] **Step 6: Verify the release** (after the owner runs it). From the `release.yml` log, confirm `apksigner verify` succeeded, the permissions dump lacks `INTERNET`, and the Release has the APK and `SHA256SUMS`. Confirm the Pages deployment succeeded. Then dispatch `release.yml` again with the same version `0.1.0`.
  Expected: it fails at the "tag already exists" step before anything is built, and no second Release is created.

- [ ] **Step 7: Owner installs the APK on their phone** (instructions in `docs/android.md`) and confirms they see the cosmic shell. Record the outcome.

- [ ] **Step 8: Commit** the findings update on a follow-up branch state (restart the branch from `main` after the merge).

```bash
git add docs/phase0-findings.md
git commit -m "docs: record phase-1 results (APK size, smoke test, release verification)"
```

**Exit criteria (spec phase 1):** shell live on Pages and installed on the owner's phone from a CI-built release APK; `pnpm check` green in CI and in the cloud container.

---

## Phase 2 — Engine

All of Phase 2 happens on the branch restarted from `main` after PR-1 merges (PR-2). Every engine file is pure TypeScript with the purity rules above. `pnpm check:fast` runs before each commit.

### Task 11: Types, RNG and daily seed

**Files:**
- Create: `src/engine/types.ts`, `src/engine/rng.ts`, `src/engine/rng.test.ts`, `src/engine/seed.ts`, `src/engine/seed.test.ts`
- Modify: `src/engine/index.ts`

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export type Tier = 'easy' | 'medium' | 'hard' | 'expert';
  export type TechniqueId = 'naked-single' | 'hidden-single' | 'naked-pair' | 'hidden-pair' | 'pointing' | 'box-line' | 'naked-triple' | 'hidden-triple' | 'x-wing' | 'xy-wing' | 'swordfish';
  export const TECHNIQUE_LADDER: readonly TechniqueId[];        // index + 1 is the rung
  export function rungOf(t: TechniqueId): number;
  export function tierOfTechnique(t: TechniqueId): Tier;        // rungs 1-2 easy, 3-6 medium, 7-9 hard, 10-11 expert
  export const TIER_ORDER: readonly Tier[];                     // easy, medium, hard, expert
  export interface Puzzle { seed: string; tier: Tier; rating: number; givens: string; solution: string; generatorVersion: number }
  export class GenerationBudgetExceeded extends Error {}
  // rng.ts
  export interface Rng { next32(): number; nextInt(n: number): number; shuffle<T>(items: readonly T[]): T[] }
  export function createRng(seed: string): Rng;
  // seed.ts
  export function dailySeed(isoDate: string): string;           // 'cosmic-sudoku/daily/' + isoDate
  ```
- Algorithm (fixed so the golden values are a reproducible contract): hash the seed's UTF-16 code units with cyrb128 into four 32-bit words; the generator is sfc32 over those words, discarding the first 15 outputs; `next32()` returns the 32-bit integer `t >>> 0` (never a float):
  ```ts
  // cyrb128
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < s.length; i++) { const k = s.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);  h4 = h1 ^ Math.imul(h4 ^ k, 2716044179); }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;   // then >>> 0 each
  // sfc32 step on (a,b,c,d)
  let t = (a + b | 0) + d | 0; d = d + 1 | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = (c << 21 | c >>> 11); c = c + t | 0; return t >>> 0;
  ```
  `nextInt(n)` uses rejection sampling over `next32()` (unbiased). `shuffle` is Fisher–Yates and returns a new array.

- [ ] **Step 1: Write the failing tests.**
  - `rng.test.ts`: `matches the pinned golden sequence` (the first 8 `next32()` values for seed `'cosmic-sudoku'`: **after the first implementation passes the other tests, run once, paste those eight values as literals, and treat them as the contract**); `same seed gives the same sequence`; `different seeds differ`; `nextInt stays in range` for n ∈ {1, 2, 9, 81, 1000} over 10,000 draws; `nextInt(1) is always 0`; `nextInt rejects 0, -1, 1.5, NaN and 2**32+1 with RangeError`; `shuffle returns a permutation, leaves its input unchanged and is deterministic`; `hostile seeds work`: `''`, `'🌌'` and a 10,000-character string each yield 100 finite integers in `[0, 2**32)`.
  - `seed.test.ts`: `dailySeed('2026-11-01')` equals `'cosmic-sudoku/daily/2026-11-01'`; throws on `'2026-1-1'`, `'2026-13-01'`, `'2026-02-30'`, `''`; accepts `'2028-02-29'`.
  - `types` smoke inside `rng.test.ts` or a `types.test.ts`: `tierOfTechnique` maps every rung per the ladder (`naked-single`→easy … `swordfish`→expert) and `rungOf('swordfish')` is `11`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/engine`
  Expected: FAIL.

- [ ] **Step 3: Implement `types.ts`, `rng.ts`, `seed.ts`** to the interfaces and algorithm above (leap-year-aware date validation, no `Date`). Export them from `index.ts`.

- [ ] **Step 4: Run the tests; paste the golden values; rerun.** Expected: PASS.

- [ ] **Step 4b: Add the coverage thresholds** (95% lines, 90% branches, scoped to `src/engine/**` and `src/game/**`) to `vitest.config.ts`, then run `pnpm test:cov`.
  Expected: PASS. From here on, every new engine or game file must arrive with enough tests to keep the thresholds green.

- [ ] **Step 5: Commit**

```bash
git add src/engine
git commit -m "feat(engine): add types, a seeded integer RNG and the daily seed"
```

### Task 12: Grid tables and validation

**Files:**
- Create: `src/engine/grid.ts`, `src/engine/grid.test.ts`, `src/engine/validate.ts`, `src/engine/validate.test.ts`
- Modify: `src/engine/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  // grid.ts
  export const CELLS = 81;  export const ALL = 0b111111111;
  export const UNITS: readonly (readonly number[])[];   // 27: rows 0-8, columns 9-17, boxes 18-26
  export const PEERS: readonly (readonly number[])[];   // 81 sorted arrays of 20 cell indexes
  export const ROW_OF: readonly number[]; export const COL_OF: readonly number[]; export const BOX_OF: readonly number[];
  export function parseBoard(s: string): Uint8Array;    // 81 chars of '0'-'9' ('.' accepted as 0); throws RangeError otherwise
  export function serializeBoard(b: Uint8Array): string;
  // validate.ts
  export function conflicts(board: Uint8Array): Set<number>;   // every cell sharing a digit with a peer
  export function isSolved(board: Uint8Array, solution: Uint8Array): boolean;
  ```

- [ ] **Step 1: Write the failing tests.**
  - `grid.test.ts`: `has 27 units of 9 distinct cells`; `every cell has exactly 20 peers and none is itself`; `row, column and box lookups agree with UNITS`; `parse and serialize round-trip`; `accepts '.' as empty`; `throws RangeError for length 80, length 82, 'x' and a digit above 9`.
  - `validate.test.ts`: `flags both cells of a row conflict`; `flags column and box conflicts`; **`conflicts are recomputed from the whole board`** (regression for audit D4): with 5 at cells 0 and 1, both are flagged; setting cell 0 to 0 yields an empty set; `a valid partial board has no conflicts`; `isSolved is true only when every cell equals the solution`; `isSolved is false for a board with an empty cell`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/engine/grid.test.ts src/engine/validate.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement** both modules (tables built once at module load, integer loops only) and export them. Run the tests. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine
git commit -m "feat(engine): add grid tables, board parsing and from-scratch conflict detection"
```

### Task 13: Solver

**Files:**
- Create: `src/engine/solver.ts`, `src/engine/solver.test.ts`
- Modify: `src/engine/index.ts`

**Interfaces:**
- Consumes: `UNITS`, `PEERS`, `ALL`, `conflicts`, `Rng`.
- Produces:
  ```ts
  export interface NodeCounter { nodes: number }
  export function countSolutions(board: Uint8Array, limit?: number, counter?: NodeCounter): number; // limit defaults to 2; 0 for boards with conflicts
  export function solve(board: Uint8Array, rng?: Rng, counter?: NodeCounter): Uint8Array | null;    // randomised value order when rng is given
  ```
  Constraint propagation (singles) plus depth-first search choosing the cell with the fewest candidates. `counter.nodes` increments once per search node.

- [ ] **Step 1: Write the failing tests.**
  - `solves the classic puzzle uniquely`: `530070000600195000098000060800060003400803001700020006060000280000419005000080079` has `countSolutions` 1 and `solve` equal to `534678912672195348198342567859761423426853791713924856961537284287419635345286179`.
  - `an empty board has at least two solutions`: `countSolutions(empty, 2)` is `2`; `countSolutions(empty, 1)` is `1`.
  - `a conflicting board has zero solutions`: two 5s in a row → `0`, and `counter.nodes` stays under 10.
  - `solves the 2012 "hardest" puzzle`: `800000000003600000070090200050007000000045700000100030001000068008500010090000400` has `countSolutions` 1; `solve` returns a board with no conflicts, no empty cells, and every given preserved; `counter.nodes` is under 1,000,000.
  - `solve is deterministic for a given seed and differs across seeds on an empty board` (using `createRng`).
  - `counter increments and the limit is respected`.
  - `an unsolvable but conflict-free board returns null` (a board whose only empty cell has no candidate).

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/engine/solver.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement** the solver (bit-mask candidates, naked and hidden singles propagation, minimum-remaining-values branching; randomised digit order only when `rng` is passed). Run the tests. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine
git commit -m "feat(engine): add a counting solver with a deterministic node counter"
```

### Task 14: Candidates, singles and the grader

**Files:**
- Create: `src/engine/candidates.ts`, `src/engine/techniques/{index,weights,singles}.ts`, `src/engine/grader.ts`, `src/engine/grader.test.ts`, `src/engine/singles.test.ts`, `src/engine/testing/{dig,sound}.ts`, `src/engine/testing/dig.test.ts`
- Modify: `src/engine/index.ts`, spec Appendix B sentence about weights

**Interfaces:**
- Consumes: `UNITS`, `PEERS`, `ALL`, `TechniqueId`, `TECHNIQUE_LADDER`, `countSolutions`, `solve`, `createRng`.
- Produces:
  ```ts
  // candidates.ts
  export interface Region { kind: 'row' | 'col' | 'box'; index: number }
  export interface Step { technique: TechniqueId; placements: readonly { cell: number; digit: number }[]; eliminations: readonly { cell: number; digit: number }[]; cells: readonly number[]; digits: readonly number[]; regions: readonly Region[] }
  export interface CandidateState { values: Uint8Array; cands: Uint16Array }   // cands[i]: 9-bit mask (bit d-1) for empty cells, 0 for filled
  export function initCandidates(board: Uint8Array): CandidateState;           // throws RangeError when the board has conflicts
  export function applyStep(state: CandidateState, step: Step): void;          // placements (clearing peers' candidates) then eliminations
  // techniques/index.ts
  export type Finder = (state: CandidateState) => Step | null;                 // first step in scan order: units ascending, then digits ascending
  export const FINDERS: Readonly<Partial<Record<TechniqueId, Finder>>>;        // later tasks register more
  // techniques/weights.ts
  export const TECHNIQUE_WEIGHTS: Readonly<Record<TechniqueId, number>>;
  // grader.ts
  export interface GradeResult { solvable: boolean; hardest: TechniqueId | null; rating: number; steps: Step[] }
  export function grade(board: Uint8Array, options?: { maxTechnique?: TechniqueId }): GradeResult;
  // testing/dig.ts, testing/sound.ts
  export function digPuzzle(seed: string, targetClues: number): { givens: Uint8Array; solution: Uint8Array };   // seeded full grid, then removals that keep the solution unique, down to targetClues
  export function assertSound(step: Step, solution: Uint8Array): void;           // placements equal the solution; eliminations never remove a solution digit
  ```
- Initial weights (tuned in Task 20): naked-single 1, hidden-single 2, naked-pair 6, hidden-pair 8, pointing 7, box-line 8, naked-triple 12, hidden-triple 16, x-wing 20, xy-wing 24, swordfish 30.
- `grade` behaviour: after `initCandidates`, repeatedly try the finders in rung order up to `maxTechnique`; on the first step found, record it, apply it, and restart from rung 1. Stop when the board is full (`solvable: true`), no technique applies, or a cell has no candidates (`solvable: false`). `hardest` is the highest rung used (`null` if no steps). `rating = Σ weight × count`.

- [ ] **Step 1: Write the failing tests.**
  - `dig.test.ts`: `digPuzzle is deterministic and unique` (same seed gives identical output; `countSolutions` is 1; clue count equals `targetClues` or the minimum reachable, never below it).
  - `singles.test.ts`: `naked-single finds a cell with one candidate`; `hidden-single finds a digit with one cell in a unit`; `every single step is sound` over `digPuzzle('s'+i, 34)` for i in 0..199 using `assertSound`.
  - `grader.test.ts`: `grades the classic puzzle with singles only` (`solvable` true, `hardest` is `'naked-single'` or `'hidden-single'`, applying every step reproduces the literal solution from Task 13); `an empty board is not solvable and has no steps`; `maxTechnique limits the ladder` (a puzzle needing a hidden single is `solvable: false` with `maxTechnique: 'naked-single'`); `rating equals the weighted step count`; `a board with conflicts throws RangeError`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/engine`
  Expected: FAIL.

- [ ] **Step 3: Implement** the modules to the interfaces and behaviour above, register the two singles finders, and export `grade` and the types. Run the tests. Expected: PASS.

- [ ] **Step 4: Amend spec Appendix B** to say technique weights live in `src/engine/techniques/weights.ts`, and `src/game/levels.ts` holds windows and budgets. Commit.

```bash
git add -A
git commit -m "feat(engine): add candidate state, the singles techniques and the grader"
```

### Technique task pattern (Tasks 15–17)

Each technique task follows this pattern. The per-task table only names the techniques.

1. **Tests first**, in `src/engine/<family>.test.ts`:
   - `<technique> steps are sound`: for `digPuzzle('t'+i, 26)` with i in 0..199, run `grade(board, { maxTechnique: <technique> })` and call `assertSound` on every step whose technique is the one under test.
   - `fixtures need <technique>`: for every string in `src/engine/testing/fixtures/technique-puzzles.json[<technique>]` (at least 3), `grade(parseBoard(s), { maxTechnique: <technique> })` is solvable with `hardest === <technique>`, and `countSolutions(parseBoard(s))` is 1.
   - `step shape`: a found step has non-empty `eliminations` (or `placements` for singles), `cells` and `digits` consistent with its definition, and applying it never empties a cell's candidates on a solvable puzzle.
2. Run to confirm failure (`pnpm test -- src/engine/<family>.test.ts`).
3. Implement the finders in `src/engine/techniques/<family>.ts` and register them in `FINDERS` (`Finder` signature from Task 14).
4. Mine the fixtures: `node scripts/mine-technique-puzzles.ts --technique <id> --count 3 --max-seeds 20000`. The script (created in Task 15) digs minimal puzzles from seeds `mine-<n>` and keeps those where `grade(p, { maxTechnique: id })` is solvable with `hardest === id`, appending to `technique-puzzles.json`. If fewer than 3 are found within the seed limit, keep what was found (at least 1), record the count in `docs/engine-audit.md`, and make the fixture test use however many exist.
5. Run `pnpm test -- src/engine && pnpm check:fast`; expected PASS; commit.

### Task 15: Subset techniques

**Files:**
- Create: `src/engine/techniques/subsets.ts`, `src/engine/subsets.test.ts`, `scripts/mine-technique-puzzles.ts`, `scripts/mine-technique-puzzles.test.ts`, `src/engine/testing/fixtures/technique-puzzles.json`
- Modify: `src/engine/techniques/index.ts`

**Interfaces:**
- Consumes: `Finder`, `CandidateState`, `Step`, `UNITS`.
- Produces: finders for `naked-pair`, `hidden-pair`, `naked-triple`, `hidden-triple`; the miner CLI; `mineFor(technique: TechniqueId, count: number, maxSeeds: number): string[]` exported from the script for its own test.

| Technique | Definition | Step fields |
|---|---|---|
| naked-pair | Two cells in a unit with identical two-candidate masks | eliminate those two digits from the unit's other cells; `cells` the pair, `digits` the two digits, `regions` the unit |
| hidden-pair | Two digits that occur only in the same two cells of a unit | eliminate every other candidate from those two cells |
| naked-triple | Three cells in a unit whose combined candidates are exactly three digits (each cell holds two or three of them) | eliminate those digits from the unit's other cells |
| hidden-triple | Three digits confined to the same three cells of a unit | eliminate every other candidate from those three cells |

- [ ] **Steps:** follow the technique task pattern. The miner's own test `mineFor('naked-pair', 1, 20000)` returns one board string that satisfies the fixture assertions. Commit: `feat(engine): add pair and triple subset techniques with mined fixtures`.

### Task 16: Intersection techniques

**Files:**
- Create: `src/engine/techniques/intersections.ts`, `src/engine/intersections.test.ts`
- Modify: `src/engine/techniques/index.ts`, `src/engine/testing/fixtures/technique-puzzles.json`

**Interfaces:**
- Produces finders for `pointing` and `box-line`.

| Technique | Definition | Step fields |
|---|---|---|
| pointing | A digit's candidates within a box all lie in one row or column | eliminate the digit from that line's cells outside the box; `regions` is `[box, line]` |
| box-line | A digit's candidates within a row or column all lie in one box | eliminate the digit from that box's cells outside the line; `regions` is `[line, box]` |

- [ ] **Steps:** follow the technique task pattern. Commit: `feat(engine): add the pointing and box-line techniques`.

### Task 17: Fish and wings

**Files:**
- Create: `src/engine/techniques/fish.ts`, `src/engine/techniques/wings.ts`, `src/engine/fishwings.test.ts`
- Modify: `src/engine/techniques/index.ts`, `src/engine/testing/fixtures/technique-puzzles.json`

**Interfaces:**
- Produces finders for `x-wing`, `swordfish`, `xy-wing`.

| Technique | Definition | Step fields |
|---|---|---|
| x-wing | A digit has exactly two candidate cells in each of two rows, and they share the same two columns (or the same with rows and columns swapped) | eliminate the digit from the other cells of those two columns (or rows) |
| swordfish | The same pattern across three rows (or columns) whose candidate cells cover exactly three columns (or rows) | eliminate from the other cells of those three lines |
| xy-wing | A pivot cell with candidates {x, y}, and two pincer cells that each see the pivot, with candidates {x, z} and {y, z} | eliminate z from every cell that sees both pincers |

- [ ] **Steps:** follow the technique task pattern. Commit: `feat(engine): add x-wing, swordfish and xy-wing`.

### Task 18: Hints

**Files:**
- Create: `src/engine/hints.ts`, `src/engine/hints.test.ts`
- Modify: `src/engine/index.ts`

**Interfaces:**
- Consumes: `initCandidates`, `FINDERS`, `TECHNIQUE_LADDER`, `grade`, `Step`.
- Produces:
  ```ts
  export type Hint = { kind: 'wrong-digit'; cell: number } | { kind: 'step'; step: Step } | { kind: 'none' };
  export function nextHint(board: Uint8Array, solution: Uint8Array): Hint;
  ```
  Behaviour: if any non-empty cell differs from the solution, return `wrong-digit` for the lowest such cell. Otherwise compute candidates from the board's *values only* (the player's notes never enter), and return the easiest applicable step over the full ladder. Return `none` for a solved or stuck board.

- [ ] **Step 1: Write the failing tests.**
  - `points at the first wrong digit`: a board with digits wrong at cells 10 and 40 → `{ kind: 'wrong-digit', cell: 10 }`.
  - `returns the same first step the grader finds`: on `digPuzzle('h'+i, 30)` for i in 0..49, `nextHint` equals `{ kind: 'step', step: grade(board).steps[0] }`.
  - `hint steps are sound` over the same seeds with `assertSound`.
  - `a solved board returns none`; `a stuck board returns none` (empty board).
  - `ignores everything but the values` (the same values with extra scratch data cannot change the result; assert via determinism across repeated calls).

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/engine/hints.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement `nextHint`** and export it. Run the tests. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/engine
git commit -m "feat(engine): add technique-aware hints"
```

### Task 19: Generator

**Files:**
- Create: `src/engine/generator.ts`, `src/engine/generator.test.ts`
- Modify: `src/engine/index.ts`, spec §5.3 generator wording

**Interfaces:**
- Consumes: `createRng`, `solve`, `countSolutions`, `grade`, `tierOfTechnique`, `rungOf`, `Puzzle`, `Tier`, `GenerationBudgetExceeded`, `NodeCounter`.
- Produces:
  ```ts
  export interface WorkBudget { maxCandidates: number; maxNodes: number }
  export interface GenerateOptions { seed: string; tier: Tier; ratingWindow?: readonly [number, number]; workBudget?: WorkBudget }
  export const GENERATOR_VERSION = 1;
  export const DEFAULT_WORK_BUDGET: Readonly<Record<Tier, WorkBudget>>;   // generous initial values; Task 20 tunes them
  export function generatePuzzle(opts: GenerateOptions): Puzzle;
  ```
- Algorithm: for candidate `k = 0, 1, …` while `k < maxCandidates` and the solver's node total is below `maxNodes`, derive an RNG from seed `` `${seed}#${k}` ``.
  1. Build a complete grid with `solve(empty, rng)`.
  2. Visit all 81 cells in `rng.shuffle` order. Remove a cell's digit only if `countSolutions(…, 2) === 1`, the puzzle stays solvable by `grade`, and its hardest technique stays within the target tier (never above its highest rung). If a rating window is given, also refuse a removal that pushes the rating above the window's upper bound.
  3. A candidate qualifies if `tierOfTechnique(hardest) === tier`. Its score is its distance to the rating window (0 if inside or no window was given).
  The result is the qualifying candidate with the lowest score (ties go to the earliest `k`). The loop stops early on a score of 0. If no candidate qualified within the budget, throw `GenerationBudgetExceeded`. The returned `Puzzle` has `rating = grade(givens).rating` and `generatorVersion: GENERATOR_VERSION`.

- [ ] **Step 1: Write the failing tests.**
  - `is deterministic and independent of the clock`: same options give an identical `Puzzle`; the result is also identical while `Date.now` is stubbed to two different values.
  - `yields exactly one solution` (fast-check, 25 seeds × each tier): `countSolutions(givens) === 1`, `solution` is complete and consistent with `givens`, both strings have length 81.
  - `lands in the requested tier`: `tierOfTechnique(grade(givens).hardest) === tier` and `grade(givens).solvable` for the same samples.
  - `a tiny budget throws instead of returning an off-tier puzzle`: `generatePuzzle({ seed: 'x', tier: 'expert', workBudget: { maxCandidates: 1, maxNodes: 1 } })` throws `GenerationBudgetExceeded`.
  - `a small budget still serves the easy tier`: `{ maxCandidates: 1, maxNodes: 5_000_000 }` returns a valid easy puzzle.
  - `respects a rating window when one is reachable`: for an easy puzzle P generated without a window, regenerating with `ratingWindow: [P.rating, P.rating]` and the same seed returns a puzzle with `rating === P.rating`.
  - `records the generator version`.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/engine/generator.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement `generatePuzzle`** to the algorithm above, with generous `DEFAULT_WORK_BUDGET` values (for example 400 candidates and 50,000,000 nodes for expert). Run the tests. Expected: PASS.

- [ ] **Step 4: Amend spec §5.3** to say the generator throws `GenerationBudgetExceeded` when no in-tier candidate exists within the budget, with default budgets tuned (Task 20) so it never happens across the audit seeds. Commit.

```bash
git add -A
git commit -m "feat(engine): add the deterministic work-budgeted puzzle generator"
```

### Task 20: Levels, the audit script and tuning

**Files:**
- Create: `src/game/levels.ts`, `src/game/levels.test.ts`, `scripts/audit-puzzles.ts`, `scripts/audit-puzzles.test.ts`, `docs/engine-audit.md`, `.claude/skills/tune-difficulty/SKILL.md`, `.claude/agents/puzzle-auditor.md`
- Modify: `src/engine/techniques/weights.ts`, `src/engine/generator.ts` (`DEFAULT_WORK_BUDGET`), `package.json` (`audit:puzzles`), `scripts/claude-config.test.ts` (agent frontmatter check)

**Interfaces:**
- Consumes: `generatePuzzle`, `grade`, `Tier`, `WorkBudget`.
- Produces:
  ```ts
  // src/game/levels.ts
  export function levelToTier(level: number): Tier;                              // 1-10 easy, 11-25 medium, 26-50 hard, 51+ expert; RangeError for non-integers and < 1
  export const TIER_RATING_RANGE: Readonly<Record<Tier, readonly [number, number]>>;
  export const WINDOW_WIDTH: Readonly<Record<Tier, number>>;
  export function ratingWindowFor(level: number): readonly [number, number];
  export const WORK_BUDGET: Readonly<Record<Tier, WorkBudget>>;
  // scripts/audit-puzzles.ts
  export function percentile(sorted: readonly number[], p: number): number;     // nearest-rank, p in [0, 100]
  export function summarize(values: readonly number[]): { min: number; p5: number; p50: number; p95: number; p99: number; max: number };
  // CLI: node scripts/audit-puzzles.ts --tier <tier|all> --seeds <n>
  ```
- Window rule: a tier's band is easy [1, 10], medium [11, 25], hard [26, 50], expert [51, 100]. Progress `p = clamp((level − bandStart) / (bandEnd − bandStart), 0, 1)`. With `[r0, r1] = TIER_RATING_RANGE[tier]` and `w = WINDOW_WIDTH[tier]`, the window is `[round(r0 + p·(r1 − r0 − w)), round(r0 + p·(r1 − r0 − w)) + w]`. From level 100 onward expert stays at its top window.

- [ ] **Step 1: Write the failing tests.**
  - `levels.test.ts`: `levelToTier` at 1, 10, 11, 25, 26, 50, 51, 100, 1000; throws `RangeError` for 0, −1, 1.5, `NaN`; `ratingWindowFor` is non-decreasing in level within each band; each window lies inside `TIER_RATING_RANGE[tier]`; levels 100 and 5000 give identical windows; every window has width `WINDOW_WIDTH[tier]`.
  - `audit-puzzles.test.ts`: `percentile([1,2,3,4,5], 50)` is `3`; `percentile` of one value is that value; `summarize` returns `min` and `max` of its input.

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/game scripts/audit-puzzles.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implement `levels.ts` and the audit script.** The script generates puzzles for seeds `audit-<i>` using the default budgets and reports, per tier: failures (thrown budget errors), rating `summarize`, clue-count `summarize`, time per puzzle `summarize` (it may use `performance.now()`, since it is not engine code), and a technique-usage distribution. The rating-range, window-width and budget constants in `levels.ts` are set from the first audit run (Step 4), not guessed.

- [ ] **Step 4: Run the audit and set the constants.** Run `node scripts/audit-puzzles.ts --tier all --seeds 1000` (in the background, polling its output). Then:
  - Set `TIER_RATING_RANGE[tier]` to the observed `[p5, p95]` ratings.
  - Set `WINDOW_WIDTH[tier]` to one quarter of that range, rounded up.
  - Set `WORK_BUDGET` and `DEFAULT_WORK_BUDGET` so the audit shows zero failures across the 1,000 seeds per tier.
  - Retune `TECHNIQUE_WEIGHTS` only if a tier's rating range is degenerate (for example `p5 === p95`).
  - Rerun the audit and confirm zero failures.

- [ ] **Step 5: Record the evidence** in `docs/engine-audit.md`: a table per tier (failures, rating, clue and time summaries) against the spec targets (p95 under 100 ms for Easy and Medium, under 400 ms for Hard and Expert). If a tier misses its target, record the gap. **If Expert cannot reach zero failures within a reasonable budget, stop and report the data to the owner:** that is a ladder decision, not a tuning one.

- [ ] **Step 6: Add the audit tooling for Claude.** `tune-difficulty` (frontmatter `name`, `description`): run `pnpm audit:puzzles`, read the histograms, adjust `levels.ts` and the weights, rerun until zero failures. `puzzle-auditor` (frontmatter `name`, `description`, `tools: Read, Grep, Glob, Bash`): a read-only subagent that runs the audit and returns a short report. Extend `scripts/claude-config.test.ts` with `agents have valid frontmatter` (each has `name`, `description` and a `tools` entry).

- [ ] **Step 7: Run the checks and commit**

```bash
pnpm test && pnpm check:fast
git add -A
git commit -m "feat(game): add level tiers and rating windows, tuned from the puzzle audit"
```

### Task 21: Starter pool, golden daily puzzles and cross-engine determinism

**Files:**
- Create: `src/game/daily.ts`, `src/game/daily.test.ts`, `scripts/gen-starter-pool.ts`, `scripts/gen-starter-pool.test.ts`, `src/content/starter-pool.json`, `src/content/starter-pool.ts`, `src/content/starter-pool.test.ts`, `scripts/gen-golden-daily.ts`, `src/engine/golden/daily.json`, `src/engine/golden/daily.test.ts`, `e2e/global-setup.ts`, `e2e/engine-entry.ts`, `e2e/determinism.spec.ts`, `docs/engine-tour.md`
- Modify: `playwright.config.ts` (global setup), spec §6.8 note on stored strings

**Interfaces:**
- Consumes: `generatePuzzle`, `dailySeed`, `Tier`, `Puzzle`, `WORK_BUDGET`, `parseBoard`, `countSolutions`, `grade`, `tierOfTechnique`.
- Produces:
  ```ts
  // src/game/daily.ts
  export function dailyTier(isoDate: string): Tier;                  // Mon-Tue easy, Wed-Thu medium, Fri-Sat hard, Sun expert (integer weekday arithmetic, no Date)
  // src/content/starter-pool.ts
  export function starterPool(tier: Tier): readonly Puzzle[];        // 40 puzzles per tier
  // scripts/gen-starter-pool.ts
  export function starterSeed(tier: Tier, index: number): string;    // `starter/${tier}/${index}`
  // src/engine/golden/daily.json
  // [{ date: 'YYYY-MM-DD', tier: Tier, givens: string }] for 60 consecutive dates from 2026-11-01
  ```

- [ ] **Step 1: Write the failing tests.**
  - `daily.test.ts`: `dailyTier('2026-10-26')` is `easy` (Monday); `'2026-10-27'` easy; `'2026-10-28'` medium; `'2026-10-29'` medium; `'2026-10-30'` hard; `'2026-10-31'` hard; `'2026-11-01'` expert (Sunday); leap-day `'2028-02-29'` works; invalid strings throw.
  - `gen-starter-pool.test.ts`: `starterSeed('hard', 7)` is `'starter/hard/7'`.
  - `starter-pool.test.ts`: `has 40 puzzles per tier`; every puzzle is unique-solution (`countSolutions(givens) === 1`), consistent with its solution, and in its tier by `grade`; puzzle seeds equal `starterSeed(tier, i)`.
  - `golden/daily.test.ts`: `matches the frozen sequence`: for each entry, `generatePuzzle({ seed: dailySeed(date), tier: dailyTier(date), workBudget: WORK_BUDGET[tier] }).givens === entry.givens`, `entry.tier === dailyTier(entry.date)`, and there are exactly 60 consecutive dates from `2026-11-01`.
  - `e2e/determinism.spec.ts`: `daily puzzles are identical in this browser`: in the page, call the bundled engine for all 60 golden dates and assert each `givens` equals the golden file. It runs in every Playwright project (Chromium locally; Chromium, Firefox and WebKit in CI).

- [ ] **Step 2: Run to confirm failure.** `pnpm test -- src/game src/content src/engine/golden scripts`
  Expected: FAIL.

- [ ] **Step 3: Implement** `daily.ts`, the two generator scripts, the data files, and the e2e plumbing. `e2e/global-setup.ts` builds `e2e/engine-entry.ts` (which assigns `generatePuzzle`, `dailySeed` and the types' runtime parts to `window.cosmicEngine`) into an IIFE with Vite's `build()` API at `e2e/.tmp/engine.iife.js`; the spec loads it with `page.addScriptTag`. Generate the starter pool and golden files by running the two scripts, then commit their output as data.

- [ ] **Step 4: Run everything.** `pnpm test && pnpm e2e && pnpm check:fast`
  Expected: PASS. SC3 and SC4 (Node and Chromium) are now met.

- [ ] **Step 5: Write `docs/engine-tour.md`**, a learner-friendly guided tour in this order: what a Sudoku solver does; how the RNG makes puzzles reproducible; how the grader thinks (techniques, rungs, rating); why puzzles have exactly one solution; how the generator digs and stays deterministic; how hints reuse the grader. Link each section to the file that implements it. Amend spec §6.8 to say the golden file stores the full `givens` strings. Add `audit:puzzles` to `package.json` if not already there.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add the starter pool, golden daily puzzles, cross-engine determinism test and engine tour"
```

### Task 22: Close out Plan A

**Files:**
- Modify: `docs/phase0-findings.md`, `docs/engine-audit.md`

- [ ] **Step 1: Run the full gate.** `pnpm check`
  Expected: PASS (lint, typecheck, knip, unit tests with coverage thresholds, build, bundle budget, e2e).

- [ ] **Step 2: Verify the exit criteria** and record them in the findings doc:
  - SC3: the audit shows zero failures across 1,000 seeds per tier and every puzzle uniquely solvable and in tier.
  - SC4: the 60 golden dates match in Chromium (and Firefox and WebKit once CI runs them).
  - Engine and game coverage meet the thresholds.

- [ ] **Step 3: Push, open PR-2 (draft), drive CI to green** as in Task 10 Step 2, and subscribe to its activity.

- [ ] **Step 4: Report to the owner** with the audit numbers and any missed timing target, and say Plan B (game, persistence, UI) is next.

- [ ] **Step 5: Commit** any final documentation updates.

```bash
git add docs
git commit -m "docs: record plan A exit criteria and engine audit results"
```

**Exit criteria (spec phase 2):** SC3 and SC4 (Node) met; timing targets recorded.

---

## Self-review notes (completed before handing over)

- **Spec coverage:** phase 0 → Tasks 1–2; phase 1 → Tasks 3–10 (scaffold, shell, Android, signing, CI/deploy, Claude layer, shipping); phase 2 → Tasks 11–22 (RNG, grid, solver, grader and techniques, hints, generator, levels and tuning, starter pool, golden dailies, determinism). Spec §12 items map per the coverage table; items deferred to later plans are named there.
- **Type consistency:** `Step`, `CandidateState`, `Finder`, `FINDERS`, `GradeResult`, `WorkBudget`, `GenerateOptions`, `Puzzle`, `Tier`, `TechniqueId` are defined once (Tasks 11, 14, 19) and consumed unchanged afterwards.
- **Proportion:** the plan states interfaces, tests and decisions; bodies appear only for the RNG, whose exact algorithm is the determinism contract.
