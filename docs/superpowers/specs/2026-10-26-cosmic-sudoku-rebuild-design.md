# Cosmic Sudoku 2.0 — Rebuild Design

| | |
|---|---|
| **Date** | 2026-10-26 |
| **Status** | Draft rev 2 — awaiting owner review |
| **Revision** | Rev 2 (2026-10-26): the deliverable is now a signed, sideloadable **Android APK** built with Capacitor, requested by the owner after rev 1. Sections 2, 3, 5, 7–12 and Appendices D–E changed. Rev 2.1: two automated-review findings fixed (signing-secret isolation from PR builds; a deterministic, work-count generator budget). |
| **Branch** | `ccr-f3b683c3-r6qbqy` |
| **Approach** | **B — engine-first rebuild, port the soul**, packaged for Android with **Capacitor** |

## 1. Summary

Cosmic Sudoku is a much-loved, vibe-coded game (React 18 + Vite 5 + Tailwind 3 + a shadcn template; about 2,000 lines of real game code). Several of its rules do not work, and the repo has no tests, no working deploy and no Claude Code setup.

This spec rebuilds the foundation as a modern (2026), fully tested, offline-first app, delivered as a signed **Android APK** (Capacitor wraps the web build). The same build is also published as a web app and PWA. It keeps everything that makes the game *this* game: the cosmic glass look, Cosmos the mascot, the stardust economy, power-ups, achievements, themes and infinite levels. It adds five features (notes, undo/redo, teaching hints, a daily puzzle, stats and history) and sets the repository up so Claude Code can keep evolving it safely.

Implementation has not started. Nothing in `src/` has been changed.

## 2. Goals, non-goals, success criteria

### Goals

1. **Correct by construction.** Every defect in §4 is fixed and pinned by a regression test.
2. **Preserve the soul.** Look, mascot, economy, content and naming stay, and existing player progress migrates.
3. **New features.** Notes, undo/redo, teaching hints, daily puzzle, stats and history.
4. **Modern and minimal.** A 2026 stack, and only dependencies that earn their place.
5. **Claude Code–native.** `CLAUDE.md`, path-scoped rules, hooks, skills, a subagent and CI that let Claude work safely.
6. **Offline, accessible, fast** on low-end phones.
7. **A fully functional Android APK**: signed with a stable key, installable by sideloading, working entirely offline, and built and released by CI.

### Non-goals

- Backend, accounts, cloud sync or leaderboards. Daily puzzle and stats are local to each device.
- AI features inside the game.
- A React Native/Expo rewrite, or iOS. Capacitor wraps the web build, and the framework-free engine stays portable if that is ever wanted.
- A Google Play listing. The owner chose sideloading. Signing and versioning do not preclude an AAB later.
- Push or local notifications.
- i18n. User-facing strings are centralised in `content/` to make it possible later.
- Sound. Light haptics are included on Android as a setting.
- Other grid sizes or Sudoku variants.
- A light mode. The game is dark-only by design.
- Resolving concurrent play in two tabs. The last write wins.

### Success criteria (checkable)

| # | Criterion |
|---|---|
| SC1 | The signed APK installs on Android 7+ (API 24+), and a full puzzle is playable offline with no scrolling at 390×844. The web build installs as a PWA. |
| SC2 | `pnpm check` passes in CI. `engine/` and `game/` have ≥95% line and ≥90% branch coverage. |
| SC3 | Property tests show every generated puzzle has exactly one solution and is solvable by its tier's techniques: 200 seeds per tier in CI, 1,000 per tier via `audit:puzzles`. |
| SC4 | The Daily puzzle for 60 golden dates is identical in Chromium, Firefox and WebKit. |
| SC5 | A v1 save fixture imports with stardust, level, stats, achievements, themes and power-ups preserved. |
| SC6 | axe finds zero serious or critical violations on every screen × 4 themes. All token colour pairs pass WCAG 2.2 AA contrast. |
| SC7 | Pages deploys from `main`. An e2e test asserts zero third-party network requests. |
| SC8 | A fresh Claude Code cloud session runs `pnpm check` with no manual steps after the SessionStart hook. `CLAUDE.md` is under 200 lines. |
| SC9 | Initial JS is ≤150 kB gzip, enforced as a build budget (re-measured in phase 1). |
| SC10 | The release APK is ≤12 MB (re-measured in phase 1), requests no `INTERNET` permission if phase 0 confirms the app works without it, and installs over the previous version (stable signature). |
| SC11 | Dispatching the release workflow produces a signed APK and a SHA-256 checksum on a GitHub Release. |
| SC12 | An emulator smoke test in CI installs the APK, launches it, reaches the ready marker, force-stops it, and relaunches into the resumed puzzle. |

Performance targets to validate in phase 2 and adjust with evidence: puzzle generation p95 under 100 ms for Easy and Medium, and under 400 ms for Hard and Expert, inside the worker. A bundled starter pool covers the rest.

## 3. Decisions so far

| Decision | Choice | Source |
|---|---|---|
| What "Claude Code app" means | Built for Claude Code. The game is fully offline: no servers, API keys or running costs. | Owner chose |
| Approach | **B**, engine-first rebuild porting the soul | Proposed with "proceeding with B unless you say otherwise"; not contested |
| New features | Notes and undo/redo; hints that teach; Daily Cosmic puzzle; stats and history | Owner chose all four |
| Design sections 1–4 | Architecture; rules and features; experience; quality, Claude Code layer and rollout | Approved in chat |
| Platform | **Android APK** (Capacitor wrapper around the web build). The web/PWA build on GitHub Pages stays as a by-product. | Owner asked for "a fully functional .apk" after rev 1, correcting the PWA-only assumption |
| APK approach | Capacitor 8, not Expo/React Native and not a Trusted Web Activity | Proposed with "going with 1 unless you say otherwise"; not contested |
| Distribution | Sideloaded by the owner from GitHub Releases. No Google Play listing. | Owner chose |
| SteerCode pieces | The injected script, `steercode-tagger`, `nixpacks.toml` and the e2b allowed hosts are removed | Assumption, not contested |
| Defaults offered for overruling | Instant wrong-digit flagging; 25-point mistake cost; 10-entry abandon rule; weekday-ramped dailies; undo never refunds | Not overruled |

### Items for the owner to confirm (non-blocking, defaults apply)

| Item | Default |
|---|---|
| License | The README claims MIT but no `LICENSE` file exists. Add MIT with holder "TheHizzleGizzle". |
| Custom font | Yes: one self-hosted rounded variable font (Nunito, OFL, latin subset) with tabular digits. |
| React Compiler | Off. The UI is tiny. Revisit with measurements. |
| `@claude` GitHub Action | Included but inert until the owner installs the Claude GitHub App and adds a secret. |
| GitHub Pages source | Must be "GitHub Actions" in repository settings (for the web build). Only the owner can set it. |
| Android app id | `io.github.thehizzlegizzle.cosmicsudoku`. It is permanent once installed: changing it later creates a different app. |
| Signing passphrase | The owner creates a GitHub environment `android-release` (deployment branches and tags limited to `main` and `v*`), adds one environment secret, `ANDROID_SIGNING_PASSPHRASE` (a long random string kept in a password manager), and runs the key-creation workflow once (Appendix E). |
| In-session APK builds (optional) | The cloud environment blocks `dl.google.com`, which hosts the Android SDK, so CI builds the APK. To also build inside Claude sessions, the owner allows that host in the environment's Network access (§12 item 15). |

## 4. Current-state audit

Findings come from reading the full codebase. No build was run (installing dependencies is deferred to phase 0). Each defect gets a regression test, named in the last column, written **before** the fix.

### 4.1 What stays (the soul)

The cosmic glass look (deep-space gradient, translucent "bubble" tiles, twinkling stars, glow), Cosmos and his lines, stardust, the four power-ups, the six achievements, the four themes and their prices, level bands (Easy 1–10, Medium 11–25, Hard 26–50, Expert 51+), the celebration, keyboard play, and the mobile-first instinct.

### 4.2 Gameplay defects

| ID | Defect | Regression test |
|---|---|---|
| D1 | Puzzles are made by deleting random cells with no solver, so they are not guaranteed to have one solution. 25-clue "Expert" is almost certainly ambiguous, and the game never knows the correct answer. | `generator yields exactly one solution` (property) |
| D2 | Cosmic Reveal cannot reveal the true digit, because no solution is stored. It places a random non-conflicting digit, which can make the puzzle unwinnable. | `reveal places the solution digit` |
| D3 | `nextLevel()` generates the puzzle from the old level through a stale closure, so level 11 reads "Medium" but plays Easy. Every page load starts an Easy puzzle regardless of level. | `next level uses the new level's tier`; `resume restores puzzle and level` |
| D4 | A cell's conflict flag is recomputed only when that cell is edited. Fixing the other cell leaves a stale red cell, and completion needs every flag clear, so the puzzle can become impossible to finish. | `conflicts are recomputed from the whole board` |
| D5 | Error Shield reads a stale `errorShieldActive` and often misses the first mistake. | `shield absorbs the very next mistake` |
| D6 | Power-up charges are decremented before validation, so a failed Hint with no cell selected still costs a charge. A second, unconditional "activated" toast also fires. | `failed power-up leaves inventory unchanged` |
| D7 | Time Freeze freezes only the displayed timer. The scoring clock keeps running. | `freeze stops the scoring clock` |
| D8 | The celebration modal cannot be dismissed (an effect re-opens it immediately) and shows a re-derived score that differs from the credited score. | e2e `win dialog can be dismissed`; `dialog shows the credited result` |
| D9 | There is no way to lose or abandon, so win rate is permanently 100% and streaks never reset. | `abandon after the grace threshold counts as a loss and resets the streak` |
| D10 | The in-progress board is not saved, so a refresh loses it. | `autosave resumes the in-progress board` (+ e2e reload) |
| D11 | Unguarded `JSON.parse` on load means one corrupt value white-screens the app. | `corrupt save is quarantined and the app boots` |
| D12 | Saves persist whole definitions, so new achievements, themes or power-ups never reach existing players. `unlockedAt` round-trips as a string typed as `Date`. | `saves hold ids only`; `new content appears for existing saves` |
| D13 | "Rising Star" (reach level 10) unlocks only on *finishing* level 10. | `reaching level 10 unlocks Rising Star` |
| D14 | **Root cause of D2–D7:** all rules live in one 400-line hook that fires side effects inside `setState` updaters and relies on stale closures. This is latent double-counting under StrictMode. | Addressed structurally (§5) |
| D15 | Cosmos picks lines with random rolls on every render. | `cosmos lines derive from events` |

### 4.3 Foundation defects

| ID | Defect |
|---|---|
| F1 | Deploy cannot work as configured. `static.yml` and `jekyll-gh-pages.yml` are invalid YAML (pasted action snippets with empty inputs). `staticx.yml` uploads the repo root unbuilt, so `index.html` points at `/src/main.tsx`. All three share one concurrency group and trigger on every push to `main`. |
| F2 | A third-party script from `steercode.web.app` loads on every page view. |
| F3 | Dead weight: 40 of 46 shadcn files are unused. About 15 libraries are never used (Supabase, Framer Motion, `motion`, Recharts, Zod, react-hook-form, date-fns, vaul, cmdk, embla and others). There are two lockfiles and a template package name (`template-react-vite`). The router and react-query serve a single route and no queries. |
| F4 | The stack is a generation behind: React 18, Vite 5, Tailwind 3, TypeScript 5.7. |
| F5 | The PWA is not installable. The icon is a generic template mark at 180 px only (Chrome wants 192 and 512). There are two competing manifests, a forced portrait lock, and absolute `/` paths that break under a Pages sub-path. |
| F6 | There are no tests and no typecheck in the build. The root tsconfig weakens strictness (`strictNullChecks: false`), and ESLint disables `no-unused-vars` and `no-explicit-any`. |
| F7 | Accessibility: the ARIA grid is incomplete (`role="grid"` without rows and gridcells, `aria-selected` on buttons). No cell is Tab-focusable until one is clicked. Arrow keys do not move real focus. Errors are colour-only. There is no `prefers-reduced-motion` handling. Nebula's purple (used for the given digits) is about 2.6:1 on the board, against 4.5:1 required. `.cosmic-tile:hover` lifts every one of the 81 cells. |
| F8 | On phones the timer, mistakes and power-ups sit at the very bottom of the page, below the Tips and Journey cards. |
| F9 | The README is half boilerplate with unfilled placeholders and `via.placeholder.com` images. It links a LICENSE that does not exist, and its clue-count table does not match the code. |
| F10 | There is no `CLAUDE.md` and no `.claude/`. |
| F11 | `console.log` noise sits in production code paths. |

## 5. Architecture

### 5.1 Layers and the one rule

```
ui/            React, thin: renders state, sends actions, wires the pieces together
 ├─▶ platform/     web and Android adapters: storage, lifecycle, back button, haptics, share
 ├─▶ game/         pure reducers: (state, action) → { state, events }
 │     └─▶ engine/     pure Sudoku: generate · solve · grade · explain
 └─▶ persistence/  versioned, validated saves (knows the shape of game state)
content/       typed data: themes, power-ups, achievements, Cosmos's lines
```

Dependencies point down only.

- `engine/` imports nothing from the other layers. It has no React, DOM, storage, clock or `Math.random`.
- `game/` imports `engine/` and `content/` (it needs prices and definitions at runtime).
- `persistence/` imports `game/` and `content/` types (for state shape and ids). Storage is injected as a `KeyValueStore` interface, so the logic runs headless.
- `content/` is data with no logic.
- `platform/` is the only place that imports Capacitor. It exposes small interfaces (`KeyValueStore`, `Lifecycle`, `Haptics`, `Share`) with a web and an Android implementation, chosen once at startup. `main.tsx` and `ui/` use it. The core never does.
- `ui/` and `worker/` may import everything below them.

**Enforcement is mechanical, not a convention:**

- The **core** projects (`engine`, `game`, `persistence`, `content`) compile under `tsconfig.core.json`, with `lib: ["ES2023"]` and `types: []`. Touching `window`, `document` or `localStorage` there is a type error.
- Biome `noRestrictedImports` overrides per directory ban upward imports and any `react` import in core.

### 5.2 Repository layout

```
cosmic-sudoku/
├─ CLAUDE.md
├─ .claude/            settings.json · rules/ · skills/ · agents/ · hooks/
├─ .github/            workflows/{ci,deploy,release,android-keygen,claude}.yml · dependabot.yml
├─ docs/               engine-tour.md · claude-code.md · adr/ · reference/ · superpowers/{specs,plans}/
├─ e2e/                Playwright specs and snapshots
├─ scripts/            audit-puzzles.ts · gen-starter-pool.ts · check-contrast.ts · gen-icons · android-version.ts
├─ public/             generated icons, robots.txt
├─ android/            Capacitor Android project (committed): manifest, icons, splash, backup rules, signing/ (encrypted key)
├─ capacitor.config.ts
└─ src/
   ├─ engine/          grid · rng · solver · techniques/ · grader · generator · hints · validate
   ├─ game/            state · actions · reduce · scoring · powerups · achievements · profile · levels · store
   ├─ persistence/     schema · migrate · legacy-v1 · storage
   ├─ content/         themes · powerups · achievements · cosmos · techniques
   ├─ worker/          generator.worker.ts · client.ts
   ├─ platform/        storage · lifecycle · haptics · share · webview-guard (web and Android adapters)
   ├─ ui/              App · board/ · pad/ · hud/ · cosmos/ · screens/{Play,Daily,Stats,Shop} · dialogs/ · hooks/ · styles/
   └─ main.tsx
```

Tests are colocated as `*.test.ts`. Scripts run directly under Node 22.18+ type stripping, with `erasableSyntaxOnly` enabled (verified in phase 0).

### 5.3 Engine (`src/engine/`)

**Representation.** A board is a `Uint8Array(81)` (0 is empty), serialised as an 81-character string. Candidates are 9-bit masks in a `Uint16Array(81)`. `UNITS` and `PEERS` are precomputed.

**RNG.** `createRng(seed: string)` hashes the seed to 128 bits, then runs a small integer PRNG (sfc32).
- All arithmetic uses `Math.imul` and `>>> 0`. No floats are involved.
- `nextInt(n)` uses rejection sampling, so it is unbiased.
- `shuffle` is Fisher–Yates.
- This is what makes puzzles identical across devices and engines.

**Solver.** Constraint propagation (singles) plus DFS with minimum-remaining-values. It exposes `solve(board)` and `countSolutions(board, limit)`.

**Generator.** `generatePuzzle({ seed, tier, ratingWindow?, workBudget? }) → Puzzle`.
1. Fill a complete grid via seeded randomised DFS. This replaces today's biased `sort(() => Math.random() - 0.5)`.
2. Remove cells in seeded order, keeping a removal only if `countSolutions === 1`.
3. Grade the result. Accept it if its tier and rating window match. Otherwise continue or restart while the **work budget** lasts.
4. If the budget runs out, return the best in-tier candidate found so far. It is never non-unique and never out of tier.

**Determinism rule.** The work budget counts work (candidate attempts and solver nodes), never elapsed time, and the engine reads no clock. So the same `(seed, tier, ratingWindow, workBudget, generatorVersion)` yields the identical puzzle on every device, however fast. Wall-clock limits exist only in the client (§5.6) and never change the content of a puzzle the generator returns.

A `generatorVersion` constant bumps on any algorithm change.

**Grader.** A human-style solver over candidate masks. Each step it applies the *easiest* applicable technique from the ladder (Appendix B) and records a step `{ technique, cells, digits, regions, eliminations }`.
- `rating = Σ weight(technique) × count`.
- `hardest` is the highest ladder rung used.
- Puzzles that would require guessing are `solvable: false` and rejected by the generator.

**Hints.** `nextHint(board, solution)` finds the easiest logical step from the player's current *values* (not their notes).
- If any entered digit differs from the solution, it returns `{ kind: 'wrong-digit', cell }`.
- Explanations are rendered from templates in `content/techniques.ts`, keyed by technique id, so the engine holds no display strings.

**Validation.** `conflicts(board): Set<number>` is always recomputed from the whole board. `isSolved(board, solution)` is a full comparison.

```ts
type Tier = 'easy' | 'medium' | 'hard' | 'expert';
interface Puzzle {
  seed: string; tier: Tier; rating: number;
  givens: string; solution: string;      // 81 chars, '0' = empty in givens
  generatorVersion: number;
}
```

### 5.4 Game layer (`src/game/`)

A pure reducer: `reduce(state, action): { state, events }`.

- **Game state:** puzzle, cells (`value`, `notes` mask), selection, `mode` (`value` | `notes`), undo/redo history, `mistakes`, `shieldCharges`, `activeMs`, `freezeMsRemaining`, `status` (`playing` | `paused` | `won`), `kind` (`level` | `daily`), `usedPowerUps`, `entries` (digit entries, for the abandon rule), `notesUsedCells`.
- **Actions:** `select`, `move`, `enter`, `erase`, `toggleNotes`, `undo`, `redo`, `usePowerUp`, `hint`, `tick(deltaMs)`, `pause`, `resume`, `newGame`, `abandon`.
- **Events:** `MISTAKE`, `SHIELD_USED`, `CONFLICT`, `CELL_FILLED`, `HINT_SHOWN`, `TECHNIQUE_SEEN`, `POWER_UP_USED`, `PUZZLE_WON`, `PUZZLE_ABANDONED`. Toasts, Cosmos, achievements and autosave subscribe to events. The reducer performs no side effects.
- **Clock:** time is state, advanced only by `tick(deltaMs)`. Ticks are dispatched from the UI using `performance.now()` deltas, clamped to 1,000 ms per tick. They stop while the tab is hidden, a dialog is open, another tab is showing, or the status is not `playing`. Freeze is consumed before `activeMs` accrues, so Time Freeze really stops the scoring clock.
- **Profile reducer** (also pure): stardust, lifetime stats, inventory, themes, achievements, history, daily streak, `techniquesSeen`, settings. Achievement unlocks are pure predicates over `(profile, event)`.
- **Store:** a ~40-line vanilla `createStore(reducer)` with `subscribe`, `dispatch` and an event bus. React binds via `useSyncExternalStore`. The game can run headless in tests.

### 5.5 Persistence (`src/persistence/`)

- **One document**, `cosmic-sudoku:v2`, validated by Zod 4:
  ```
  { version: 2, revision, profile, game | null, daily | null }
  ```
- **Ids and numbers only.** Names, icons and prices live in `content/`, so adding content never needs a migration.
- **Corruption policy.** An unreadable or invalid document is moved to `cosmic-sudoku:corrupt:<timestamp>` and the app starts fresh with a one-time notice. It never crashes.
- **Autosave** on state change (debounced), on `visibilitychange` to hidden, on `pagehide`, and on Android's app-paused event. The in-progress board, notes and undo history (capped at 500 entries) are saved, so a refresh or an Android process kill resumes exactly.
- **Legacy import.** On first launch, if v2 is absent and v1 keys exist, they are mapped by id (Appendix A). Legacy keys are left untouched (a read-only import).
- **Storage failure** (quota, private mode) falls back to in-memory play with a one-time warning.
- **Async storage.** `KeyValueStore` is promise-based (`get`, `set`, `remove`) because Android's native store is asynchronous. Boot is async: the native splash stays up while the document loads and validates, then the first screen renders. The web build uses a `localStorage` adapter. The Android build uses Capacitor Preferences (SharedPreferences), so progress lives in native storage rather than WebView data.
- **Backup.** Android Auto Backup is enabled with rules that include the Preferences file, so progress survives reinstalling or moving to a new phone.
- **Export and import** of the document as a JSON file, with import validated by the same schema. On Android, export writes a temporary file and opens the native share sheet, and import uses the system file picker. This is the safety net for local-only progress.
- **History** is capped at the last 200 games. Lifetime counters live separately so trimming loses nothing.

### 5.6 Worker and puzzle supply (`src/worker/`)

- A Web Worker runs `generatePuzzle` through a small typed message protocol (`generate` → `result` | `error`).
- The client pre-generates the next puzzle (for the next level and for a same-level replay) in the background, so Next Level is instant.
- A **starter pool** of 40 vetted puzzles per tier, generated at build time by `scripts/gen-starter-pool.ts` from fixed seeds, ships in the bundle. It covers first load and worker failure.
- Fallback chain for level puzzles: pre-generated → worker on demand → (if the client's UI timeout passes) a starter-pool puzzle → main-thread generation with the same deterministic work budget. The UI timeout only decides *which* puzzle is served. It never alters a puzzle the generator returns.
- Daily puzzles use the same code path: seed → worker → cached in the save, with `generatorVersion` stored. A newer generator never changes a day's puzzle already in progress. A Daily puzzle never falls back to the starter pool: a slow device simply waits ("Preparing today's puzzle…"), because the content must be identical everywhere.

### 5.7 Error handling

A root error boundary offers "Reset this puzzle" and "Export save". Storage, worker and service-worker failures degrade gracefully (§5.5, §5.6, §7.5). Unhandled rejections are logged locally only. There is no network telemetry.

### 5.8 Dependency policy

- **Runtime:** `react`, `react-dom`, `zod`, `lucide-react`, the optional font package, and the Capacitor core and first-party plugins the app uses (`@capacitor/core`, `app`, `preferences`, `haptics`, `status-bar`, `splash-screen`, `share`, `filesystem`). `@capacitor/cli` is a dev dependency.
- **Everything else needs an ADR.** `knip` fails CI on unused dependencies, exports or files, so dead weight cannot creep back.
- Radix and shadcn are not carried over. Dialogs and tooltips use native `<dialog>` and the Popover API, which are Baseline in 2026.

## 6. Game rules and features

### 6.1 Puzzles and levels

- Every puzzle has exactly one solution, proven by the solver, and is solvable by logic alone using the tier's techniques.
- Level bands are unchanged: Easy 1–10, Medium 11–25, Hard 26–50, Expert 51+. A tier is the **hardest technique required** (Appendix B), not a clue count.
- Inside a band, difficulty ramps linearly with level through the grader's rating window. Expert's window ramps from level 51 to level 100 and stays at the top window from level 100 onward, so levels remain infinite with a bounded ceiling.
- Level advances only when the player presses **Next Level**, as today. "New Puzzle" and "Replay" generate another puzzle at the current level and award full rewards.
- Clue counts become a measured outcome. The README table is regenerated from `audit:puzzles`.

### 6.2 Mistakes and conflicts

- **Mistake:** entering a digit that differs from the solution. It is flagged immediately.
- **Conflict:** two equal digits in a unit. It tints both cells.
- Both states use an icon and a label as well as colour. There is no fail state.
- A mistake costs 25 points and breaks "Perfect", unless an Error Shield absorbs it.

### 6.3 Power-ups

| Power-up | Cost | Start qty | Behaviour |
|---|---|---|---|
| Stellar Hint 💡 | 50 | 3 | Two taps: (1) region and technique name; (2) cell, digit and reason in Cosmos's voice. It never places a digit. If a wrong digit exists, it points at the first one. |
| Cosmic Reveal ✨ | 100 | 1 | Places the true digit in the selected empty cell, or in the cell of the next logical step if none is selected. |
| Time Freeze ⏸️ | 75 | 2 | Stops the scoring clock for 30 s of active time. |
| Error Shield 🛡️ | 60 | 2 | Absorbs the next mistake: no penalty, and it does not break Perfect. |

Power-up use is an atomic reducer transaction (validate → apply → decrement). A failure leaves inventory unchanged and shows one toast.

### 6.4 Scoring and economy

```
base          = 1000 × tierMultiplier        (easy 1 · medium 1.5 · hard 2 · expert 2.5)
timeBonus     = max(0, 600 − activeSeconds)
levelBonus    = level × 10                   (0 for daily)
penalty       = 25 × unshieldedMistakes
score         = max(0, round(base + timeBonus + levelBonus − penalty))
stardust      = floor(score / 10)            (+100 for a daily win)
```

- The result is computed once and stored on the `PUZZLE_WON` event. The win dialog, history and profile all read that stored result.
- Starting stardust is 100. Theme prices are 0 / 500 / 750 / 1000.

### 6.5 Streaks and abandoning

- Entering at least 10 digits and then choosing New Puzzle counts as **abandoned**. It counts as a game played, a loss, and resets the **win streak**.
- Below the threshold, skipping is free.
- Closing the app is never an abandon. The autosave resumes the board.
- **Win rate** = wins ÷ (wins + abandons).
- **Daily streak** counts consecutive calendar days with a daily win. A missed day resets it.

### 6.6 Notes and undo/redo

- Notes mode toggles with a button or the `N` key. Cells hold a 9-bit notes mask.
- Entering a digit auto-clears it from its peers' notes.
- Undo and redo are unlimited per puzzle, one history entry per action. **Undo never refunds** mistakes, power-up charges or time. History is saved with the autosave.

### 6.7 Hints that teach

The grader finds the easiest logical step on the current board. The first time each technique appears in a hint, Cosmos announces it ("New technique: Hidden Pair!") and the id is added to `techniquesSeen`. The Stats screen lists them.

### 6.8 Daily Cosmic puzzle

- The seed is `"cosmic-sudoku/daily/" + YYYY-MM-DD` using the player's **local** calendar date, so everyone on the same date gets the same puzzle with no server.
- The tier follows the weekday: Mon–Tue Easy, Wed–Thu Medium, Fri–Sat Hard, Sun Expert.
- There is one resumable attempt per day. Winning grants +100 stardust and advances the daily streak.
- Only today is playable. Past results appear in Stats.
- Golden hashes for 60 fixed dates freeze the sequence as a contract (`src/engine/golden/daily.json`).
- Generation uses the deterministic work budget (§5.3), so a slow phone computes exactly the same puzzle as a fast one, only later.

### 6.9 Stats and history

`HistoryEntry { finishedAt, kind, level?, tier, outcome, activeSeconds, mistakes, hints, powerUpsUsed, score, stardust }`, capped at 200 entries.

The Stats screen shows:
- Lifetime counters: games played, wins, win rate, level streak, daily streak.
- Best and average time per tier.
- Perfect games.
- Techniques learned.
- An 8-week activity heatmap (lightweight SVG, no chart library).
- Recent games.
- Achievements.

### 6.10 Achievements, themes, Cosmos

- Achievements: six existing plus four new (Appendix C). Unlock times are stored as ISO strings.
- Themes: the same four, with the same prices. Each theme also tints the background gradient (§7.2).
- Cosmos reacts to events (mistake streaks, win streaks, hints, wins, milestone levels) and keeps a short idle line. Selection uses the seeded RNG so it is testable.

## 7. Experience

### 7.1 Layout and navigation

**Phone (portrait).** One screen with no scrolling at 390×844. A compact HUD (level and tier, stardust, timer, mistakes, Cosmos, settings) sits above the board. Below it are a Cosmos speech bubble, a control row (undo, redo, notes, erase), the digit pad (with remaining count per digit) and the power-up row. A bottom navigation bar offers **Play · Daily · Stats · Shop**.

**Desktop and tablet (≥1024 px).** Keep the three-column layout: Cosmos and power-ups on the left, board and pad in the centre, journey cards on the right. Navigation moves to the header. Landscape is supported, with no orientation lock.

**Screens**
- **Play:** the current puzzle.
- **Daily:** today's puzzle status, streak, calendar and a Start button.
- **Stats:** history, heatmap, techniques learned, achievements.
- **Shop:** themes and power-ups.
- **Settings (⚙):** reduce motion (system / on / off), export and import save, reset progress.

### 7.2 Visual design: keep the soul

- Extract the existing palette and glass-tile style into Tailwind 4 `@theme` tokens: `#0a0a1a → #1a1b3a → #2d3561`, cyan `#00f5ff`, pink `#ff6b9d`, purple `#c471ed`, gold `#ffd700`, meteor `#ff4500`, void `#0f0f23`.
- Themes are CSS variable sets selected by `data-theme`. Components never concatenate colour strings. Each theme also tints the background gradient and star colour, which today's themes do not.
- Hover-lift applies only to genuinely interactive tiles and only under `@media (hover: hover)`. Grid cells do not lift.
- `backdrop-filter` is limited to a few surfaces for performance on low-end phones.
- Dark-only by design. Contrast is checked per theme (§8.3).
- One self-hosted rounded variable font with tabular numerals. If rejected, fall back to the system stack.
- Icons from `lucide-react`; emoji remain for Cosmos and power-ups.

### 7.3 Accessibility (WCAG 2.2 AA, tested)

- The board has `role="grid"` with `row` and `gridcell` children and a roving tabindex. Tab enters the grid, and arrow keys move **real focus**.
- Shortcuts: `1`–`9`, `Backspace`/`Delete`, `N` (notes), `U` or `Ctrl/Cmd-Z` (undo), `Shift`+`U` or `Ctrl/Cmd-Shift-Z` (redo), `H` (hint).
- Cell labels read value, notes, and state ("given", "conflict", "wrong").
- A polite live region announces moves, mistakes, hints, power-up results and the win.
- Errors never rely on colour alone (icon, pattern and label).
- All ambient motion (float, twinkle, glow, confetti) is disabled under `prefers-reduced-motion` or the in-app override. `forced-colors` and `prefers-contrast` are respected.
- Pad, power-up and nav targets are ≥44 px. Board cells are as large as the viewport allows (≥24 px, per WCAG 2.5.8). Layout works at 320 px width and 200% zoom.
- Dialogs use native `<dialog>` with focus trapping and return.
- Automated axe checks run on the web build only. On Android, TalkBack behaviour (the WebView exposes the same ARIA tree) is verified by hand in phase 6.

### 7.4 Win celebration

Dismissible with Esc, the backdrop or a button. It shows the stored, credited result. The board stays visible behind it and a **Next Level** button persists in the controls. Reduced-motion users get a static version.

### 7.5 Web build: PWA and offline

This section applies to the web build only. The APK bundles all of its assets, so the native build (`--mode native`) excludes the service worker, the manifest registration and the update prompt.

- One SVG source generates icons: 192, 512, maskable, apple-touch 180, favicon. A new Cosmos emblem replaces the template mark.
- The manifest has `id`, a relative `start_url` and `scope`, `display: standalone`, no orientation lock, token colours, `categories: ["games"]`, and screenshots captured by Playwright.
- `vite.config.ts` uses `base: './'`, so the build works at `/cosmic-sudoku/` or a custom domain.
- vite-plugin-pwa 2 `generateSW` precaches the app shell.
- Updates use an in-app prompt ("New stars have arrived — Refresh"). It never reloads mid-puzzle, and the autosave makes updating safe.
- **Zero third-party requests**: no analytics, no remote fonts, no injected scripts.

### 7.6 Android app

- **Identity:** name "Cosmic Sudoku", application id `io.github.thehizzlegizzle.cosmicsudoku`, and `versionName` and `versionCode` derived from the release tag (Appendix E). Orientation follows the system rotation setting, and the layout supports landscape.
- **Icons and splash:** an adaptive icon (foreground and background layers) plus a monochrome layer for Android 13+ themed icons, generated from the same SVG emblem as the web icons. The Android 12+ splash screen uses the deep-space background token and stays up until saves have loaded.
- **System bars:** edge-to-edge, which is required at target SDK 36. `viewport-fit=cover` with `env(safe-area-inset-*)` padding, light status-bar icons on the dark UI, and a transparent navigation bar.
- **Back button:** closes the topmost dialog, then returns to the Play tab. From Play it minimises the app instead of exiting, which the autosave makes safe.
- **Lifecycle:** when the app goes to the background the game pauses and autosaves. On return the clock resumes only if the Play screen shows a puzzle in progress. A killed process resumes from the autosave.
- **Haptics** (a Settings toggle, on by default): a warning pulse on a mistake, a light tick on power-up use, and a success pattern on a win.
- **Minimum WebView:** the design relies on modern CSS (Tailwind 4, `<dialog>`, the Popover API, `@starting-style`), but Capacitor's own default floor is Chrome 60. Phase 1 audits the CSS features actually used and sets `android.minWebViewVersion` accordingly (expected around Chrome 117). Below that, the app shows a friendly "Update Android System WebView" screen instead of a broken layout.
- **Reduced motion:** Android's "Remove animations" setting should surface as `prefers-reduced-motion`. Phase 6 verifies this on a device.
- **Permissions:** none requested. The `INTERNET` permission is removed from release builds if phase 0 confirms the app boots without it, which makes "fully offline" verifiable from the manifest.
- **Differences from the web build:** storage adapter, share-sheet export, Back button, haptics, no service worker, and no update prompt (updating means installing a newer APK).

## 8. Quality, tooling, CI/CD, security

### 8.1 Toolchain (verified against the npm registry on 2026-10-26; see Appendix D)

React 19.3 · Vite 8 · `@vitejs/plugin-react` 6 · Tailwind 4.3 (`@tailwindcss/vite`) · TypeScript 7 (native compiler) · Vitest 5 · fast-check 4 · Playwright · `@axe-core/playwright` · Biome 2 · knip 6 · vite-plugin-pwa 2 · Zod 4 · pnpm · Capacitor 8.5 (Android) · JDK 21 · Gradle 8.14 · Android Gradle Plugin 8.13 · compileSdk and targetSdk 36 · minSdk 24.

**Why Biome rather than ESLint.** `typescript-eslint` 8.72 supports only `typescript >=4.8.4 <6.1.0`, and the TypeScript 7 package ships a `tsc` binary with no JS API. `eslint-plugin-jsx-a11y` supports ESLint up to 9, while ESLint is at 10. Biome has no dependency on the TypeScript JS API and includes accessibility and React-hooks (`useExhaustiveDependencies`) rules. `tsc` on TS 7 provides type checking.

**Fallback.** If TS 7 or Biome blocks a phase-1 smoke test, drop to TypeScript 6.0.x with ESLint 9 and `typescript-eslint`. This is a tooling swap that does not touch `src/`.

**Runtime support.** `engines.node` is `>=22.18` for tooling. Node runs `scripts/*.ts` through native type stripping, which is unflagged from 22.18, and Capacitor's CLI loads `capacitor.config.ts` the same way when TypeScript 7 offers no compiler API. Vite 8 and Vitest 5 would run on 22.12, but the scripts and the Capacitor config would not. CI runs Node 22 and 24. *(Amended in Plan A, Task 3: was `>=22.12`.)*

### 8.2 Scripts

| Script | Does |
|---|---|
| `dev`, `build`, `preview` | Vite |
| `lint` | `biome ci` |
| `typecheck` | `tsc -b` |
| `knip` | dead code and dependencies |
| `test`, `test:cov` | Vitest (engine, game, persistence; Node environment) |
| `e2e`, `e2e:update` | Playwright (UI, axe, visual, offline, PWA) |
| `check:fast` | lint → typecheck → knip → test (target under 20 s) |
| `check` | `check:fast` → build (with bundle budget) → e2e |
| `audit:puzzles` | regenerate N seeds per tier; report uniqueness, rating and clue histograms, timing |
| `shots` | Playwright screenshots for README and manifest |
| `build:native` | `vite build --mode native` (no service worker or PWA manifest) |
| `android:sync` | `build:native` → `cap sync android` |
| `android:debug` | `android:sync` → `./gradlew assembleDebug` (needs the Android SDK: CI, or a cloud session with SDK access) |
| `android:release` | CI only: signed `assembleRelease` plus `apksigner verify` |

### 8.3 Test strategy

- **Engine** (Vitest, Node, no DOM): unit and property tests.
  - Every generated puzzle is uniquely solvable and solvable by its tier's techniques.
  - Every hint step is *sound*: its placements and eliminations agree with the solution.
  - The same seed gives the same puzzle regardless of device speed. A purity test scans `src/engine/` for `Math.random`, `Date`, `performance` and timers, so nothing time-dependent can enter the generator.
  - Golden hashes freeze the daily sequence.
- **Game:** scenario tests through the reducer. Each D-defect in §4.2 has a named regression test.
- **Persistence:** schema validation, v1 → v2 migration from fixtures captured in phase 0, corruption and quota fallbacks.
- **UI** (Playwright against the real built **web** app, which is the same code the APK wraps; Chromium locally, Chromium, Firefox and WebKit in CI):
  - Keyboard-only play-through; notes and undo; mobile and desktop viewports.
  - axe on every screen × 4 themes.
  - Reduced motion; offline reload through the service worker; manifest and installability checks.
  - The zero-third-party-requests assertion.
  - Visual snapshots of board, win dialog and shop at 390×844 and 1280×800 across themes.
- **Contrast:** `scripts/check-contrast.ts` asserts AA for every foreground/background token pair per theme. Failing shades are adjusted, not the aesthetic.
- **Android smoke test** (emulator, CI only; GitHub's Linux runners provide KVM): install the **debug** APK built for the PR or `main`, launch it, wait for the `cosmic:ready` marker in `logcat`, take a screenshot, force-stop it, relaunch it and wait for `cosmic:resumed`. Inside the protected `release.yml`, an extra run installs the previous release asset and updates over it, which checks the signature and `versionCode`. Android lint (`./gradlew lint`) also runs. No extra test framework is needed, because the checks use `adb`.
- Coverage gates apply to `engine/` and `game/` only.

### 8.4 CI/CD

- **`ci.yml`** runs on PRs and pushes: frozen-lockfile install → `check:fast` → build → e2e (Playwright report uploaded on failure).
- **`deploy.yml`** runs on push to `main` and `workflow_dispatch`: build the web app → `upload-pages-artifact` → `deploy-pages`. It replaces all three existing workflows, which are deleted.
- **`ci.yml` Android jobs:** a debug-APK build (uploaded as an artifact) when `src/`, `android/` or the Capacitor config change, and the emulator smoke test on `main`, on tags and on PRs labelled `android`. Debug builds are signed with a fixed, public debug key and have no access to the release secret. Gradle caches are keyed on the wrapper and lockfiles.
- **`android-keygen.yml`** (manual, run once, from `main`, in the protected `android-release` environment) creates the stable signing key (Appendix E).
- **`release.yml`** (manual dispatch with a version, in the protected `android-release` environment) tags the commit, builds the signed release APK, verifies it, and publishes it with a SHA-256 checksum to a GitHub Release (Appendix E).
- **`claude.yml`** is the optional `@claude` workflow. It is inert until the owner installs the Claude GitHub App and adds a secret.
- All actions are pinned by commit SHA with least-privilege `permissions` and `concurrency` groups. Dependabot covers npm and github-actions with grouped weekly updates and a cooldown.
- pnpm is configured to delay brand-new releases (`minimumReleaseAge`) and to block dependency install scripts except an allowlist. Exact option names are verified in phase 1.
- Visual snapshots are generated and compared on Linux. Environment differences between the cloud container and CI are handled with a small diff tolerance. CI is the source of truth for baselines.

### 8.5 Security

- A strict CSP via `<meta http-equiv>`: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'`.
- No third-party origins. The CSP is injected into production builds only, because the dev server needs inline scripts for HMR.
- Android release builds are non-debuggable and minified with R8. They have cleartext traffic disabled, no live-reload server URL and WebView debugging off. The signing key never appears in logs or chat (Appendix E).
- **Signing-secret isolation.** `ANDROID_SIGNING_PASSPHRASE` is an environment secret in `android-release`, released only to runs on `main` or a `v*` tag. PR and branch builds, including ones that change Gradle or workflow code, never receive it, so a compromised build script or dependency cannot decrypt the release key. They sign with a fixed, public debug key.
- Save import is schema-validated.
- `.env*` stays gitignored. There is no secret in the client, because the game has no backend.

## 9. Claude Code layer

All conventions below were checked against the current Claude Code documentation.

| File | Purpose |
|---|---|
| `CLAUDE.md` (<200 lines) | Commands, the layer rule, conventions, gotchas, definition of done. Advisory; enforcement lives in hooks and CI. |
| `.claude/rules/engine.md` | `paths: ["src/engine/**"]`: determinism, integer-only math, no DOM or React, bump `generatorVersion` on algorithm change. |
| `.claude/rules/ui.md` | `paths: ["src/ui/**"]`: accessibility checklist, tokens only (no hard-coded colours), reduced-motion handling. |
| `.claude/rules/tests.md` | `paths: ["**/*.test.ts", "e2e/**"]`: write the failing test first; name regression tests after the defect. |
| `.claude/rules/android.md` | `paths: ["android/**", "capacitor.config.ts"]`: never hand-edit synced output (`android/app/src/main/assets/public`, `capacitor.config.json`); run `pnpm android:sync` after web changes; the application id never changes; `versionCode` only ever increases; never print or commit key material. |
| `.claude/settings.json` | Committed (single-repo cloud sessions read it). Pre-approves `pnpm run/exec` and read-only `git` commands, denies reads of `.env*`, `*.keystore` and `*.jks`, and registers the four hooks below. |
| `.claude/hooks/*.mjs` | Node scripts (no `jq` dependency). |
| `.claude/skills/add-content/` | Add a theme, power-up or achievement, with its tests and docs. |
| `.claude/skills/tune-difficulty/` | Run `audit:puzzles`, read the histograms, adjust the level/rating curve. |
| `.claude/skills/verify-ui/` | Build, screenshot at phone and desktop, compare with `docs/reference/`. |
| `.claude/skills/build-apk/` | Dispatch the CI APK build for the current branch, wait for it, report the artifact link, and on failure read the job logs and fix the cause. |
| `.claude/skills/release/` | Cut a release: confirm `check` is green, dispatch `release.yml` with the version, verify the release asset and checksum, and put the sideload instructions in the release notes. |
| `.claude/agents/puzzle-auditor.md` | Read-only subagent (`tools: Read, Grep, Glob, Bash`) that digests thousands of generated puzzles into a short report. |
| `docs/claude-code.md` | How to work with Claude Code here, plus the owner's one-time `@claude` setup. |
| `docs/android.md` | Sideloading on a phone, updating, how the signing key works and how to back it up, the WebView requirement, and the optional in-session build setup. |
| `docs/engine-tour.md` | A learner-friendly guided tour of solvers, graders and hints. |
| `docs/adr/` | Short decision records (engine-first, Biome and TS 7, ids-only saves, native dialogs). |

**Hooks** (target shape, verified with `claude doctor` in phase 1):

| Event | Script | Behaviour |
|---|---|---|
| `SessionStart` (`startup\|resume`) | `setup.mjs` | Install dependencies if stale (cloud and local). Under `CLAUDE_CODE_REMOTE`, point Playwright at the preinstalled Chromium. |
| `PreToolUse` (`Edit\|Write`) | `guard.mjs` | Block edits to `src/engine/golden/*`, to `android/signing/**`, to any `*.jks` or `*.keystore` file, and hand-edits to the lockfile, unless an override is set. Exit 2 with a reason. |
| `PostToolUse` (`Edit\|Write`) | `format.mjs` | Format the edited file (path from `tool_input.file_path`). Silent on success. |
| `Stop` | `verify.mjs` | Run `check:fast`. On failure, write the tail to stderr and exit 2 so Claude keeps working. Loop-guarded so repeated failures cannot spin forever. |

**Building APKs in a session.** The cloud environment blocks `dl.google.com` (the Android SDK host) by default, so CI builds the APK. If the owner allows that host, `scripts/android-sdk-setup.sh` installs the command-line SDK (platform 36 and matching build-tools), and `android:debug` then works inside a session. There is still no emulator, because cloud sessions have no KVM, so smoke tests stay in CI.

Skills use `.claude/skills/<name>/SKILL.md` frontmatter (`name`, `description`, `allowed-tools`). `SKILL.md` files stay under 500 lines, with reference files for detail.

## 10. Rollout

Each phase leaves `main` deployable and CI green, and from phase 1 onward each produces a CI-built APK the owner can install. **Phase 1 is merged to `main` as soon as it is green**, because Pages deployment and manually dispatched workflows only work from the default branch. Later phases land through their own PRs. Work is committed on `ccr-f3b683c3-r6qbqy` until each merge.

| Phase | Scope | Exit criteria |
|---|---|---|
| **0 Baseline** | Install old dependencies, build today's app, capture reference screenshots (phone and desktop, four themes) into `docs/reference/`, capture v1 save fixtures, run the Phase-0 checklist (§12). | Reference and fixtures committed; checklist answered. |
| **1 Foundation** | Scaffold (Vite 8, TS 7, Tailwind 4, Biome, Vitest, Playwright, knip, Capacitor and `android/`), CI, Pages deploy, signing-key creation, `CLAUDE.md`, rules, hooks, settings. Ship an empty cosmic shell as a web page and as APKs: a debug APK on every PR, and a first signed release APK from `release.yml`. | Shell live on Pages **and installed on the owner's phone from a CI-built release APK**; `pnpm check` green in CI and cloud. |
| **2 Engine** (test-first) | grid, rng, solver, generator, techniques, grader, hints, validate, audit script, starter pool, golden hashes. | SC3 and SC4 (Node) met; timing targets recorded. |
| **3 Game + persistence** | Reducer, scoring, power-ups, notes, undo/redo, achievements, profile, store, schema, migration, export/import. | Every D-defect test green; SC5 met. |
| **4 UI** | Board, pad, HUD, Cosmos, dialogs, tabs, themes, accessibility, worker wiring. Parity with the reference screenshots. | axe clean; visual snapshots accepted. |
| **5 New features UI** | Daily, Stats, teaching-hint presentation, technique announcements. | Feature e2e green. |
| **6 Hardening and polish** | Web PWA icons, manifest and update flow. Android polish (adaptive icon, splash, Back button, lifecycle, haptics, WebView guard). Release workflow, emulator smoke test and update-over-install test. Budgets, README with real screenshots, `docs/android.md`, ADRs, engine tour, delete old code and workflows. | SC1, SC6–SC12 met. |

**Planning note.** Seven phases is too large for one implementation plan, and later phases depend on measurements from earlier ones (generator timings, bundle size, toolchain behaviour). The default is **three plans**, each written after the previous group's exit criteria are met:

| Plan | Phases | Why this boundary |
|---|---|---|
| A | 0–2 Baseline, Foundation, Engine | Retires the biggest risks (toolchain, Android pipeline and signing, generator) and ends with a deployed shell, an APK on the owner's phone, and a proven engine. |
| B | 3–4 Game + persistence, UI | Built on the real engine API and measured timings. |
| C | 5–6 New-feature UI, Hardening and release | Built on a working, accessible game, and ends with the first release APK. |

The owner can ask for a single plan instead.

**Owner one-time steps:**
1. Set Pages → Source to "GitHub Actions" if it is not already.
2. Create the `android-release` environment (deployment branches and tags limited to `main` and `v*`), add the environment secret `ANDROID_SIGNING_PASSPHRASE` (a long random string, also saved in a password manager), and run the key-creation workflow once.
3. On your phone, allow your browser or file manager to "Install unknown apps".
4. Optionally install the Claude GitHub App and add a secret for `@claude`.
5. Optionally allow `dl.google.com` in the environment's Network access so Claude can build APKs inside a session.

**Deleted in phase 1:** the old `src/`, the three workflows, `nixpacks.toml`, `bun.lock`, `package-lock.json`, the SteerCode script, the placeholder icon and manifest, and unused config. The new scaffold occupies the same paths, so the old app is removed in its own commit at the start of phase 1 (Plan A, Task 3). It stays recoverable at `46f5c93` and, visually, in `docs/reference/`. *(Amended: this was "at the end", phase 6.)*

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| New toolchain (TS 7, Vite 8, Biome) breaks in combination. | Phase-1 smoke test, pinned versions, and the TS 6 + ESLint 9 fallback (§8.1). |
| Expert generation is slow. | Worker, pre-generation, a deterministic work budget with best-in-tier fallback, starter pool. |
| The look drifts from today's. | Reference screenshots in phase 0; visual snapshots; token extraction from the original CSS. |
| Daily puzzle differs across engines. | Integer-only RNG and math, work-count budgets with no clock in the engine, golden hashes, and a cross-browser e2e test in CI. |
| Local-only data is lost. | Autosave, corruption quarantine, export/import, read-only legacy import. |
| Visual snapshot churn between environments. | Tolerance threshold; CI is the baseline source; cloud runs treat visual diffs as warnings unless updating. |
| Scope is large. | Phased delivery; each phase deployable; YAGNI enforced by the non-goals and knip. |
| The Android SDK is unreachable from cloud sessions. | CI builds the APK (runners ship the SDK). Optionally allow `dl.google.com`. Nothing in the plan depends on in-session builds. |
| An old Android System WebView breaks the modern CSS. | `minWebViewVersion` set from a CSS-feature audit, plus a friendly update screen below it. |
| The signing key or its passphrase is lost, so new APKs cannot update installed ones. | Passphrase kept in a password manager; encrypted key in the repo; Auto Backup and export protect progress even if a reinstall is needed. `docs/android.md` explains this. |
| Emulator tests are slow or flaky. | They run on `main`, tags and labelled PRs only, with one retry, and the smoke test checks markers rather than pixels. |
| WebView performance on low-end phones. | Few `backdrop-filter` surfaces; a performance budget checked in the smoke test; reduced motion honoured. |
| Capacitor ecosystem packages go stale (for example `@capacitor/assets`, last published 2024-03). | Use only first-party 8.x plugins and generate Android icons with our own script. |
| A branch or PR build exfiltrates the signing passphrase (for example through changed Gradle code or a compromised dependency). | The passphrase is an environment secret limited to `main` and `v*` tags, and PR builds use a public debug key (Appendix E). Phase 0 verifies the repository supports environment rules; the fallback is §12 item 16. |

## 12. Phase-0 verification checklist

These are facts to confirm by running things, with no decisions left open.

1. `pnpm` self-bootstraps to the pinned version in the cloud container (preinstalled: pnpm 10.28, Node 22.22).
2. Playwright: the container has 1.63 with a matching Chromium. Confirm whether the project pins that version or uses an executable-path override. Run one e2e smoke test.
3. TS 7, Vite 8, `@vitejs/plugin-react` 6, Tailwind 4.3, vite-plugin-pwa 2, Vitest 5 and Biome 2 install and build together.
4. Node 22.22 runs `scripts/*.ts` with type stripping.
5. `knip` runs against the new layout without TS JS-API errors.
6. Exact option names: pnpm `minimumReleaseAge`, Dependabot `cooldown`, and the Stop-hook loop-guard input field.
7. The font subset size stays within the bundle budget.
8. Old app baseline: build, screenshots and v1 save fixtures captured.
9. The Android app boots and works with the `INTERNET` permission removed (Capacitor serves bundled assets locally).
10. GitHub's Linux runners provide JDK 21, Android SDK 36 and KVM for an emulator job, and Gradle caching works.
11. `vite build --mode native` produces a `dist/` that `cap sync android` accepts, with the PWA plugin disabled.
12. The CSS-feature audit result sets `android.minWebViewVersion`.
13. `@capacitor/assets` (last published 2024-03) either works with Capacitor 8 or is replaced by our own icon script.
14. Informational: whether a Docker daemon can be started in the cloud container (the client is installed; no daemon is running).
15. Optional: after the owner allows `dl.google.com`, `scripts/android-sdk-setup.sh` installs the SDK and `android:debug` builds inside a session.
16. The repository (its visibility and plan) supports environment deployment-branch and tag rules for `android-release`. If it does not, the fallback is a repository secret read only by workflows that guard on `github.ref == 'refs/heads/main'` or a `v*` tag, plus branch protection on `main`. The residual risk (anyone with write access can alter a workflow on a branch) is then recorded in `docs/android.md`.

## Appendix A — Legacy save mapping (v1 → v2)

| v1 `localStorage` key | Content | v2 destination |
|---|---|---|
| `cosmic-sudoku-stats` | `GameStats` (`level`, `score`, `totalTime`, `gamesPlayed`, `gamesWon`, `currentStreak`, `bestStreak`, `stardust`) | `profile.level`, `profile.stardust`, lifetime counters, win streak |
| `cosmic-sudoku-achievements` | `Achievement[]` with `unlocked`, `unlockedAt` | `profile.achievements: { [id]: ISOString }`, mapped by id (unknown ids dropped) |
| `cosmic-sudoku-themes` | themes with `unlocked` | `profile.themes.unlocked: id[]` (`default` always included) |
| `cosmic-sudoku-powerups` | power-ups with `quantity` | `profile.inventory: { [id]: number }` |
| `cosmic-sudoku-current-theme` | theme id | `profile.themes.active` (falls back to `default` if locked or unknown) |

Numbers are clamped to sane ranges. Legacy keys are left in place after import.

## Appendix B — Technique ladder and tiers

| Rung | Technique | Tier introduced |
|---|---|---|
| 1 | Naked Single | Easy |
| 2 | Hidden Single | Easy |
| 3 | Naked Pair | Medium |
| 4 | Hidden Pair | Medium |
| 5 | Pointing Pair/Triple | Medium |
| 6 | Box/Line Reduction | Medium |
| 7 | Naked Triple | Hard |
| 8 | Hidden Triple | Hard |
| 9 | X-Wing | Hard |
| 10 | XY-Wing | Expert |
| 11 | Swordfish | Expert |

A puzzle's tier is the highest rung its canonical solve (easiest-technique-first) needs. Rating weights, per-level rating windows and generation work budgets live in `src/game/levels.ts` and are tuned with `audit:puzzles` evidence in phase 2.

## Appendix C — Achievements

| Id | Name | Condition |
|---|---|---|
| `first-win` | First Victory | Win your first puzzle |
| `speed-demon` | Speed Demon | Win in under 3 minutes of active time |
| `perfect-scholar` | Perfect Scholar | Win with no unshielded mistakes |
| `streak-5` | On Fire | Win 5 in a row (win streak) |
| `level-10` | Rising Star | **Reach** level 10 |
| `collector` | Cosmic Collector | Have 3 themes unlocked (the default counts) |
| `daily-7` *(new)* | Daily Devotee | Reach a 7-day daily streak |
| `techniques-5` *(new)* | Student of the Stars | Learn 5 techniques through hints |
| `pure-logic` *(new)* | Pure Logic | Win a Hard or Expert puzzle using no power-ups |
| `cartographer` *(new)* | Cartographer | Win a puzzle having used notes in at least 20 cells |

## Appendix D — Toolchain versions verified on 2026-10-26

| Package | Version | Notes |
|---|---|---|
| react / react-dom | 19.3.1 | |
| vite | 8.3.5 | Node `^20.19 \|\| >=22.12` |
| @vitejs/plugin-react | 6.1.2 | Peer: Vite 8 |
| tailwindcss / @tailwindcss/vite | 4.3.3 | Vite peer includes 8 |
| typescript | 7.0.2 | Native compiler; `tsc` binary, no JS API |
| vitest | 5.0.5 | Node `^22.12 \|\| ^24 \|\| >=26`; Vite peer includes 8 |
| fast-check | 4.10.2 | |
| @playwright/test | 1.64.1 latest | Container has 1.63.0 with Chromium |
| @axe-core/playwright | 4.14.0 | Node ≥22.12 |
| @biomejs/biome | 2.6.3 | |
| knip | 6.43.0 | No TS JS-API dependency (uses oxc-parser) |
| vite-plugin-pwa | 2.0.0 | Peer includes Vite 8 |
| zod | 4.6.7 | |
| lucide-react | 1.61.0 | |
| pnpm | 12.15.0 latest | Container has 10.28.0 |
| typescript-eslint | 8.72.0 | Peer `typescript >=4.8.4 <6.1.0` (reason for Biome) |
| eslint-plugin-jsx-a11y | 6.10.2 | Peer ESLint up to 9 (reason for Biome) |
| @capacitor/core, cli, android | 8.5.3 | CLI needs Node ≥22 |
| @capacitor/app | 8.1.2 | Back button and lifecycle |
| @capacitor/preferences | 8.0.1 | Native storage |
| @capacitor/haptics | 8.0.2 | |
| @capacitor/splash-screen | 8.0.2 | |
| @capacitor/status-bar | 8.0.4 | |
| @capacitor/share | 8.0.3 | Save export |
| @capacitor/filesystem | 8.1.5 | Temporary export file |
| @capacitor/assets | 3.0.5 | Last published 2024-03; treat as stale (§12 item 13) |
| Capacitor 8 Android template | minSdk 24 · compileSdk 36 · targetSdk 36 · AGP 8.13.0 · Gradle 8.14.3 · JDK 21 | Read from the published `@capacitor/cli` package. The default WebView floor is Chrome 60. |
| Cloud container | JDK 21.0.12 · Gradle 8.14.3 · no Android SDK · `dl.google.com` blocked · no `/dev/kvm` | Checked 2026-10-26 |

## Appendix E — Android build, signing and release

**Version scheme.** The git tag `vMAJOR.MINOR.PATCH` is the source of truth.
- `versionName = MAJOR.MINOR.PATCH`.
- `versionCode = MAJOR × 1,000,000 + MINOR × 1,000 + PATCH`, which strictly increases, so a newer build always installs over an older one.
- `scripts/android-version.ts` computes both. Gradle reads them from environment variables and defaults to `0.0.0` and `1` for local builds.

**Release manifest and Gradle decisions**
- `android:debuggable=false`, R8 minification and resource shrinking on, `android:usesCleartextTraffic=false`.
- No `INTERNET` permission if §12 item 9 passes.
- `android:allowBackup=true`, with `dataExtractionRules` and `fullBackupContent` including the Capacitor Preferences file (confirmed in phase 1) and excluding caches.
- `minSdk 24`, `compileSdk` and `targetSdk` 36, a universal APK with v2 and v3 signatures, and no `server.url` in the Capacitor config.
- Debug builds use `applicationIdSuffix ".debug"`, the label "Cosmic Sudoku (debug)" and a fixed, committed debug keystore. They install beside the release app, never over it, and never touch release signing material.

**Signing key creation (once)**
1. The owner creates the `android-release` environment (deployment branches and tags limited to `main` and `v*`) and adds the environment secret `ANDROID_SIGNING_PASSPHRASE`: a long random string saved in a password manager.
2. The owner runs `android-keygen.yml` (manual, from `main`, in the `android-release` environment). It creates a PKCS12 keystore with `keytool` (RSA 4096, 10,000-day validity) using random generated passwords. It bundles the keystore and passwords into one archive and encrypts it with `openssl enc -aes-256-cbc -pbkdf2` using the passphrase. It then pushes a branch, `chore/android-signing-key`, containing only the encrypted file `android/signing/release.enc`. Generated values are masked in the logs and never printed.
3. After that branch is merged, every build decrypts the file inside the runner with the secret. Exact cipher parameters are fixed in the plan.
4. Only `release.yml` and `android-keygen.yml` reference the `android-release` environment, and the environment releases its secret only to runs on `main` or a `v*` tag. A PR or branch build, including one that changes Gradle or workflow code, never receives the passphrase, so it cannot decrypt the key. The encrypted file alone is useless without the passphrase.

**If the key is lost.** If the passphrase or the encrypted file is lost, the key cannot be recovered. New APKs would need a different key and could not update installed copies; the owner would uninstall and reinstall. Auto Backup and Export protect progress. `docs/android.md` explains how to back up the passphrase.

**Release flow.** The owner, or the `/release` skill, dispatches `release.yml` with a `version`. The workflow runs in the `android-release` environment and:
1. Checks out the commit and runs `check:fast`.
2. Runs `build:native` and `cap sync android`.
3. Decrypts the key and runs `./gradlew assembleRelease`.
4. Aligns and signs the APK, and verifies it with `apksigner verify`.
5. Writes `cosmic-sudoku-<version>.apk` and `SHA256SUMS`.
6. Creates the tag and a GitHub Release with generated notes and the sideload instructions.

**Sideloading (summarised for `docs/android.md`).** On the phone, open the Release in a browser, download the APK, and tap it. Allow "Install unknown apps" for that browser or file manager when asked, then install. To update, install a newer APK over the old one (same signature, higher `versionCode`). Progress is kept.
