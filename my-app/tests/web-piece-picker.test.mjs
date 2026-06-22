import assert from 'node:assert/strict';
import test from 'node:test';

import { pickWebSquare } from '../src/components/chess/webPiecePicker.ts';

const camera = {
  px: 0,
  py: 12 * Math.sin(33 * Math.PI / 180),
  pz: 12 * Math.cos(33 * Math.PI / 180),
  tx: 0,
  ty: 0,
  tz: 0,
  ux: 0,
  uy: 1,
  uz: 0,
  fov: 50,
  aspect: 1280 / 900,
};

function sessionWith(pieces, fallback) {
  return {
    currentCamera: () => camera,
    currentScene: () => ({ pieces }),
    pickSquareFromRay: () => fallback,
  };
}

test('natural click on the visible g1 knight selects g1', () => {
  const knight = { kind: 4, color: 0, row: 7, col: 6, x: 2.5, y: 0, z: 3.5, rotationYDegrees: 0 };
  const pawn = { kind: 5, color: 0, row: 6, col: 6, x: 2.5, y: 0, z: 2.5, rotationYDegrees: 0 };

  const picked = pickWebSquare(sessionWith([knight, pawn], 54), 921 / 1280, 580 / 900);

  assert.equal(picked, 62);
});

test('natural click on the visible a2 pawn selects a2', () => {
  const rook = { kind: 2, color: 0, row: 7, col: 0, x: -3.5, y: 0, z: 3.5, rotationYDegrees: 0 };
  const pawn = { kind: 5, color: 0, row: 6, col: 0, x: -3.5, y: 0, z: 2.5, rotationYDegrees: 0 };

  const picked = pickWebSquare(sessionWith([rook, pawn], 40), 283 / 1280, 520 / 900);

  assert.equal(picked, 48);
});

test('empty-board taps fall back to the shared square picker', () => {
  const picked = pickWebSquare(sessionWith([], 45), 0.5, 0.5);

  assert.equal(picked, 45);
});
