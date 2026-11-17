# Reference captures of the original app

These files are the visual and data reference for the Cosmic Sudoku 2.0 rebuild. They were captured from the original vibe-coded app at commit **`46f5c93`** ("Can we improve how it looks on mobile devices?"), built with `npm ci && npm run build` and served with `vite preview` on port 3000.

## Screenshots

`{default,nebula,aurora,galaxy}-{phone,desktop}.png`: the Play screen in each of the four themes.

| Variant | Viewport | Device scale |
|---|---|---|
| `*-phone.png` | 390×844 | 1 |
| `*-desktop.png` | 1280×800 | 1 |

All eight show the same seeded state: level 12 (Medium), stardust 340, three achievements unlocked, all four themes unlocked, the theme under capture selected. They are viewport-sized, not full-page.

### What was frozen, and why

So that every capture is reproducible:

- `Math.random` is replaced by a fixed-seed generator (mulberry32, seed 42), so the original generates the same puzzle and Cosmos shows the same line each time.
- `Date.now` is frozen at 2026-01-01T00:00:00Z, so the timer reads 0:00.
- All CSS animations and transitions are disabled.
- Service workers are blocked, and the third-party `steercode.web.app` script is aborted, so a capture never depends on the network.

### How to use these

They define "looks like today's game" for Plan C's visual-parity checks. They also show today's *defects*, and parity means the look, not the bugs. Visible examples:

- On a phone, the board comes first, but the timer, mistakes and power-ups sit below the fold.
- The Nebula theme's purple given digits are low-contrast on the dark board.
- The timer reads 0:00 here only because the clock is frozen.

## Save fixtures

`fixtures/legacy-v1/{fresh,midgame,maxed}.json` live one directory up from `docs/`, at the repository root. Each is a flat `{ "<localStorage key>": "<raw string value>" }` object holding exactly the five v1 keys the original app writes:

`cosmic-sudoku-stats`, `cosmic-sudoku-achievements`, `cosmic-sudoku-themes`, `cosmic-sudoku-powerups`, `cosmic-sudoku-current-theme`.

They were read back from `localStorage` after the app's own effects had written them, so the shapes are real, including `unlockedAt` stored as an ISO string.

| Fixture | State |
|---|---|
| `fresh` | Untouched defaults: level 1, stardust 100, nothing unlocked except the default theme |
| `midgame` | Level 12, stardust 340, three achievements unlocked, themes `default` and `nebula` unlocked, theme `nebula` selected |
| `maxed` | Level 60, stardust 9999, every achievement and theme unlocked, theme `galaxy` selected |

Plan B's v1 → v2 migration tests consume these. The mapping is in the design spec, Appendix A.
