// Derives a Metro-bundleable copy of the single-source-of-truth three.js renderer
// (compose-multiplatform-chess/tools/chess3d-renderer/chess3d-renderer.js) into the
// RN app. Mirrors the chess repo's build.mjs fan-out: the source file is untouched,
// this script produces a derived `.generated.js` whose only change is rewriting
// the bare specifier `three/addons/*` → `three/examples/jsm/*` (the path the
// installed `three` npm package exposes). Run with: node scripts/prepare-3d-renderer.js
//
// This keeps the renderer the single source of truth (plan §14) while letting
// Metro (RN's bundler) resolve it without a custom resolver.

const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(
  __dirname,
  '../../../compose-multiplatform-chess/tools/chess3d-renderer/chess3d-renderer.js',
);
const OUT_DIR = path.resolve(__dirname, '../src/components/chess/three-renderer');
const OUT_FILE = path.join(OUT_DIR, 'chess3d-renderer.generated.js');

const source = fs.readFileSync(SOURCE, 'utf8');

if (source.includes('$') || source.includes('```')) {
  // Same safety net as build.mjs (the wasm raw-string splice needs these absent).
  // Not strictly required for Metro, but guards the source-file contract.
  console.warn('warning: source contains $ or backticks — check the generated output.');
}

const rewritten = source.replace(
  /from ['"]three\/addons\//g,
  "from 'three/examples/jsm/",
);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, rewritten);
console.log(
  `Wrote ${path.relative(process.cwd(), OUT_FILE)} ` +
    `(${rewritten.length} bytes, ` +
    `${(rewritten.match(/three\/examples\/jsm\//g) || []).length} addon imports rewritten)`,
);
