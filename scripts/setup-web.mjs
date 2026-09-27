// Copies Skia's CanvasKit wasm into public/ so the web preview (`npm run web`) can render Skia.
// Android and iOS don't need this. Run: npm run web:setup
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));
const src = join(dirname(require.resolve('canvaskit-wasm/package.json')), 'bin', 'full', 'canvaskit.wasm');
mkdirSync(join(root, 'public'), { recursive: true });
copyFileSync(src, join(root, 'public', 'canvaskit.wasm'));
console.log('Copied canvaskit.wasm to public/');
