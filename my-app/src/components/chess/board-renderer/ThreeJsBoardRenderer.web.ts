// Web/Electron BoardRenderer impl — wraps the single-source-of-truth
// chess3d-renderer.js (`window.chess3d`). Implements the backend-neutral
// BoardRenderer interface (plan §6) so <Board3D/> never knows it's three.js.
//
// The renderer module is imported dynamically inside init() so its top-level
// `window.chess3d = {...}` only evaluates on the client (no SSR crash).

import type { BoardRenderer, SelectedSquare } from './BoardRenderer';
import type { CameraView, SceneDto } from '@/chess-core';

interface Chess3DHandle {
  init(canvas: HTMLCanvasElement): Promise<boolean>;
  setScene(s: string): void;
  setCamera(
    px: number, py: number, pz: number,
    tx: number, ty: number, tz: number,
    ux: number, uy: number, uz: number,
    fov: number, aspect: number,
  ): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

declare global {
  interface Window {
    chess3d?: Chess3DHandle;
  }
}

/**
 * Encodes a SceneDto into the compact wire form `window.chess3d.setScene`
 * consumes — identical format to Kotlin's `Board3DScene.encode()`:
 * `kind,color,x,y,z,rotationYDegrees` records joined by `;`. Keeping a TS mirror
 * here avoids coupling the renderer to the session and is ~6 lines.
 */
function encodeScene(scene: SceneDto): string {
  let out = '';
  for (let i = 0; i < scene.pieces.length; i++) {
    const p = scene.pieces[i];
    if (i > 0) out += ';';
    out += `${p.kind},${p.color},${p.x},${p.y},${p.z},${p.rotationYDegrees}`;
  }
  return out;
}

export class ThreeJsBoardRenderer implements BoardRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private handle: Chess3DHandle | null = null;

  async init(view: unknown): Promise<boolean> {
    // Dynamic import: the renderer module assigns `window.chess3d` at top level,
    // so it must not evaluate during SSR.
    await import('../three-renderer/chess3d-renderer.generated');
    const chess3d = window.chess3d;
    const container = view as HTMLElement | null;
    if (!chess3d || !container) return false;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);
    this.canvas = canvas;
    this.handle = chess3d;

    try {
      return await chess3d.init(canvas);
    } catch {
      return false;
    }
  }

  setScene(scene: SceneDto): void {
    this.handle?.setScene(encodeScene(scene));
  }

  setCamera(c: CameraView): void {
    this.handle?.setCamera(
      c.px, c.py, c.pz, c.tx, c.ty, c.tz, c.ux, c.uy, c.uz, c.fov, c.aspect,
    );
  }

  // three.js selection highlight isn't driven through BoardRenderer (the bounce
  // is baked into the encoded scene when the Kotlin side lifts the piece).
  setSelected(_square: SelectedSquare | null): void {
    /* no-op for the three.js backend */
  }

  resize(w: number, h: number): void {
    this.handle?.resize(w, h);
  }

  dispose(): void {
    this.handle?.dispose();
    this.canvas?.remove();
    this.canvas = null;
    this.handle = null;
  }
}
