/**
 * Authored camera choreography for the fragrance chapter.
 * The user drives the clock, the author drives the camera: each beat owns
 * one composed shot, and scroll interpolates between neighbouring shots.
 */

export type LostFragranceVec3 = readonly [number, number, number];

export type LostFragranceCameraKey = {
  /** chapter progress (0..1) where this shot is fully composed */
  at: number;
  position: LostFragranceVec3;
  target: LostFragranceVec3;
  fov: number;
};

export type LostFragranceCameraState = {
  position: LostFragranceVec3;
  target: LostFragranceVec3;
  fov: number;
};

/** Keys are aligned to beat starts (see LOST_FRAGRANCE_BEATS). */
export const LOST_FRAGRANCE_CAMERA_KEYS: LostFragranceCameraKey[] = [
  // arrival — wide establishing, street level, far
  { at: 0, fov: 58, position: [0, 2.6, 15.5], target: [0, 2.1, 0] },
  // neon — drift left, look across the street at the signs
  { at: 0.16, fov: 56, position: [-2.4, 1.9, 11], target: [1.4, 2.4, -4] },
  // rain — lifted, looking down the wet lane
  { at: 0.36, fov: 54, position: [1.9, 3, 8.6], target: [-0.8, 1.5, -7] },
  // sodium — low and tight, tunnel compression
  { at: 0.56, fov: 50, position: [-1.4, 1.55, 6.8], target: [0.5, 1.9, -9] },
  // dawn — rise, horizon opens
  { at: 0.74, fov: 60, position: [0.2, 3.6, 5.6], target: [0, 2.8, -14] },
  // reveal — settle onto the object slot
  { at: 0.88, fov: 52, position: [0, 1.75, 4.6], target: [0, 1.5, -2] },
  { at: 1, fov: 50, position: [0, 1.55, 3.6], target: [0, 1.35, -2] }
];

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function lerpVec3(
  a: LostFragranceVec3,
  b: LostFragranceVec3,
  t: number
): LostFragranceVec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

export function evaluateLostFragranceCamera(
  progress: number,
  keys: LostFragranceCameraKey[] = LOST_FRAGRANCE_CAMERA_KEYS
): LostFragranceCameraState {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!Number.isFinite(progress) || progress <= first.at) {
    return { fov: first.fov, position: first.position, target: first.target };
  }
  if (progress >= last.at) {
    return { fov: last.fov, position: last.position, target: last.target };
  }
  let index = 0;
  while (index < keys.length - 2 && progress >= keys[index + 1].at) {
    index += 1;
  }
  const a = keys[index];
  const b = keys[index + 1];
  const span = b.at - a.at;
  const t = span > 0 ? smoothstep((progress - a.at) / span) : 1;
  return {
    fov: a.fov + (b.fov - a.fov) * t,
    position: lerpVec3(a.position, b.position, t),
    target: lerpVec3(a.target, b.target, t)
  };
}
