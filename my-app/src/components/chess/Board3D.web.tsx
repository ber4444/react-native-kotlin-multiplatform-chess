// Web 3D board host. Owns the DOM surface + gestures; delegates rendering to the
// BoardRenderer interface (plan §6) — ThreeJsBoardRenderer via createBoardRenderer.
// On each snapshot we push setScene(currentScene()) + setCamera(currentCamera());
// tap/drag/zoom forward into the Kotlin OrbitCameraController + BoardRayPicker so
// 2D and 3D selection stay in sync.

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ChessSession, ChessSnapshot } from '@/chess-core';

import { ChessLoader } from './ChessLoader';
import { createBoardRenderer } from './board-renderer/createBoardRenderer.web';
import type { BoardRenderer } from './board-renderer/BoardRenderer';

interface Board3DProps {
  session: ChessSession;
  snapshot: ChessSnapshot;
  onSquareTapped: (row: number, col: number) => void;
}

const CONTAINER_ID = 'chess-3d-canvas-host';

function pushSceneAndCamera(renderer: BoardRenderer, session: ChessSession) {
  renderer.setScene(session.currentScene());
  renderer.setCamera(session.currentCamera());
}

export function Board3D({ session, snapshot, onSquareTapped }: Board3DProps) {
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const rendererRef = useRef<BoardRenderer | null>(null);

  useEffect(() => {
    let disposed = false;
    let detachGestures: (() => void) | null = null;
    const renderer = createBoardRenderer();
    rendererRef.current = renderer;

    const host = document.getElementById(CONTAINER_ID);
    if (!host) return;

    renderer.init(host).then((ok) => {
      if (disposed || !ok) return;
      const rect = host.getBoundingClientRect();
      renderer.resize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)));
      session.cameraResize(rect.width / Math.max(1, rect.height));
      pushSceneAndCamera(renderer, session);
      detachGestures = attachGestureHandlers(host, session, onSquareTapped, renderer);
      readyRef.current = true;
      setReady(true);
    });

    return () => {
      disposed = true;
      detachGestures?.();
      renderer.dispose();
      rendererRef.current = null;
      readyRef.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push scene + camera on every snapshot change.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !readyRef.current) return;
    pushSceneAndCamera(renderer, session);
  }, [snapshot, session]);

  // In 3D mode the animation "completes" once the encoded scene reaches its
  // resting state — mirror the wasm path's short delay before animationEnd().
  useEffect(() => {
    if (!snapshot.animating || !readyRef.current) return;
    const id = setTimeout(() => session.animationEnd(), 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.animating]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <View id={CONTAINER_ID} style={StyleSheet.absoluteFill} />
      {!ready && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ChessLoader text="Loading 3D Engine" />
        </View>
      )}
    </View>
  );
}

/**
 * Wires DOM pointer/wheel events on the renderer surface to the Kotlin
 * OrbitCameraController (drag/zoom) and BoardRayPicker (tap). Returns a cleanup
 * fn that detaches everything. Drag/zoom re-push scene+camera each event.
 */
function attachGestureHandlers(
  host: HTMLElement,
  session: ChessSession,
  onSquareTapped: (row: number, col: number) => void,
  renderer: BoardRenderer,
): () => void {
  let lastX = 0, lastY = 0, downX = 0, downY = 0, downT = 0, dragging = false;

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    downX = e.clientX; downY = e.clientY; downT = Date.now();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const rect = host.getBoundingClientRect();
    const dx = (e.clientX - lastX) / rect.width;
    const dy = (e.clientY - lastY) / rect.height;
    if (dx !== 0 || dy !== 0) {
      session.cameraDrag(dx, dy);
      pushSceneAndCamera(renderer, session);
    }
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    const elapsed = Date.now() - downT;
    if (moved < 8 && elapsed < 300) {
      const rect = host.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width;
      const yNorm = (e.clientY - rect.top) / rect.height;
      const idx = session.pickSquareFromRay(xNorm, yNorm);
      if (idx >= 0 && idx < 64) {
        onSquareTapped(Math.floor(idx / 8), idx % 8);
        pushSceneAndCamera(renderer, session);
      }
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    session.cameraZoom(e.deltaY > 0 ? 1.1 : 0.9);
    pushSceneAndCamera(renderer, session);
  };

  host.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('pointermove', onPointerMove);
  host.addEventListener('pointerup', onPointerUp);
  host.addEventListener('pointercancel', onPointerUp);
  host.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    host.removeEventListener('pointerdown', onPointerDown);
    host.removeEventListener('pointermove', onPointerMove);
    host.removeEventListener('pointerup', onPointerUp);
    host.removeEventListener('pointercancel', onPointerUp);
    host.removeEventListener('wheel', onWheel);
  };
}
