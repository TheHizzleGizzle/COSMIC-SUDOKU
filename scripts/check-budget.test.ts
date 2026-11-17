import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUDGET_BYTES, gzipBytes } from './check-budget.ts';

describe('check-budget', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'budget-'));
    mkdirSync(join(dir, 'assets'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns the exact gzip size of a .js asset', () => {
    const content = 'console.log("cosmic");\n'.repeat(200);
    writeFileSync(join(dir, 'assets', 'index-abc123.js'), content);
    expect(gzipBytes(dir)).toBe(gzipSync(Buffer.from(content)).length);
  });

  it('sums every .js asset and ignores other files', () => {
    const a = 'export const a = 1;\n'.repeat(100);
    const b = 'export const b = 2;\n'.repeat(150);
    writeFileSync(join(dir, 'assets', 'a.js'), a);
    writeFileSync(join(dir, 'assets', 'b.js'), b);
    writeFileSync(join(dir, 'assets', 'style.css'), 'body{margin:0}'.repeat(500));
    writeFileSync(join(dir, 'assets', 'a.js.map'), '{"version":3}'.repeat(500));
    writeFileSync(join(dir, 'index.html'), '<!doctype html>'.repeat(500));
    expect(gzipBytes(dir)).toBe(gzipSync(Buffer.from(a)).length + gzipSync(Buffer.from(b)).length);
  });

  it('keeps the initial JS budget at 150,000 bytes', () => {
    expect(BUDGET_BYTES).toBe(150000);
  });
});
