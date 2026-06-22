// Web factory (plan §6). Returns the three.js BoardRenderer — real WebGL, full
// post-FX chain, no expo-gl. The native counterpart (createBoardRenderer.ts)
// returns the Filament impl instead, so three.js never enters the native bundle.

import type { BoardRendererFactory } from './BoardRenderer';
import { ThreeJsBoardRenderer } from './ThreeJsBoardRenderer.web';

export const createBoardRenderer: BoardRendererFactory = () => new ThreeJsBoardRenderer();
