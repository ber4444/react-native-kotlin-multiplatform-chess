// Typed gateway to the Kotlin/JS chess-core library.
//
// The Kotlin/JS `@JsExport` facade (ChessSession + its DTOs) lives under the
// `com.example.myapplication` namespace. The `.d.ts` TypeScript declarations for it are GENERATED
// from the Kotlin source by KGP's `generateTypeScriptDefinitions()` (see chess-core/build.gradle.kts)
// and copied here by Gradle's `copyJsToApp` task → `src/generated/chess-core/chess-core.d.ts`.
//
// This file is now a THIN re-export layer: it loads the JS module, surfaces the `ChessSession`
// constructor as a value, and re-exports the generated types so the rest of the app imports
// fully-typed chess primitives from `@/chess-core`. When the Kotlin API changes, the `.d.ts`
// regenerates on the next `npm run build:core` — no hand-maintained types to keep in sync.
//
// Rebuild the bundle with `npm run build:core` (runs the Gradle `copyJsToApp` task).

// The generated JS module. Its `.d.ts` ships the types under `com.example.myapplication`.
import coreModule from '@/generated/chess-core/chess-core.js';
// The generated TypeScript declarations (chess-core.d.ts next to the .js). Importing the `com`
// namespace type directly lets us reference both classes AND interfaces under it — `typeof` on a
// namespace only sees value members (class constructor sides), which hides interfaces.
import type { com } from '@/generated/chess-core/chess-core';

/** The Kotlin package namespace the @JsExport declarations live under (constructor-value side). */
const ns = (coreModule as unknown as {
  'com': { 'example': { 'myapplication': typeof com.example.myapplication } },
}).com.example.myapplication;

// Re-export every generated type under the names the app already imports. KGP emits each @JsExport
// `class` as a TS class (constructor value + instance type) and `fun interface`s as TS interfaces;
// referencing them through the namespace type gives the instance shape in both cases. The qualified
// path must be written in full (a type alias of a namespace can't be re-used as a namespace).
export type PieceDto = com.example.myapplication.PieceDto;
export type CameraView = com.example.myapplication.CameraView;
export type PieceInstanceDto = com.example.myapplication.PieceInstanceDto;
export type SceneDto = com.example.myapplication.SceneDto;
export type ChessSnapshot = com.example.myapplication.ChessSnapshot;
export type ChessSession = com.example.myapplication.ChessSession;
/**
 * JS-side chess engine (e.g. a Stockfish worker bridge). Re-exported verbatim from the generated
 * declarations so it matches `ChessSession.attachEngine`'s parameter type. KGP emits a Kotlin
 * interface as a TS interface carrying an internal `__doNotUseOrImplementIt` marker symbol; don't
 * construct one by hand — use [createJsChessEngine].
 */
export type JsChessEngine = com.example.myapplication.JsChessEngine;

/**
 * Builds a [JsChessEngine] from a plain `getBestMove` function. The generated TS interface carries
 * a Kotlin-internal marker symbol (`__doNotUseOrImplementIt`) that plain object literals can't
 * satisfy; this factory casts it away so call sites stay clean. The runtime shape is identical —
 * Kotlin only reads `getBestMove`.
 */
export function createJsChessEngine(
  getBestMove: (fen: string, thinkTimeMs: number) => Promise<string | null>,
): JsChessEngine {
  return { getBestMove } as unknown as JsChessEngine;
}

// The `ChessSession` constructor (a value, not a type). Idiomatic TS declaration merge: the type
// above is the instance shape, this const is the constructable value — exactly like a class.
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional declaration merge
export const ChessSession: { new (): ChessSession } = ns.ChessSession;

// The DTO constructors. The generated types are TS classes (not structural interfaces), so a
// consumer that needs to build a DTO instance (e.g. projecting a portrait-mode CameraView) must
// call `new CameraView(...)` rather than pass a plain object literal. Export the constructors so
// consumers don't reach into the namespace directly.
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional declaration merge
export const CameraView: typeof com.example.myapplication.CameraView = ns.CameraView;

/** One legal-move target for the selected square (row, col pair). RN-side convenience view over
 *  the flat `legalMoves` Int32Array on ChessSnapshot. */
export interface LegalMove {
  row: number;
  col: number;
}

/** Flattens the snapshot's `legalMoves` Int32Array (`[r1,c1, r2,c2, …]`) into `{row, col}` pairs. */
export function parseLegalMoves(snapshot: ChessSnapshot): LegalMove[] {
  const flat = snapshot.legalMoves as number[] | Int32Array;
  const moves: LegalMove[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    moves.push({ row: flat[i], col: flat[i + 1] });
  }
  return moves;
}
