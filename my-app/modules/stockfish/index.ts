import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class StockfishModule extends NativeModule {
  /** Best move in UCI notation (e.g. "e7e5"), or null if the engine failed. */
  getBestMove(fen: string, thinkTimeMs: number): Promise<string | null>;
  /** Whether the bundled Stockfish binary is present on this device. */
  isAvailable(): Promise<boolean>;
}

/**
 * The Stockfish Expo module (android/.../StockfishModule.kt).
 * Android only for now, so this is null on iOS and web.
 */
export default requireOptionalNativeModule<StockfishModule>('Stockfish');
