import type { CameraView, ChessSession, PieceInstanceDto } from '@/chess-core';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface HitBand {
  minY: number;
  maxY: number;
  radius: number;
}

interface Ray {
  origin: Vec3;
  direction: Vec3;
}

// chess.glb bounds after the 0.5 scale used by every renderer. Four height bands
// follow each silhouette closely enough to cover the visible upper body without
// turning the wide base into an invisible full-height cylinder.
const HIT_PROFILES: readonly (readonly HitBand[])[] = [
  profile(1.95, 0.48, 0.20, 0.27, 0.27), // king
  profile(1.69, 0.45, 0.23, 0.26, 0.24), // queen
  profile(1.21, 0.39, 0.30, 0.25, 0.29), // rook
  profile(1.44, 0.36, 0.18, 0.21, 0.21), // bishop
  profile(1.29, 0.44, 0.44, 0.39, 0.39), // knight
  profile(1.06, 0.34, 0.23, 0.22, 0.21), // pawn
];

function profile(height: number, r0: number, r1: number, r2: number, r3: number): HitBand[] {
  const quarter = height / 4;
  return [
    { minY: 0, maxY: quarter, radius: r0 },
    { minY: quarter, maxY: quarter * 2, radius: r1 },
    { minY: quarter * 2, maxY: quarter * 3, radius: r2 },
    { minY: quarter * 3, maxY: height, radius: r3 },
  ];
}

/** Picks the rendered piece silhouette first, then falls back to the Kotlin board-plane picker. */
export function pickWebSquare(session: ChessSession, xNorm: number, yNorm: number): number {
  const ray = rayFromScreen(session.currentCamera(), xNorm, yNorm);

  let planeT = Number.POSITIVE_INFINITY;
  if (Math.abs(ray.direction.y) >= 1e-6) {
    const t = -ray.origin.y / ray.direction.y;
    if (t >= 0) planeT = t;
  }

  const piece = nearestRenderedPiece(ray, session.currentScene().pieces, planeT);
  return piece ? piece.row * 8 + piece.col : session.pickSquareFromRay(xNorm, yNorm);
}

function nearestRenderedPiece(ray: Ray, pieces: PieceInstanceDto[], maxT: number): PieceInstanceDto | null {
  let nearest: PieceInstanceDto | null = null;
  let nearestT = maxT;

  for (const piece of pieces) {
    const bands = HIT_PROFILES[piece.kind];
    if (!bands) continue;
    for (const band of bands) {
      const t = rayCylinderEntry(
        ray,
        piece.x,
        piece.z,
        piece.y + band.minY,
        piece.y + band.maxY,
        band.radius,
      );
      if (t !== null && t < nearestT) {
        nearest = piece;
        nearestT = t;
      }
    }
  }

  return nearest;
}

function rayFromScreen(camera: CameraView, xNorm: number, yNorm: number): Ray {
  const fovY = camera.aspect < 1
    ? 2 * Math.atan(Math.tan((60 * Math.PI / 180) / 2) / camera.aspect)
    : camera.fov * Math.PI / 180;
  const tanHalfFov = Math.tan(fovY / 2);
  const cameraDirection = normalize({
    x: (2 * xNorm - 1) * camera.aspect * tanHalfFov,
    y: -(2 * yNorm - 1) * tanHalfFov,
    z: -1,
  });

  const origin = { x: camera.px, y: camera.py, z: camera.pz };
  const forward = normalize({
    x: camera.tx - camera.px,
    y: camera.ty - camera.py,
    z: camera.tz - camera.pz,
  });
  const right = normalize(cross(forward, { x: camera.ux, y: camera.uy, z: camera.uz }));
  const up = normalize(cross(right, forward));

  return {
    origin,
    direction: normalize({
      x: right.x * cameraDirection.x + up.x * cameraDirection.y - forward.x * cameraDirection.z,
      y: right.y * cameraDirection.x + up.y * cameraDirection.y - forward.y * cameraDirection.z,
      z: right.z * cameraDirection.x + up.z * cameraDirection.y - forward.z * cameraDirection.z,
    }),
  };
}

function rayCylinderEntry(
  ray: Ray,
  cx: number,
  cz: number,
  minY: number,
  maxY: number,
  radius: number,
): number | null {
  const ox = ray.origin.x - cx;
  const oz = ray.origin.z - cz;
  const dx = ray.direction.x;
  const dz = ray.direction.z;
  let nearest = Number.POSITIVE_INFINITY;

  const a = dx * dx + dz * dz;
  if (a > 1e-8) {
    const b = 2 * (ox * dx + oz * dz);
    const c = ox * ox + oz * oz - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      for (const t of [(-b - root) / (2 * a), (-b + root) / (2 * a)]) {
        const y = ray.origin.y + ray.direction.y * t;
        if (t > 1e-4 && y >= minY && y <= maxY) nearest = Math.min(nearest, t);
      }
    }
  }

  if (Math.abs(ray.direction.y) > 1e-6) {
    const t = (maxY - ray.origin.y) / ray.direction.y;
    const x = ox + dx * t;
    const z = oz + dz * t;
    if (t > 1e-4 && x * x + z * z <= radius * radius) nearest = Math.min(nearest, t);
  }

  return Number.isFinite(nearest) ? nearest : null;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.y, v.z);
  return length > 0
    ? { x: v.x / length, y: v.y / length, z: v.z / length }
    : { x: 0, y: 0, z: 0 };
}
