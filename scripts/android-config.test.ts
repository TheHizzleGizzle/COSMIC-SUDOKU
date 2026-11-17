import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

/** The text between the braces of the first `name { ... }` block, braces balanced. */
function block(text: string, name: string): string {
  const start = new RegExp(`\\b${name}\\s*\\{`).exec(text);
  if (!start) throw new Error(`No "${name}" block found`);
  let depth = 1;
  let i = start.index + start[0].length;
  const from = i;
  while (depth > 0 && i < text.length) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') depth--;
    i++;
  }
  return text.slice(from, i - 1);
}

describe('Android project invariants', () => {
  it('appId and name', async () => {
    const { default: config } = await import('../capacitor.config.ts');
    expect(config.appId).toBe('io.github.thehizzlegizzle.cosmicsudoku');
    expect(config.appName).toBe('Cosmic Sudoku');
    expect(config.webDir).toBe('dist');
  });

  it('sdk levels', () => {
    const variables = read('android/variables.gradle');
    expect(variables).toMatch(/minSdkVersion\s*=\s*24\b/);
    expect(variables).toMatch(/compileSdkVersion\s*=\s*36\b/);
    expect(variables).toMatch(/targetSdkVersion\s*=\s*36\b/);
  });

  it('release manifest removes INTERNET', () => {
    const overlay = read('android/app/src/release/AndroidManifest.xml');
    expect(overlay).toMatch(
      /<uses-permission[^>]*android:name="android\.permission\.INTERNET"[^>]*tools:node="remove"|<uses-permission[^>]*tools:node="remove"[^>]*android:name="android\.permission\.INTERNET"/,
    );
  });

  it('main manifest declares no INTERNET, so the debug smoke boot proves offline boot', () => {
    expect(read('android/app/src/main/AndroidManifest.xml')).not.toContain(
      'android.permission.INTERNET',
    );
  });

  it('debug build uses the suffix and the committed keystore', () => {
    const gradle = read('android/app/build.gradle');
    expect(block(block(gradle, 'buildTypes'), 'debug')).toMatch(
      /applicationIdSuffix\s*=?\s*["']\.debug["']/,
    );
    expect(existsSync(new URL('android/app/debug.keystore', root))).toBe(true);
    expect(block(block(gradle, 'signingConfigs'), 'debug')).toMatch(/debug\.keystore/);
  });

  it('labels the debug build apart from the release build', () => {
    const debug = read('android/app/src/debug/res/values/strings.xml');
    expect(debug).toContain('<string name="app_name">Cosmic Sudoku (debug)</string>');
    expect(debug).toContain('<string name="title_activity_main">Cosmic Sudoku (debug)</string>');
    const main = read('android/app/src/main/res/values/strings.xml');
    expect(main).toContain('<string name="app_name">Cosmic Sudoku</string>');
    expect(main).toContain('<string name="title_activity_main">Cosmic Sudoku</string>');
  });

  it('backup rules include the Preferences file', () => {
    expect(read('android/app/src/main/res/xml/data_extraction_rules.xml')).toContain(
      'CapacitorStorage',
    );
    expect(read('android/app/src/main/res/xml/backup_rules.xml')).toContain('CapacitorStorage');
  });

  it('manifest backs up, points at the rules and forbids cleartext', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).toContain('android:allowBackup="true"');
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');
    expect(manifest).toContain('android:fullBackupContent="@xml/backup_rules"');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
  });

  it('config has no server.url and uses https', async () => {
    const { default: config } = await import('../capacitor.config.ts');
    expect(config.server).toBeDefined();
    expect(config.server).not.toHaveProperty('url');
    expect(config.server?.androidScheme).toBe('https');
  });

  it('minWebViewVersion is 117 and matches the in-app guard', async () => {
    const { default: config } = await import('../capacitor.config.ts');
    expect(config.android?.minWebViewVersion).toBe(117);
    expect(read('src/platform/webview-guard.ts')).toMatch(/MIN_WEBVIEW_MAJOR\s*=\s*117\b/);
  });

  it('release signing reads env vars and holds no literal password', () => {
    const gradle = read('android/app/build.gradle');
    for (const name of [
      'COSMIC_KEYSTORE_PATH',
      'COSMIC_KEYSTORE_PASSWORD',
      'COSMIC_KEY_ALIAS',
      'COSMIC_KEY_PASSWORD',
    ]) {
      expect(gradle).toContain(name);
    }
    const release = block(block(gradle, 'signingConfigs'), 'release');
    expect(release).not.toMatch(/(storePassword|keyPassword)\s*=?\s*["'][^"']/);
  });

  it('release builds are non-debuggable and shrunk by R8', () => {
    const release = block(block(read('android/app/build.gradle'), 'buildTypes'), 'release');
    expect(release).toMatch(/debuggable\s*=?\s*false/);
    expect(release).toMatch(/minifyEnabled\s*=?\s*true/);
    expect(release).toMatch(/shrinkResources\s*=?\s*true/);
  });

  it('versions come from env', () => {
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('COSMIC_VERSION_NAME');
    expect(gradle).toContain('COSMIC_VERSION_CODE');
  });
});
