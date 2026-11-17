# Cosmic Sudoku (Android) — PRD

## Original problem statement
"Build a mobile app: Base the app on the repo. Ask me any questions you need."
Repo = Cosmic Sudoku web game (React/Vite) + 2.0 design spec (docs/superpowers/specs). Approved plan: /app/plan/plan.md.

## Architecture
- Expo SDK 58 / expo-router app in /app/frontend (rebuilt from scratch; old web code left untouched at repo root).
- Fully offline. Backend (/app/backend/server.py) is only a health endpoint.
- `src/engine/` — seeded integer RNG (cyrb128+sfc32), bitmask MRV solver, unique-solution generator (<7 ms).
- `src/game/` — pure rules (game.ts), profile reducer (profile.ts), content, dates, persistence (versioned + sanitized, corrupt quarantine), tiny store (useSyncExternalStore) with actions + autosave.
- `src/components/` — Board, PlayParts (HUD, Cosmos bubble, controls, pad, power-ups, win panel), Celebration, Settings/Confirm sheets, Toasts, SpaceBackground, Cosmos SVG mascot.
- Tabs: Play · Daily · Stats · Shop (JS tabs; NativeTabs only iOS 26+).
- Theme tokens + 4 cosmic palettes in src/theme.ts; Nunito static TTFs; Lucide icons prewarmed in root layout.

## Implemented (2026-06)
- Endless levels, 4 bands, clue ramp per level, exactly-one-solution puzzles
- Instant mistake flag (x icon), conflicts both marked (triangle icon), no game-over
- Notes mode with peer auto-clear, unlimited undo/redo (never refunds)
- Power-ups: Hint (wrong digit first, else candidates), Reveal (selected or random), Freeze (stops scoring clock 30 s), Shield
- Scoring/stardust formula, daily +100, win celebration (dismissible, credited result), win panel
- Daily Cosmic (seeded by local date, weekday ramp, resumable, streak, calendar)
- Stats: counters, win rate, best/avg per tier, perfect games, 8-week heatmap, recent games, 9 achievements
- Abandon rule (10+ digits → loss, streak reset, confirm sheet)
- Shop: power-ups, 4 themes (confirm unlock, apply)
- Cosmos reactions + idle lines; haptics; reduce motion (phone/on/off); reset progress w/ confirm
- Autosave (1.5 s + on background), resume paused until board tap, corrupt-save notice

## Backlog
- P1 (Phase 2): teaching hints w/ technique names, techniques learned + Student of the Stars, technique-graded difficulty, save export/import
- P2 (Phase 3): themed icon/splash polish, TalkBack pass, tablet/landscape, low-end perf pass, Play Store readiness
