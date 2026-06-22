// Typed gateway to the Kotlin/JS chess-core library.
//
// The Kotlin/JS `@JsExport` facade lives under the `com.example.myapplication`
// namespace (package-qualified export). This module loads the UMD bundle that
// Gradle copies into `src/generated/chess-core/`, navigates to that namespace,
// and re-exports the `ChessSession` constructor + DTO types so the rest of the
// app imports fully-typed chess primitives from `@/chess-core`.
//
// Rebuild the bundle with `npm run build:core` (runs the Gradle `copyJsToApp` task).

// @ts-ignore — Kotlin/JS UMD output ships without TypeScript declarations.
import coreModule from '@/generated/chess-core/chess-core.js';

const ns = (coreModule as { com: { example: { myapplication: any } } })
  .com.example.myapplication;

/** A single piece on the board. `kind` ∈ KING|QUEEN|ROOK|BISHOP|KNIGHT|PAWN. */
export interface PieceDto {
  kind: string;
  color: 'WHITE' | 'BLACK';
  row: number;
  col: number;
}

/** Camera params the three.js renderer projects with. */
export interface CameraView {
  px: number; py: number; pz: number;
  tx: number; ty: number; tz: number;
  ux: number; uy: number; uz: number;
  fov: number;
  aspect: number;
}

/** One piece in the 3D scene (plan §6). kind = PieceKind ordinal, color 0/1. */
export interface PieceInstanceDto {
  kind: number;   // 0=KING, 1=QUEEN, 2=ROOK, 3=BISHOP, 4=KNIGHT, 5=PAWN
  color: number;  // 0=WHITE, 1=BLACK
  row: number;
  col: number;
  x: number;
  y: number;
  z: number;
  rotationYDegrees: number;
}

/**
 * The ONE scene model both renderers consume (plan §6). Filament iterates
 * `pieces` for its `<ModelInstance>` pool; three.js uses `currentSceneEncoded()`.
 */
export interface SceneDto {
  pieces: PieceInstanceDto[];
  sideToMove: number;   // 0=WHITE, 1=BLACK
  selectedRow: number;
  selectedCol: number;
  hasSelection: boolean;
}

/** One legal-move target for the selected square (row, col pair). */
export interface LegalMove {
  row: number;
  col: number;
}

/** Immutable UI snapshot pushed from the Kotlin core on every state change. */
export interface ChessSnapshot {
  turn: 'WHITE' | 'BLACK';
  winState: 'NONE' | 'WHITE' | 'BLACK' | 'DRAW' | 'STALEMATE';
  piecesWhite: PieceDto[];
  piecesBlack: PieceDto[];
  selectedRow: number;
  selectedCol: number;
  hasSelection: boolean;
  legalMoves: Int32Array | number[];
  pendingPromotion: boolean;
  drawOfferBy: 'WHITE' | 'BLACK' | null;
  drawOfferDeclinedBy: 'WHITE' | 'BLACK' | null;
  show3D: boolean;
  board3DUnavailable: boolean;
  moveButtonLock: boolean;
  animating: boolean;
  animKind: string;
  animColor: 'WHITE' | 'BLACK' | '';
  animFromRow: number;
  animFromCol: number;
  animToRow: number;
  animToCol: number;
  animSecondary: boolean;
  animSecondaryKind: string;
  animSecondaryFromRow: number;
  animSecondaryFromCol: number;
  animSecondaryToRow: number;
  animSecondaryToCol: number;
  fen: string;
}

/** JS-side chess engine (e.g. a Stockfish worker bridge). */
export interface JsChessEngine {
  getBestMove(fen: string, thinkTimeMs: number): Promise<string | null>;
}

/** The ChessSession facade from the Kotlin core. */
export interface ChessSession {
  subscribe(cb: (snapshot: ChessSnapshot) => void): () => void;
  getSnapshot(): ChessSnapshot;
  currentScene(): SceneDto;
  currentSceneEncoded(): string;
  currentCamera(): CameraView;
  currentFen(): string;
  selectSquare(row: number, col: number): void;
  clearSelection(): void;
  playerMove(fromRow: number, fromCol: number, toRow: number, toCol: number): void;
  promote(typeOrdinal: number): void;
  cancelPromotion(): void;
  animationEnd(): void;
  offerDraw(): void;
  acceptDrawOffer(): void;
  declineDrawOffer(): void;
  resetGame(): void;
  hideWindow(): void;
  setShow3D(enabled: boolean): void;
  markBoard3DUnavailable(): void;
  cameraDrag(dx: number, dy: number): void;
  cameraZoom(factor: number): void;
  cameraResize(aspect: number): void;
  pickSquareFromRay(xNorm: number, yNorm: number): number;
  attachEngine(engine: JsChessEngine | null): void;
  close(): void;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional declaration merge: interface is the instance type, const is the constructor value (idiomatic TS, like a class).
export const ChessSession: { new (): ChessSession } = ns.ChessSession;
export function parseLegalMoves(snapshot: ChessSnapshot): LegalMove[] {
  const flat = snapshot.legalMoves as number[] | Int32Array;
  const moves: LegalMove[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    moves.push({ row: flat[i], col: flat[i + 1] });
  }
  return moves;
}
