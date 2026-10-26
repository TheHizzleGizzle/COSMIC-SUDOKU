# ADR 0002: Toolchain

Status: accepted · Date: 2026-10-26 · Spec: §8.1

## Context

The original app was a Vite 5 / React 18 prototype with ESLint, npm and Bun lockfiles side by side, and three conflicting deploy workflows. The rebuild needs one toolchain that a person and Claude Code can both run offline in a cloud container, and that makes the layer rules (`ui → platform/game/persistence → engine`) fail loudly instead of drifting.

## Decision

| Concern | Choice | Why |
|---|---|---|
| Package manager | pnpm 12.15.0, pinned by `packageManager` | Self-bootstraps from the container's preinstalled pnpm 10 in about 4 seconds. `pnpm-workspace.yaml` sets `minimumReleaseAge: 1440` (a one-day delay on brand-new releases) and an empty `allowBuilds`: no dependency needs an install script today. |
| Language | TypeScript 7.0.2 (the native compiler) | `tsc -b` over four composite projects. Core projects set `lib: ["ES2023"]` and `types: []`, so DOM and Node globals do not exist there and a stray `window` fails to compile. |
| Lint and format | Biome 2.6.3, no ESLint, no Prettier | One binary for both jobs. `typescript-eslint` has no support for the TS 7 package, which ships a compiler binary without a JavaScript API (spec §8.1). Per-directory `noRestrictedImports` overrides carry the layer table. |
| Dead code | knip 6.43.0 | Catches unused files, exports and dependencies in `check:fast`. |
| Build and test | Vite 8.3.5, Vitest 5.0.5 | `base: './'` so one build serves GitHub Pages and the Android WebView. |
| Node | `>=22.18` | Native type stripping runs `scripts/*.ts` and Capacitor's `capacitor.config.ts` loader without a compiler API. |

The four TypeScript projects are `core` (engine, game, persistence, content), `test` (all `*.test.ts` plus `src/engine/testing`, Node types, no DOM), `app` (ui, platform, worker, `main.tsx`; DOM, references `core`) and `node` (scripts, e2e and tool configs, with `erasableSyntaxOnly`). Each emits declarations only, into `node_modules/.tmp/tsc/`, so a build leaves nothing to commit.

## What the guardrails do

Each was proved by planting a violation and watching the right check fail (Task 3, step 6):

- `window.innerWidth` in `src/engine/` fails `pnpm typecheck` (`Cannot find name 'window'`).
- `import "react"` in `src/engine/` fails `pnpm lint` (`noRestrictedImports`).
- `Math.random()` in `src/engine/` fails `pnpm test` (the engine purity test).

The layer table was also probed import by import: 21 imports across the six directories, 11 that must be rejected and 10 that must pass, all behaved.

## Findings while wiring it

- **Biome formats Markdown** from 2.6. The specs, plans and README contain hand-aligned tables, so `biome.json` excludes `**/*.md`.
- **`recommended: true` is deprecated** in favour of `preset: "recommended"`. The config uses `preset`.
- **`noExportsInTest`** is on by default, so `findForbidden` stays private to its test file instead of being exported.
- **knip prints configuration hints** for entry globs that match nothing yet (`src/main.tsx`, `e2e/**`, and so on). They are intentional: the globs name files that later tasks add, and the hints disappear as those files arrive. Hints do not fail the run.
- TypeScript 7 and Vite 8 installed and type-checked together on the first attempt, so the fallback in spec §8.1 (TypeScript 6 with ESLint 9) was not needed.

## Consequences

- Everything runs offline once installed: `pnpm check:fast` is lint, typecheck, knip and unit tests.
- Replacing Biome later means rewriting the layer rules in another tool. The tsconfig layering (no DOM in core) would stay.
- Every tool is pinned to an exact version, so a TypeScript or Biome upgrade is a deliberate commit (Dependabot proposes it, CI proves it) rather than something a fresh install does silently.
