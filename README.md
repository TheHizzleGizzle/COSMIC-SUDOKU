# Cosmic Sudoku

An offline-first Sudoku game with a cosmic look, built for the web and for Android.

> **Status: being rebuilt.** This repository is a ground-up rebuild of an earlier prototype. Right now it has the toolchain and a framework-free puzzle engine in progress; the game screens, saved games and the Android app arrive in later phases. Nothing here is playable yet.

## What it is becoming

- Infinite levels, with puzzles generated on your device and graded by the human techniques needed to solve them (naked singles up to swordfish).
- Notes, undo and redo, hints that teach the technique, stats and history, and a daily puzzle that is the same for everyone on the same date.
- Four themes, a stardust economy, power-ups and achievements, carried over from the original.
- A signed APK you install on your own phone (sideloaded, no Play Store). The web build is a by-product.

The design is in [`docs/superpowers/specs/`](docs/superpowers/specs/2026-10-26-cosmic-sudoku-rebuild-design.md) and the first implementation plan is in [`docs/superpowers/plans/`](docs/superpowers/plans/2026-10-26-plan-a-baseline-foundation-engine.md). Screenshots of the original app live in [`docs/reference/`](docs/reference/README.md).

## Working on it

You need Node 22.18 or newer. pnpm installs itself at the pinned version.

```bash
pnpm install
pnpm check:fast   # lint, typecheck, dead-code scan and unit tests
```

Source layers, from top to bottom: `ui → platform / game / persistence → engine`, with `content` as plain data. Dependencies only point down, and lint and the compiler enforce it (see [ADR 0002](docs/adr/0002-toolchain.md)). The engine never touches the DOM, the clock or `Math.random`, so puzzles are reproducible from a seed.

The original prototype is still in git history at commit `46f5c93`.
