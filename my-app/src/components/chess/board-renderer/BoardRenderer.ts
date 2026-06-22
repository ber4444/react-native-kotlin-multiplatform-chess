// Backend-neutral 3D board seam (plan §6). One active implementation:
//   - ThreeJsBoardRenderer (web/Electron) — wraps window.chess3d
// The native iOS/Android path renders directly as a React component (<Board3D/>)
// rather than through this imperative interface.
//
// Both paths consume the SAME Kotlin `SceneDto`; chess logic never knows which
// engine is underneath.

import type { CameraView, SceneDto } from '@/chess-core';

/** Selected-square highlight (visual only); row*8+col convention, or null. */
export interface SelectedSquare {
  row: number;
  col: number;
}

export interface BoardRenderer {
  /**
   * Build the surface — `view` is the host element (a DOM HTMLElement on web;
   * unused on native where Filament renders into its own <FilamentView>). Resolves
   * true once the renderer can accept setScene/setCamera, false on init failure
   * (the host then falls back to the 2D board — plan §7.3, §12).
   */
  init(view: unknown): Promise<boolean>;

  /** Push the latest scene model. Reconciles the piece pool against `scene.pieces`. */
  setScene(scene: SceneDto): void;

  /** Push the latest camera (Kotlin-owned; never hardcode an engine-side FOV). */
  setCamera(camera: CameraView): void;

  /** Highlight a square (visual only) or clear it. */
  setSelected(square: SelectedSquare | null): void;

  /** Viewport resized — update aspect + drawing buffer. */
  resize(widthPx: number, heightPx: number): void;

  /** Release GPU resources; renderer is unusable afterwards. */
  dispose(): void;
}

/** Factory signature so `<Board3D/>` can create the right impl per platform. */
export type BoardRendererFactory = () => BoardRenderer;
