# Cosmic Sudoku for Android

A space-themed Sudoku game for Android phones, rebuilt from the Cosmic Sudoku web game as a native app. It keeps Cosmos the mascot, stardust, power-ups, achievements, themes and endless levels. It adds notes, undo/redo, a daily puzzle and a stats screen, and it fixes the rule bugs listed in the 2.0 design doc.

## Who it's for
- Casual and regular Sudoku players who like a relaxed, rewarding game with progression, unlocks and a friendly mascot.
- Existing fans of the web version who want it as a proper Android app that works offline.

## Core features and experience

**Puzzles and levels**
- A classic 9×9 board. Every puzzle has exactly one solution, so the game always knows the right answer.
- Levels never end. Difficulty follows the existing bands: Easy (levels 1–10), Medium (11–25), Hard (26–50) and Expert (51+). Each level plays at its real difficulty, and puzzles get harder within each band.
- The level goes up only when the player taps **Next Level**. **New Puzzle** gives a fresh puzzle at the current level.

**Playing**
- Tap a cell, then tap a number. Each number on the pad shows how many are left to place.
- A wrong digit is flagged straight away. Two equal digits in the same row, column or box are both marked. Marks use an icon as well as colour.
- **Notes mode** adds small pencil-mark candidates to a cell. Placing a digit clears it from the notes of related cells.
- **Undo and redo** have no limit. Undo never gives back mistakes, power-up charges or time.
- There is no game-over. Every mistake costs points.

**Power-ups** (bought with stardust; charges are used only when the power-up works)
| Power-up | Price | Starting amount | What it does |
|---|---|---|---|
| Stellar Hint | 50 | 3 | Shows the possible numbers for the selected cell, or points to a wrong digit if there is one. It never fills a cell. |
| Cosmic Reveal | 100 | 1 | Fills the selected empty cell with the correct digit. With no cell selected, it fills one at random. |
| Time Freeze | 75 | 2 | Stops the scoring clock for 30 seconds of play. |
| Error Shield | 60 | 2 | Absorbs the next mistake: no penalty, and "Perfect" stays intact. |

**Scoring and stardust**
- Score = difficulty base (1000 × 1 / 1.5 / 2 / 2.5) + time bonus (600 minus seconds taken, never below zero) + level × 10 − 25 per unshielded mistake.
- Stardust earned = score ÷ 10. A Daily win adds +100. New players start with 100 stardust. Stardust is earned only by playing.
- The win screen shows exactly what was credited and can be closed. The board stays visible behind it.

**Daily Cosmic puzzle**
- One puzzle a day, the same for everyone on that date, and it works offline.
- Difficulty rises through the week: Mon–Tue Easy, Wed–Thu Medium, Fri–Sat Hard, Sun Expert.
- There is one attempt per day, and it can be paused and resumed. A win gives +100 stardust and extends the daily streak. A missed day resets the streak.

**Stats and history**
- Games played, wins, win rate, level win streak and daily streak.
- Best and average time for each difficulty, and the number of perfect games.
- An 8-week activity heatmap, recent games and all achievements.
- Starting a New Puzzle after entering 10 or more digits counts as an abandoned game: it counts as a loss and resets the win streak. Closing the app never counts as abandoning.

**Achievements**
- First Victory, Speed Demon (under 3 minutes), Perfect Scholar (no mistakes), On Fire (5 wins in a row), Rising Star (reach level 10) and Cosmic Collector (3 themes).
- New: Daily Devotee (7-day daily streak), Pure Logic (win Hard or Expert without power-ups) and Cartographer (win after using notes in 20+ cells).

**Shop and themes**
- Buy power-ups and unlock themes: Classic Cosmos (free), Nebula Dreams (500), Aurora Borealis (750) and Galaxy Explorer (1000).
- Each theme recolours the board, the glow and the space background.

**Cosmos the mascot**
- A small floating character with a speech bubble. Cosmos reacts to mistakes, win streaks, hints, wins and milestone levels, and has idle lines in between.

**Always saved**
- Progress and the in-progress board (including notes and undo history) save automatically. Leaving the app or having Android close it picks up exactly where the player left off.
- A damaged save never crashes the app. It starts fresh and shows a one-time notice.

**Settings**
- Vibration feedback on/off (on by default: a buzz on a mistake, a tick on a power-up, a celebratory pattern on a win).
- Reduce motion (follow the phone / on / off).
- Reset all progress, with a confirmation step.

## User flow
1. Open the app. A new player starts Level 1 with a welcome from Cosmos. A returning player resumes their last puzzle with the timer paused until they tap the board.
2. **Play tab:** level, difficulty, stardust, timer and mistakes sit across the top, with the board below. Under the board are Cosmos's speech bubble, the undo / redo / notes / erase controls, the number pad and the power-up row. Everything fits on one screen with no scrolling.
3. Solve the puzzle. A celebration shows the score, time, mistakes and stardust earned, with **Next Level** and **Play Again** buttons.
4. **Daily tab:** today's difficulty, the daily streak and a small calendar of past results. Tap **Start** (or **Continue**) to play today's puzzle.
5. **Stats tab:** lifetime numbers, best times, the heatmap, recent games and achievements.
6. **Shop tab:** stardust balance, power-ups to buy and themes to unlock or apply.
7. **Settings** (gear icon on Play): vibration, reduce motion, reset progress.
8. Android back button: closes any open sheet first, then returns to Play. On Play it minimises the app, and the game is saved.

## UI/UX feel
- **Art style: Glassmorphism 2.0 on a deep-space backdrop.** This is the modern version of the game's current "bubble" look. Layered frosted-glass tiles float over a dark navy-to-indigo space gradient with slowly twinkling stars. Soft neon light comes from stellar cyan, aurora pink and galaxy purple, and gold marks stardust.
- Given digits are bright and solid, player digits are tinted in the theme colour, and notes are small and quiet. The selected cell and its row, column and box get a gentle highlight.
- A rounded, friendly typeface with even-width numbers, so the timer and digits don't jitter.
- Small, satisfying motion: cells pop when filled, power-ups glow when used, the board shakes lightly on a mistake, and confetti and a stardust burst play on a win. All of it switches off with Reduce motion.
- Dark only. Large thumb-friendly buttons. The board is sized as large as the screen allows.
- A bottom tab bar: **Play · Daily · Stats · Shop**.

## Implementation phases

**Phase 1: MVP (built now)**
Everything in "Core features and experience" above on Android: correct one-solution puzzles, endless levels across the four bands, mistakes and conflicts, notes, undo/redo, the four power-ups, scoring and stardust, the shop and themes, nine achievements, Cosmos's reactions, the win celebration, autosave and resume, the Daily Cosmic puzzle, stats and history, settings, and the Glassmorphism 2.0 cosmic look.

**Phase 2: Smarter hints and deeper difficulty**
- Hints that teach: Stellar Hint becomes two steps (the area and the technique name, then the cell, digit and reason in Cosmos's voice). The first time a technique appears, Cosmos announces it ("New technique: Hidden Pair!").
- A "Techniques learned" list on the Stats screen and the Student of the Stars achievement (learn 5 techniques).
- Difficulty defined by the hardest solving technique a puzzle needs (for example X-Wing for Hard), not just by how many numbers are given.
- Save export and import as a file, as a backup for progress that lives only on the phone.

**Phase 3: Polish and release**
- A Cosmos app icon (including Android 13+ themed icon) and a cosmic splash screen.
- A TalkBack screen-reader pass, plus tablet and landscape layouts.
- A performance pass on low-end phones, and a Google Play readiness check before publishing.

## Assumptions
- The game is rebuilt as a native Android app instead of wrapping the web game as the design doc proposed. The doc's GitHub Pages site, web install (PWA), GitHub release workflow, signing-key setup and Claude Code tooling are not part of this build. Builds and publishing go through the Publish button.
- Android only. A web preview exists only for checking work during development.
- Fully offline and single-player: no accounts, online backup, leaderboards or ads. Progress lives on the phone only.
- Progress from the old web version cannot be carried over, because a browser's saved data can't be read by a phone app. Everyone starts fresh.
- The design doc's game-rule defaults apply: wrong digits are flagged instantly, a mistake costs 25 points, there is no fail state, the 10-digit abandon rule applies, and undo never refunds.
- Prices, starting amounts, theme costs, the scoring formula and level bands are the same as the current game and design doc.
- Without "Hints that teach" in Phase 1, Stellar Hint shows the possible numbers for a cell, as the current game does, but correctly. Teaching hints arrive in Phase 2.
- In Phase 1, difficulty within each band comes from how many numbers are given, and every puzzle has exactly one solution. Technique-based difficulty arrives in Phase 2.
- The Daily puzzle uses the phone's local date, and only today's puzzle is playable. Past days appear as results only.
- History keeps the last 200 games. Lifetime totals are never trimmed.
- Vibration feedback is on by default. There is no sound, as in the design doc.
- Phone portrait layout comes first. Tablet and landscape layouts come in Phase 3.
- The app name is "Cosmic Sudoku". The art style (Glassmorphism 2.0) was picked from the provided list because it best matches the game's existing glass-bubble look.
