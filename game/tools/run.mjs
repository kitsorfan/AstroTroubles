// Runs a TypeScript tool from game/tools: `node game/tools/run.mjs levelcheck [args]`.
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [tool, ...rest] = process.argv.slice(2);
if (!tool) {
  console.error('usage: node game/tools/run.mjs <tool> [args]');
  process.exit(1);
}
const out = await build({ entryPoints: [join(here, `${tool}.ts`)], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'error' });
const dir = mkdtempSync(join(tmpdir(), 'starbloom-'));
const file = join(dir, `${tool}.mjs`);
writeFileSync(file, out.outputFiles[0].text);
process.argv = [process.argv[0], file, ...rest];
try {
  await import(pathToFileURL(file).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
