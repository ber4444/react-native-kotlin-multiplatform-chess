// React bindings for the Kotlin/JS ChessSession. The session is a singleton
// (one game per app lifetime); useChessSnapshot subscribes and re-renders on
// every state change emitted from the Kotlin core.

import { useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

import { ChessSession, createJsChessEngine, type ChessSnapshot } from '@/chess-core';

declare global {
  interface Window {
    desktopBridge?: {
      isElectron: boolean;
      getBestMove: (fen: string, thinkTimeMs: number) => Promise<string | null>;
    };
  }
}

/** Android Stockfish native module (StockfishModule.kt → NativeModules.StockfishAndroid). */
interface StockfishAndroidModule {
  getBestMove(fen: string, thinkTimeMs: number): Promise<string | null>;
  isAvailable(): Promise<boolean>;
}

let sessionInstance: ChessSession | null = null;

/** Returns the process-wide ChessSession singleton (lazily created). */
export function getChessSession(): ChessSession {
  if (!sessionInstance) {
    sessionInstance = new ChessSession();
    attachPlatformEngine(sessionInstance);
  }
  return sessionInstance;
}

/**
 * Attaches the platform's Stockfish engine (if available) so Black plays
 * engine-strength moves. On any platform without Stockfish, the Kotlin core's
 * pickMoveCPU fallback handles Black's moves (plan §9).
 */
function attachPlatformEngine(session: ChessSession) {
  // Electron desktop — system stockfish via Node child_process (electron/main.cjs).
  if (typeof window !== 'undefined' && window.desktopBridge?.getBestMove) {
    const bridge = window.desktopBridge;
    session.attachEngine(createJsChessEngine((fen, thinkTimeMs) => bridge.getBestMove(fen, thinkTimeMs)));
    return;
  }
  // Android — libstockfish.so via the StockfishAndroid native module.
  if (Platform.OS === 'android') {
    const sf = NativeModules.StockfishAndroid as StockfishAndroidModule | undefined;
    if (sf?.getBestMove) {
      session.attachEngine(createJsChessEngine((fen, thinkTimeMs) => sf.getBestMove!(fen, thinkTimeMs)));
    }
  }
  // iOS — ChessKit Stockfish native module would go here (P5 future work).
  // Web — stockfish.js Web Worker would go here (reuses the wasm engine assets).
}

/**
 * Subscribes to the chess-core snapshot stream. The initial value is read
 * synchronously via getSnapshot() so the first render has real state; updates
 * arrive through subscribe() (asynchronously, from the Kotlin coroutine scope).
 */
export function useChessSnapshot(session: ChessSession = getChessSession()): ChessSnapshot {
  const [snapshot, setSnapshot] = useState<ChessSnapshot>(() => session.getSnapshot());

  useEffect(() => {
    const unsubscribe = session.subscribe(setSnapshot);
    return unsubscribe;
  }, [session]);

  return snapshot;
}

/** Invalid-position sentinel mirroring the Kotlin INVALID_POSITION constant. */
export const INVALID_POSITION = -9;
