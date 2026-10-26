import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/** Initial JS budget for the production bundle, in gzipped bytes (spec §8.4). */
export const BUDGET_BYTES = 150_000;

/** Sum of the gzip sizes of every `.js` file in `<dir>/assets`. */
export function gzipBytes(dir: string): number {
  const assets = join(dir, 'assets');
  return readdirSync(assets)
    .filter((name) => name.endsWith('.js'))
    .reduce((total, name) => total + gzipSync(readFileSync(join(assets, name))).length, 0);
}

if (import.meta.main) {
  const bytes = gzipBytes('dist');
  console.log(`Initial JS: ${bytes} bytes gzipped (budget ${BUDGET_BYTES}).`);
  if (bytes > BUDGET_BYTES) {
    console.error(`Over budget by ${bytes - BUDGET_BYTES} bytes.`);
    process.exit(1);
  }
}
