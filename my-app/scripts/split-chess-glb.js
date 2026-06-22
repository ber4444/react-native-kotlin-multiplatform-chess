// Splits chess.glb into board.glb + 12 per-piece-type-color glbs for RN Filament
// instancing. RN Filament's <ModelInstance> instances the whole model and shares
// one material across instances, so we bake the colour (white/black) into separate
// glbs: king_white.glb, king_black.glb, etc. The board (tiles + frame) is its own
// glb with the 6 piece templates AND the stray "Plane" removed. "Plane" is a
// leftover shadow-catcher quad that the IBL-only lighting doesn't need; left in, it
// renders as a square outside the board on Filament (the three.js renderer hides the
// same node by name — see HIDDEN_NODES in chess3d-renderer.generated.js).
//
// Run: node scripts/split-chess-glb.js
// Source: assets/3d/chess.glb  →  Output: assets/3d/split/*.glb

const fs = require('fs');
const path = require('path');
const { NodeIO } = require('@gltf-transform/core');
const { prune, dedup } = require('@gltf-transform/functions');

const SRC = path.resolve(__dirname, '../assets/3d/chess.glb');
const OUT_DIR = path.resolve(__dirname, '../assets/3d/split');

const PIECES = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
const COLORS = ['white', 'black'];
// Board keeps everything that isn't a piece template or the stray "Plane" quad.
const BOARD_EXCLUDE = new Set([...PIECES, 'Plane']);

const io = new NodeIO();

async function makeBoard() {
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  for (const node of root.listNodes()) {
    if (BOARD_EXCLUDE.has(node.getName())) {
      node.setMesh(null);
      node.dispose();
    }
  }
  await doc.transform(prune(), dedup());
  io.write(path.join(OUT_DIR, 'board.glb'), doc);
  console.log('wrote board.glb');
}

async function makePiece(pieceName, color) {
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  const pieceNode = root.listNodes().find((n) => n.getName() === pieceName);
  if (!pieceNode) throw new Error(`node ${pieceName} not found`);
  const mesh = pieceNode.getMesh();
  const colorMaterial = root.listMaterials().find((m) => m.getName() === color);
  if (!colorMaterial) throw new Error(`material ${color} not found`);
  // Bake the colour into the piece mesh's primitives.
  for (const prim of mesh.listPrimitives()) {
    prim.setMaterial(colorMaterial);
  }
  // Remove every node except the piece.
  for (const node of root.listNodes()) {
    if (node.getName() !== pieceName) {
      node.setMesh(null);
      node.dispose();
    }
  }
  await doc.transform(prune(), dedup());
  io.write(path.join(OUT_DIR, `${pieceName}_${color}.glb`), doc);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await makeBoard();
  for (const piece of PIECES) {
    for (const color of COLORS) {
      await makePiece(piece, color);
    }
  }
  console.log(`\nSplit complete. Output: ${path.relative(process.cwd(), OUT_DIR)}/`);
  for (const f of fs.readdirSync(OUT_DIR).sort()) {
    const stat = fs.statSync(path.join(OUT_DIR, f));
    console.log(`  ${f.padEnd(22)} ${(stat.size / 1024).toFixed(1)} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
