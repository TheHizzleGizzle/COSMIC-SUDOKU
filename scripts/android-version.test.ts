import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { computeAndroidVersion } from './android-version.ts';

describe('computeAndroidVersion', () => {
  it.each([
    ['v1.2.3', '1.2.3', 1002003],
    ['v0.1.0', '0.1.0', 1000],
    ['v10.20.30', '10.20.30', 10020030],
    ['v0.0.1', '0.0.1', 1],
    ['v1.999.999', '1.999.999', 1999999],
    ['v2100.0.0', '2100.0.0', 2_100_000_000],
  ])('%s → versionName %s, versionCode %i', (tag, versionName, versionCode) => {
    expect(computeAndroidVersion(tag)).toEqual({ versionName, versionCode });
  });

  it('falls back to 0.0.0 / 1 when there is no tag', () => {
    expect(computeAndroidVersion(undefined)).toEqual({ versionName: '0.0.0', versionCode: 1 });
  });

  it.each([
    ['no leading v', '1.2.3'],
    ['two parts', 'v1.2'],
    ['pre-release suffix', 'v1.2.3-rc1'],
    ['leading zero in major', 'v01.2.3'],
    ['leading zero in minor', 'v1.02.3'],
    ['leading zero in patch', 'v1.2.03'],
    ['minor of 1000', 'v1.1000.0'],
    ['patch of 1000', 'v1.0.1000'],
    ['versionCode above 2,100,000,000', 'v2100.0.1'],
    ['major so large it is not a safe integer', `v${'9'.repeat(400)}.0.0`],
    ['versionCode of 0', 'v0.0.0'],
    ['empty string', ''],
    ['a branch name', 'main'],
    ['trailing newline', 'v1.2.3\n'],
    ['surrounding spaces', ' v1.2.3 '],
    ['negative part', 'v1.-2.3'],
  ])('rejects %s (%j)', (_why, tag) => {
    expect(() => computeAndroidVersion(tag)).toThrow(/Invalid release tag/);
  });
});

describe('android-version CLI', () => {
  const script = new URL('./android-version.ts', import.meta.url).pathname;

  it('prints the two variables for Gradle and the workflows', () => {
    const out = execFileSync(process.execPath, [script, 'v1.2.3'], { encoding: 'utf8' });
    expect(out).toBe('COSMIC_VERSION_NAME=1.2.3\nCOSMIC_VERSION_CODE=1002003\n');
  });

  it('prints the development fallback when no tag is given', () => {
    const out = execFileSync(process.execPath, [script], { encoding: 'utf8' });
    expect(out).toBe('COSMIC_VERSION_NAME=0.0.0\nCOSMIC_VERSION_CODE=1\n');
  });

  it('exits 1 with a message and no output on a bad tag', () => {
    const result = spawnSync(process.execPath, [script, 'v1.2.3-rc1'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Invalid release tag');
  });
});
