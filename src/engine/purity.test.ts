import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN = ['Math.random', 'Date', 'performance', 'setTimeout', 'setInterval'] as const;

/** Returns each forbidden engine token found in `source`, in the order of FORBIDDEN. */
function findForbidden(source: string): string[] {
  return FORBIDDEN.filter((token) =>
    new RegExp(`\\b${token.replaceAll('.', '\\.')}\\b`).test(source),
  );
}

describe('engine purity', () => {
  it('findForbidden detects each forbidden token', () => {
    expect(findForbidden('Math.random()')).toEqual(['Math.random']);
    expect(findForbidden('new Date()')).toEqual(['Date']);
    expect(findForbidden('performance.now()')).toEqual(['performance']);
    expect(findForbidden('setTimeout(f)')).toEqual(['setTimeout']);
    expect(findForbidden('const date = 1')).toEqual([]);
  });

  it('engine sources contain no forbidden tokens', () => {
    const engineDir = import.meta.dirname;
    const files = readdirSync(engineDir, { recursive: true, encoding: 'utf8' }).filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.test.ts'),
    );
    expect(files).toContain('index.ts');
    for (const file of files) {
      expect({ file, found: findForbidden(readFileSync(join(engineDir, file), 'utf8')) }).toEqual({
        file,
        found: [],
      });
    }
  });
});
