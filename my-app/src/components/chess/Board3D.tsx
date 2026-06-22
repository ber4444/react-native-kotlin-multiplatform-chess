// Native 3D board (iOS/Android) — RN Filament.
//
// Renders the split board.glb + 12 instanced per-piece-type-colour pools driven
// by the Kotlin SceneDto, lit by papermill IBL, framed by a skybox.
//
// Camera control (plan §6): drag orbits the camera (yaw/pitch) and pinch zooms,
// forwarded into the Kotlin OrbitCameraController via session.cameraDrag/
// cameraZoom, then read back via session.currentCamera() and applied to the
// Filament Camera. Routing through Kotlin keeps render and tap-picking in sync
// (both see the same camera) — never raycast or animate inside Filament.
//
// ── Why transforms are applied IMPERATIVELY (this is the floating-piece fix) ──
// react-native-filament's declarative transform props (<ModelInstance translate/
// scale/rotate>) default to `multiplyWithCurrentTransform = true`: each time a
// prop VALUE changes, the new transform is *multiplied onto the entity's current
// transform* rather than replacing it (see RNFTransformManagerImpl.cpp:
// `newTransform = multiplyCurrent ? transform * currentTransform : transform`).
// During a move we update the moving piece's `translate` ~60×/sec, so the
// translations accumulate (T(p₆₀)·…·T(p₁)·T(rest)) and the piece launches off
// the board. Static pieces are spared only because their array is referentially
// stable. The robust fix is to bypass the prop system and set each instance's
// FULL transform absolutely via TransformManager.setTransform (which replaces).

import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  FilamentScene,
  FilamentView,
  DefaultLight,
  Camera,
  Model,
  Skybox,
  EnvironmentalLight,
  ModelRenderer,
  useModel,
  useFilamentContext,
  getAssetFromModel,
} from 'react-native-filament';

import type { ChessSession, ChessSnapshot, PieceInstanceDto, CameraView } from '@/chess-core';

/* eslint-disable @typescript-eslint/no-var-requires */
const BOARD_GLB = require('../../../assets/3d/split/board.glb');
const PIECE_GLBS: Record<string, number> = {
  '0_0': require('../../../assets/3d/split/king_white.glb'),
  '0_1': require('../../../assets/3d/split/king_black.glb'),
  '1_0': require('../../../assets/3d/split/queen_white.glb'),
  '1_1': require('../../../assets/3d/split/queen_black.glb'),
  '2_0': require('../../../assets/3d/split/rook_white.glb'),
  '2_1': require('../../../assets/3d/split/rook_black.glb'),
  '3_0': require('../../../assets/3d/split/bishop_white.glb'),
  '3_1': require('../../../assets/3d/split/bishop_black.glb'),
  '4_0': require('../../../assets/3d/split/knight_white.glb'),
  '4_1': require('../../../assets/3d/split/knight_black.glb'),
  '5_0': require('../../../assets/3d/split/pawn_white.glb'),
  '5_1': require('../../../assets/3d/split/pawn_black.glb'),
};
const SKYBOX_KTX = require('../../../assets/3d/papermill_skybox.ktx');
const IBL_KTX = require('../../../assets/3d/papermill_ibl.ktx');
/* eslint-enable @typescript-eslint/no-var-requires */

const DEG_TO_RAD = Math.PI / 180;
// ── Camera FOV: keep Filament's projection identical to the one BoardRayPicker inverts ──
// Filament's <Camera> only accepts a focal length; it projects a FIXED VERTICAL fov from
// it using a 35mm full-frame sensor (24mm tall, half = 12mm): vFOV = 2·atan(12 / focalMm).
// The Kotlin picker (Math3D.effectiveFovYRad) instead holds a fixed ~60° HORIZONTAL fov in
// portrait (vertical derived from aspect) and a fixed 50° VERTICAL fov in landscape. If the
// two disagree, taps resolve to the wrong square. The web path gets this for free (three.js
// consumes currentCamera().fov); here we derive the focal length that reproduces the picker's
// vertical fov at the live aspect so render and picking agree (verified: empty-square taps
// 4/8 → 8/8 against the compiled picker once aspect + fov match).
const FILAMENT_SENSOR_HALF_MM = 12;
const PICKER_FOV_X_DEG = 60; // portrait: fixed horizontal fov
const PICKER_FOV_Y_DEG = 50; // landscape: fixed vertical fov (OrbitCameraController.FOV_Y_DEG)
function filamentFocalLength(aspect: number): number {
  const fovYRad =
    aspect < 1
      ? 2 * Math.atan(Math.tan((PICKER_FOV_X_DEG * DEG_TO_RAD) / 2) / aspect)
      : PICKER_FOV_Y_DEG * DEG_TO_RAD;
  return FILAMENT_SENSOR_HALF_MM / Math.tan(fovYRad / 2);
}
const PIECE_SCALE = 0.5;
// Unused pool slots (captured pieces / promotion headroom) are parked far below
// the board instead of being unmounted — the instanced asset has a fixed count.
const HIDDEN_Y = -1000;

// Fixed `<ModelInstance>` pool size per (kind,color). Sized for the worst case so
// instanceCount never changes (no model reload / flicker on capture): a side can
// reach 9 queens / 10 rooks·bishops·knights via promotion, 8 pawns, 1 king.
const POOL_SIZES: Record<string, number> = {
  '0_0': 1, '0_1': 1,    // king
  '1_0': 10, '1_1': 10,  // queen
  '2_0': 10, '2_1': 10,  // rook
  '3_0': 10, '3_1': 10,  // bishop
  '4_0': 10, '4_1': 10,  // knight
  '5_0': 8, '5_1': 8,    // pawn
};
// Stable iteration order → stable hook order across renders (one useModel per pool).
const PIECE_KEYS = [
  '0_0', '0_1', '1_0', '1_1', '2_0', '2_1', '3_0', '3_1', '4_0', '4_1', '5_0', '5_1',
] as const;

// ── Move animation helpers (mirror BoardGeometry + Math3D.catmullRomArc) ─────────
// Same arc formula the Kotlin Board3DMoveAnimator uses, evaluated in JS so the
// Filament instance can animate off the Kotlin driver (which isn't exposed via the
// facade yet). Lift height = 4 (PIECE_MOVE_LIFT), duration = 500ms.

const PIECE_MOVE_LIFT = 4;
const PIECE_MOVE_DURATION_MS = 500;

function squareCenter(row: number, col: number): [number, number, number] {
  // Mirrors BoardGeometry.squareCenter: x=(col-3.5), y=0, z=(row-3.5).
  return [col - 3.5, 0, row - 3.5];
}

function catmullRomArc(
  start: [number, number, number],
  end: [number, number, number],
  t: number,
  liftHeight = PIECE_MOVE_LIFT,
): [number, number, number] {
  const ux = 0, uy = -liftHeight, uz = 0;
  const p0: [number, number, number] = [start[0] + ux, start[1] + uy, start[2] + uz];
  const p3: [number, number, number] = [end[0] + ux, end[1] + uy, end[2] + uz];
  const s2 = t * t;
  const s3 = s2 * t;
  const f0 = -s3 + 2 * s2 - t;
  const f1 = 3 * s3 - 5 * s2 + 2;
  const f2 = -3 * s3 + 4 * s2 + t;
  const f3 = s3 - s2;
  return [
    (p0[0] * f0 + start[0] * f1 + end[0] * f2 + p3[0] * f3) * 0.5,
    (p0[1] * f0 + start[1] * f1 + end[1] * f2 + p3[1] * f3) * 0.5,
    (p0[2] * f0 + start[2] * f1 + end[2] * f2 + p3[2] * f3) * 0.5,
  ];
}

// ── Selection bounce (mirrors Math3D.selectionBounceOffset / SELECTION_BOUNCE_* in the
// Kotlin core, evaluated in JS like the move arc above). Selection feedback is the piece
// springing up off the board on a |sin| curve — NOT a highlight disc. It plays only while
// the piece is resting+selected; a moving piece (and a move's target) never bounces.
const SELECTION_BOUNCE_HEIGHT = 0.16;
const SELECTION_BOUNCE_PERIOD_MS = 520;

function selectionBounceOffset(elapsedMs: number): number {
  const phase = (elapsedMs % SELECTION_BOUNCE_PERIOD_MS) / SELECTION_BOUNCE_PERIOD_MS;
  return SELECTION_BOUNCE_HEIGHT * Math.abs(Math.sin(phase * Math.PI));
}

interface Board3DProps {
  session: ChessSession;
  snapshot: ChessSnapshot;
  onSquareTapped: (row: number, col: number) => void;
}

/** One occupied pool slot: absolute world position + Y rotation (null = empty/hidden). */
interface SlotTransform {
  x: number; y: number; z: number; rotY: number;
}

/**
 * Buckets scene pieces into the fixed per-type pools and overrides the moving
 * piece(s) with their interpolated arc position. Cheap (array fills + the
 * override check) so it can re-run every animation frame without touching the
 * Kotlin scene mapper (the scene itself is recomputed only per move).
 */
function buildSlots(
  pieces: PieceInstanceDto[],
  moving: { pos: [number, number, number]; row: number; col: number } | null,
  secondary: { pos: [number, number, number]; row: number; col: number } | null,
  selection: { row: number; col: number; dy: number } | null,
): Record<string, (SlotTransform | null)[]> {
  const out: Record<string, (SlotTransform | null)[]> = {};
  for (const key of PIECE_KEYS) out[key] = new Array(POOL_SIZES[key]).fill(null);
  const cursor: Record<string, number> = {};
  for (const p of pieces) {
    const key = `${p.kind}_${p.color}`;
    const arr = out[key];
    if (!arr) continue;
    const i = cursor[key] ?? 0;
    if (i >= arr.length) continue; // pool overflow guard (shouldn't happen)
    cursor[key] = i + 1;
    let x = p.x, y = p.y, z = p.z;
    if (moving && p.row === moving.row && p.col === moving.col) {
      [x, y, z] = moving.pos;
    } else if (secondary && p.row === secondary.row && p.col === secondary.col) {
      [x, y, z] = secondary.pos;
    } else if (selection && p.row === selection.row && p.col === selection.col) {
      // Resting selected piece bounces in place (never the moving piece — handled above).
      y = y + selection.dy;
    }
    arr[i] = { x, y, z, rotY: p.rotationYDegrees };
  }
  return out;
}

/**
 * One instanced piece pool. Loads the glb once with a FIXED instance count and
 * writes each instance's transform ABSOLUTELY via TransformManager.setTransform —
 * never the declarative transform props, which multiply (and thus accumulate) on
 * every value change. A per-slot signature cache skips redundant native writes so
 * only the moving piece updates each frame.
 */
function PiecePool({
  glb,
  instanceCount,
  slots,
}: {
  glb: number;
  instanceCount: number;
  slots: (SlotTransform | null)[];
}) {
  const model = useModel(glb, { instanceCount });
  const { transformManager } = useFilamentContext();
  const asset = getAssetFromModel(model);
  // eslint-disable-next-line react-hooks/refs
  const prevSig = useRef<string[]>([]);

  useEffect(() => {
    if (asset == null) return;
    const instances = asset.getAssetInstances();
    for (let i = 0; i < instances.length; i++) {
      const s = slots[i] ?? null;
      const sig = s ? `${s.x},${s.y},${s.z},${s.rotY}` : 'hidden';
      if (prevSig.current[i] === sig) continue;
      prevSig.current[i] = sig;
      const root = instances[i].getRoot();
      // Build the FULL local transform T·R·S and replace (absolute, no multiply).
      const m = transformManager
        .createIdentityMatrix()
        .scaling([PIECE_SCALE, PIECE_SCALE, PIECE_SCALE]);
      const placed = s
        ? m.rotate(s.rotY * DEG_TO_RAD, [0, 1, 0]).translate([s.x, s.y, s.z])
        : m.translate([0, HIDDEN_Y, 0]);
      transformManager.setTransform(root, placed);
    }
  }, [asset, slots, transformManager]);

  return model.state === 'loaded' ? <ModelRenderer model={model} /> : null;
}

export function Board3D({ session, snapshot, onSquareTapped }: Board3DProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Sync the Kotlin camera's aspect with the actual full-screen viewport so the
  // BoardRayPicker inverts the projection that is really on screen. Native never did
  // this (only the web path does — Board3D.web.tsx), so the picker stayed at its default
  // square (aspect = 1) projection while Filament rendered portrait/landscape, and taps
  // landed up to a square off — you "couldn't make moves". Re-runs on rotation.
  useEffect(() => {
    session.cameraResize(screenWidth / screenHeight);
  }, [session, screenWidth, screenHeight]);

  // Scene pieces — re-derived only when the game state changes (NOT on camera moves
  // or animation frames). currentScene() crosses into Kotlin/JS, so keep it per-move.
  const scenePieces = useMemo(
    () => session.currentScene().pieces,
    [snapshot, session],
  );

  const [cam, setCam] = useState<CameraView>(() => session.currentCamera());

  // ── Move animation: when snapshot.animating, arc the moving piece from its start
  // square to its destination over 500ms. The moving piece is identified by its
  // destination (the scene already has it AT the destination, so we override its
  // position with the interpolated arc). Secondary (castling rook) animates in parallel.
  const [animPos, setAnimPos] = useState<[number, number, number] | null>(null);
  const [animSecondaryPos, setAnimSecondaryPos] = useState<[number, number, number] | null>(null);

  // ── Selection bounce: while a piece is selected AND resting (not mid-move), hop it in
  // place via selectionBounceOffset. Gated on `!animating` so the piece doesn't bounce
  // while arcing, and selection clears on move (deriveNewGameState) so the move's target
  // never bounces — matching the Kotlin Board3DAnimationDriver (golden Android target).
  const [bounceY, setBounceY] = useState(0);

  useEffect(() => {
    if (!snapshot.animating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimPos(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimSecondaryPos(null);
      return;
    }
    const from = squareCenter(snapshot.animFromRow, snapshot.animFromCol);
    const to = squareCenter(snapshot.animToRow, snapshot.animToCol);
    const secFrom = snapshot.animSecondary
      ? squareCenter(snapshot.animSecondaryFromRow, snapshot.animSecondaryFromCol)
      : null;
    const secTo = snapshot.animSecondary
      ? squareCenter(snapshot.animSecondaryToRow, snapshot.animSecondaryToCol)
      : null;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / PIECE_MOVE_DURATION_MS, 1);
      setAnimPos(catmullRomArc(from, to, progress));
      if (secFrom && secTo) {
        setAnimSecondaryPos(catmullRomArc(secFrom, secTo, progress));
      }
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Animation complete — let the Kotlin core trigger Black's reply.
        session.animationEnd();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    snapshot.animating,
    snapshot.animFromRow,
    snapshot.animFromCol,
    snapshot.animToRow,
    snapshot.animToCol,
    snapshot.animSecondary,
    snapshot.animSecondaryFromRow,
    snapshot.animSecondaryFromCol,
    snapshot.animSecondaryToRow,
    snapshot.animSecondaryToCol,
  ]);

  useEffect(() => {
    if (!snapshot.hasSelection || snapshot.animating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBounceY(0);
      return;
    }
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      setBounceY(selectionBounceOffset(Date.now() - start));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [snapshot.hasSelection, snapshot.selectedRow, snapshot.selectedCol, snapshot.animating]);

  // Per-pool absolute transforms, including the in-flight arc override + selection bounce.
  const slotMap = useMemo(() => {
    const moving = animPos
      ? { pos: animPos, row: snapshot.animToRow, col: snapshot.animToCol }
      : null;
    const secondary = animSecondaryPos && snapshot.animSecondary
      ? { pos: animSecondaryPos, row: snapshot.animSecondaryToRow, col: snapshot.animSecondaryToCol }
      : null;
    const selection = snapshot.hasSelection && !snapshot.animating
      ? { row: snapshot.selectedRow, col: snapshot.selectedCol, dy: bounceY }
      : null;
    return buildSlots(scenePieces, moving, secondary, selection);
  }, [
    scenePieces,
    animPos,
    animSecondaryPos,
    snapshot.animToRow,
    snapshot.animToCol,
    snapshot.animSecondary,
    snapshot.animSecondaryToRow,
    snapshot.animSecondaryToCol,
    snapshot.hasSelection,
    snapshot.animating,
    snapshot.selectedRow,
    snapshot.selectedCol,
    bounceY,
  ]);

  // Refs track gesture progress across event callbacks (event handlers, not render).
  /* eslint-disable react-hooks/refs */
  const lastPan = useRef<{ x: number; y: number } | null>(null);
  const lastScale = useRef(1);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      lastPan.current = { x: 0, y: 0 };
    })
    .onUpdate((e) => {
      if (lastPan.current == null) return;
      const dx = e.translationX - lastPan.current.x;
      const dy = e.translationY - lastPan.current.y;
      lastPan.current = { x: e.translationX, y: e.translationY };
      if (dx === 0 && dy === 0) return;
      session.cameraDrag(dx / screenWidth, dy / screenHeight);
      setCam(session.currentCamera());
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      lastScale.current = 1;
    })
    .onUpdate((e) => {
      const factor = e.scale / lastScale.current;
      lastScale.current = e.scale;
      if (factor === 1) return;
      session.cameraZoom(1 / factor);
      setCam(session.currentCamera());
    });
  /* eslint-enable react-hooks/refs */

  // Tap → pick the board square under the tap via the Kotlin BoardRayPicker
  // (session.pickSquareFromRay), then route through the same selection/move logic
  // the 2D board uses. Keeps 2D/3D picking identical (plan §6).
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      const xNorm = e.x / screenWidth;
      const yNorm = e.y / screenHeight;
      const idx = session.pickSquareFromRay(xNorm, yNorm);
      if (idx >= 0 && idx < 64) {
        onSquareTapped(Math.floor(idx / 8), idx % 8);
      }
    });

  const composed = Gesture.Simultaneous(pan, pinch, tap);
  const viewStyle = StyleSheet.absoluteFill;

  return (
    <GestureDetector gesture={composed}>
      <View style={viewStyle}>
        <FilamentScene>
          <FilamentView style={viewStyle}>
            <Skybox source={SKYBOX_KTX} />
            <EnvironmentalLight source={IBL_KTX} intensity={100000} irradianceBands={3} />
            <DefaultLight />
            <Model source={BOARD_GLB} scale={[PIECE_SCALE, PIECE_SCALE, PIECE_SCALE]} />
            {PIECE_KEYS.map((key) => (
              <PiecePool
                key={key}
                glb={PIECE_GLBS[key]}
                instanceCount={POOL_SIZES[key]}
                slots={slotMap[key]}
              />
            ))}
            <Camera
              cameraPosition={[cam.px, cam.py, cam.pz]}
              cameraTarget={[cam.tx, cam.ty, cam.tz]}
              cameraUp={[cam.ux, cam.uy, cam.uz]}
              focalLengthInMillimeters={filamentFocalLength(screenWidth / screenHeight)}
              aspect={screenWidth / screenHeight}
              near={0.1}
              far={100}
            />
          </FilamentView>
        </FilamentScene>
      </View>
    </GestureDetector>
  );
}
