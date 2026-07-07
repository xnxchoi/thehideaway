/**
 * Camera path for the fragrance chapter — light and air, not a place.
 * One slow, continuous push into the haze: the frame never walks through
 * geometry (there is none), it just draws closer to the shaft as you scroll,
 * settling toward the suspended object-glow at the resolve. Scroll drives a
 * smoothstep dolly between a few authored positions.
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

/** The bottle is the hero and stays framed throughout; the camera only draws
 *  quietly closer as the reaction climbs, then eases back to the afterglow.
 *  A long product lens (low fov) keeps the glass undistorted. */
export const LOST_FRAGRANCE_CAMERA_KEYS: LostFragranceCameraKey[] = [
  // dormant — full bottle, calm, a touch of distance
  { at: 0, fov: 30, position: [0, 1.7, 8.6], target: [0, 1.5, 0] },
  // contact — barely drifts; the reaction registers
  { at: 0.26, fov: 30, position: [0.3, 1.72, 8.1], target: [0, 1.5, 0] },
  // ignition — ease in as the bloom takes
  { at: 0.47, fov: 31, position: [-0.22, 1.76, 7.2], target: [0, 1.55, 0] },
  // peak — closest; the reaction at its fullest
  { at: 0.71, fov: 32, position: [0.2, 1.8, 6.6], target: [0, 1.55, 0] },
  // held — settle back to the afterglow
  { at: 1, fov: 30, position: [0, 1.64, 7.7], target: [0, 1.44, 0] }
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
