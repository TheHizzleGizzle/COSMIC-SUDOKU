# Phase 0 findings

Probes run on 2026-10-26 in the Claude Code cloud container (Node 22.22.0, npm 10.9.4, preinstalled pnpm 10.28.0). Each section records the command, what it printed, and the decision later tasks consume. Decisions are in **bold**.

## Decisions at a glance

| Decision | Value | Consumed by |
|---|---|---|
| **PNPM_PIN** | `pnpm@12.15.0` | Task 3 (`packageManager`) |
| **PNPM_OPTIONS** | In `pnpm-workspace.yaml`: `minimumReleaseAge: 1440` (minutes) and an `allowBuilds` map (package → boolean) | Task 3 |
| **PW_STRATEGY** | Pin `@playwright/test` to 1.63.0, and honour `PW_CHROMIUM_PATH` (falling back to `/opt/pw-browsers/chromium` when `CLAUDE_CODE_REMOTE === 'true'`) | Task 4 |
| **ICON_STRATEGY** | Our own icon script, not `@capacitor/assets` | Plan C |
| **REPO_PRIVATE** | `false` (the repository is public) | Task 10 |

## 1. pnpm bootstrap

Command: a scratch `package.json` with `"packageManager": "pnpm@12.15.0"`, then `pnpm --version`.

```
12.15.0        (real 0m3.6s, run from the preinstalled pnpm 10.28.0)
```

pnpm 10.28.0 self-switched to the pinned version and downloaded it from the registry in under 4 seconds.
**Decision: `PNPM_PIN = 12.15.0`.** No need to fall back to the container's 10.28.0.

## 2. pnpm setting names

pnpm 12.15.0 was unpacked from its published tarball, and its changelog and code were searched. Findings:

- `minimumReleaseAge` and `minimumReleaseAgeExclude` exist. The unit is minutes. Both are `undefined` by default, so we must set them explicitly.
- `allowBuilds` (a map of package → boolean) is the install-script allowlist. The old `onlyBuiltDependencies` name does not appear anywhere in pnpm 12.15.0. A newer `permissions` setting (its `build` capability) takes precedence over `allowBuilds` when present; we do not use it.
- `trustPolicy` also exists (supply-chain trust checks on resolved packages). It is not enabled by this plan; it is a candidate for a later hardening pass.
- Confirmed by running `pnpm config get` in a directory holding this `pnpm-workspace.yaml`, which printed `1440` and `{ "esbuild": true }`:

```yaml
minimumReleaseAge: 1440
allowBuilds:
  esbuild: true
```

**Decision: `PNPM_OPTIONS` = those two settings, in `pnpm-workspace.yaml`, with `allowBuilds` limited to the packages whose install scripts the lockfile actually needs (decided in Task 3).**

## 3. Playwright

```
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers      CLAUDE_CODE_REMOTE=true
playwright 1.63.0
default launch:        OK, Chromium 153.0.8010.12
executablePath launch: OK, Chromium 153.0.8010.12   (/opt/pw-browsers/chromium -> chromium-1243/chrome-linux64/chrome)
```

Both launch methods work. A project-local `@playwright/test` at exactly 1.63.0 finds the browsers through `PLAYWRIGHT_BROWSERS_PATH`.
**Decision: `PW_STRATEGY` = pin `@playwright/test` to 1.63.0 and honour `PW_CHROMIUM_PATH`, falling back to `/opt/pw-browsers/chromium` when `CLAUDE_CODE_REMOTE === 'true'`.** That way a later Playwright bump (for example from Dependabot) cannot break cloud sessions.

## 4. Native type stripping

```
$ node --version  →  v22.22.0
$ node x.ts       →  1        (x.ts: const n: number = 1; console.log(n satisfies number))
```

`node scripts/*.ts` runs without flags. The tooling Node floor of `>=22.18` (plan amendment b) is therefore met by the container.

## 5. `@capacitor/assets`

`@capacitor/assets@3.0.5` depends on `@capacitor/cli ^5.3.0` and `sharp 0.32.6`, so it would pull a Capacitor 5 CLI next to our 8.5.3.
**Decision: `ICON_STRATEGY = our own icon script`** (spec §12 item 13).

## 6. Repository visibility

The GitHub `search_repositories` tool, scoped to `repo:TheHizzleGizzle/COSMIC-SUDOKU`, returned `"private": false`, `"visibility": "public"`, `"has_pages": true`, and `permissions.admin: true` for the session's token.

**Decision: `REPO_PRIVATE = false`.** Consequences for the plan:

- GitHub environments with deployment-branch and tag rules are available on public repositories on every plan, so spec §12 item 16 is expected to hold. **The owner still confirms in Settings → Environments** when creating `android-release` (Task 10).
- The encrypted signing archive (`android/signing/release.enc`) will be publicly readable. Its only protection is the passphrase, so the passphrase must be long and random (a password-manager value, not a memorable phrase).
- Fork pull requests receive no repository secrets, which is the behaviour the spec's signing-isolation design relies on.
- Pages is enabled (`has_pages`), but its source setting is not visible from here; Task 10 asks the owner to confirm "GitHub Actions".

## 7. Docker

```
Client: Docker Engine - Community, Version: 29.9.2
(no /var/run/docker.sock: the daemon is not running)
```

Informational only (spec §12 item 14): client present, daemon not running. Nothing in the plan depends on it.

## Facts verified while writing the plan

These were checked against primary sources before the plan pinned them.

- **Capacitor 8.5.3 and TypeScript 7.** The CLI's config loader detects that `typescript` lacks `transpileModule` (as in TS 7) and falls back to Node's native type stripping, so `capacitor.config.ts` works on Node ≥ 22.18 (22.6+ with `--experimental-strip-types`). Source: `@capacitor/cli` 8.5.3, `dist/util/node.js`.
- **Capacitor 8 Android template.** `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36`, Android Gradle Plugin 8.13.0, Gradle 8.14.3, Java 21 source and target. The runtime's default minimum WebView is Chrome 60 (floor 55).
- **Stop hooks.** Claude Code passes `stop_hook_active` (true when the turn is already continuing because of a stop hook), and caps consecutive stop-hook continuations at 8 (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises it). Exit code 2 blocks the stop and feeds stderr back to Claude.
- **Cloud container and Android.** JDK 21.0.12 and Gradle 8.14.3 are preinstalled, and Maven Central, Google Maven and the Gradle hosts are reachable. The Android SDK host, `dl.google.com`, is blocked by the network policy, and there is no `/dev/kvm`. Android builds and emulator tests therefore run in CI.
