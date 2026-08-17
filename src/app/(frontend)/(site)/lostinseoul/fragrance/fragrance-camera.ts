/**
 * Camera path for the fragrance chapter — light and air, not a place.
 * One slow, continuous push into the haze: the frame never walks through
 * geometry (there is none), it just draws closer to the shaft as you scroll,
 * settling toward the suspended object-glow at the resolve. Scroll drives a
 * smoothstep dolly between a few authored positions.
 */
/**
 * Plain tuple, NOT THREE.Vector3: every key is authored as an array literal
 * and both scenes read components by index (`shot.position[0]`). Typing this
 * as the THREE class would promise .set()/.lerp() APIs the values don't have
 * — index access on a real Vector3 returns undefined and the camera would
 * silently vanish into NaN.
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

/** A single descending crane, authored from three real-GPU reference frames.
 *  The camera does not merely dolly in — it DROPS. It opens high and pulled back,
 *  pitched steeply DOWN onto the water (horizon high in frame, flacon small), then
 *  cranes down and forward as the reaction climbs, the pitch rolling from looking-down
 *  through eye-level to slightly-UP, so the horizon sinks to the bottom third and the
 *  plume towers over a low, intimate hero shot with a strong reflection foreground.
 *  Y high→low, Z far→near, pitch down→up; a subtle x drift settles to centre. */
// The flacon (base at y=0, scaled) stands ~1.9 units tall, centred near y≈0.95.
// Pitch is expressed purely through target-Y relative to camera-Y — no explicit roll.
export const LOST_FRAGRANCE_CAMERA_KEYS: LostFragranceCameraKey[] = [
  // dormant — high eye, pulled back, steep look DOWN; horizon high, flacon small & offset
  { at: 0, fov: 36, position: [0.45, 4.55, 10.4], target: [0.05, 0.2, 0] },
  // contact — the crane begins its descent, dollying in
  { at: 0.3, fov: 34.5, position: [0.3, 3.5, 9.0], target: [0.02, 0.6, 0] },
  // ignition — near eye-level, slightly above; flacon centres and fills, bloom behind
  { at: 0.6, fov: 33, position: [0.12, 2.3, 7.2], target: [0, 1.05, 0] },
  // peak — low and close, pitch rolling up as the plume takes the top (the plunge)
  { at: 0.82, fov: 31, position: [0, 1.45, 5.9], target: [0, 1.35, 0] },
  // resolve — the camera lifts and eases back to REVEAL the whole flacon standing on
  // the water: base-to-cap in frame with its reflection below and the plume behind.
  { at: 1, fov: 31, position: [0, 1.65, 7.4], target: [0, 0.9, 0] }
];

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** Perlin's smootherstep — flatter at both ends than smoothstep, steeper through
 *  the middle. Used to bend scroll into kinetic beats. */
function smootherstep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Bend honest, linear scroll into staged beats. Raw `useScroll` progress tracks the
 * camera 1:1, which reads as a literal pan. `stageProgress` remaps it so the value
 * DWELLS as it approaches each camera anchor and RUSHES between them (per-segment
 * smootherstep) — crossing an anchor releases the frame toward the next position.
 *
 * Anchor boundaries are preserved exactly (a.at → a.at), so it composes cleanly with
 * `evaluateLostFragranceCamera` and with a temporal spring in the render loop, which
 * adds the momentum/overshoot that makes each beat feel pushed rather than dragged.
 */
export function stageProgress(
  progress: number,
  keys: LostFragranceCameraKey[] = LOST_FRAGRANCE_CAMERA_KEYS
): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!Number.isFinite(progress) || progress <= first.at) return first.at;
  if (progress >= last.at) return last.at;
  let index = 0;
  while (index < keys.length - 2 && progress >= keys[index + 1].at) {
    index += 1;
  }
  const a = keys[index];
  const b = keys[index + 1];
  const span = b.at - a.at;
  const t = span > 0 ? (progress - a.at) / span : 1;
  return a.at + smootherstep(t) * span;
}

function lerpVector3(
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
    position: lerpVector3(a.position, b.position, t),
    target: lerpVector3(a.target, b.target, t)
  };
}
