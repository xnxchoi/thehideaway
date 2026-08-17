/**
 * The ember reaction field for the Catalyst chapter.
 *
 * The bottle is the hero; this is the reaction that plays behind and through
 * it. Every value is a smooth function of raw scroll progress (0..1),
 * smoothstep-interpolated between a handful of authored keys — the same
 * grammar as fragrance-camera.ts. Nothing steps; the reaction breathes:
 *
 *   dormant  → cold, near-black, the juice unlit
 *   contact  → the first ember seam, the key begins to rake the glass
 *   ignition → the bloom; the juice ignites to full ember
 *   peak     → fullest reaction, thrown outward (projects to the other)
 *   held     → the afterglow; ember banked low, warm
 *
 * Colours are linear-ish RGB tuples (0..1) so interpolation is pure and
 * testable; the scene turns them into THREE.Color. The palette is monochrome
 * warm-black through the body; the single earned colour event is sodium ember.
 * See readmes/LOSTINSEOUL_FRAGRANCE.md §8.
 */

export type LostFragranceRGB = [number, number, number];

export type LostFragranceReactionState = {
  /** scene background / fog colour — never pure black (legibility floor) */
  background: LostFragranceRGB;
  /** the ember reaction colour (sodium ember; hotter at the peak) */
  ember: LostFragranceRGB;
  /** overall reaction / bloom intensity behind and around the bottle */
  reaction: number;
  /** how lit the bottle's juice reads (dark → full ember → warm afterglow) */
  juice: number;
  /** ember key-light raking the glass */
  key: number;
  /** how far the reaction throws outward past the frame (defined through the other) */
  projection: number;
  /** ember particulate density */
  particulate: number;
  /** tone-mapping exposure — absolute, already carries the founder's stop */
  exposure: number;
  /** post-processing bloom intensity — swells into the impact, settles after */
  bloom: number;
};

type LostReactionKey = LostFragranceReactionState & { at: number };

const EMBER: LostFragranceRGB = [0.81, 0.35, 0.16];
const EMBER_HOT: LostFragranceRGB = [0.95, 0.5, 0.24];

// Keys are aligned to the phase boundaries (fragrance-phases.ts) so the light
// tracks the beats: a LONG colourless dormant hold, a hairline of ember at
// contact (nothing floods), the bloom born from the dark across ignition to
// full only at peak-start — the earned event is LATE — a brief crown, then an
// afterglow. Timing is the locked Stage 3 deck (readme §8): "the opening, and a
// long one", "a first hairline of ember only, earned by contact, not a flood",
// "one deep sodium ember, at commitment", "one event, absolute", "ember banks low".
//
// `exposure` and `bloom` are the GRADE, and they are choreographed rather than held
// constant: the dark stages are lifted (a dark opening, never a black hole), the impact
// swells both, and the settle eases them back without returning all the way. The dormant
// anchors were re-dialed DOWN 2026-07-13 (founder: "too bright in the beginning") — the
// old at-rest stop (exposure ≈1.71) was dialed for the bottle-hero scene; with the fire
// curtain + water in frame the opening must sit deeper in the dark.
export const LOST_FRAGRANCE_REACTION_KEYS: LostReactionKey[] = [
  {
    at: 0, // dormant — the founder's reference is Bleu de Chanel's void, then darker:
    // the object barely surfaces from near-black; everything else is swallowed.
    background: [0.012, 0.009, 0.012],
    ember: EMBER,
    reaction: 0.03,
    juice: 0.04,
    key: 0.07,
    projection: 0,
    particulate: 0.05,
    exposure: 0.85,
    bloom: 0.86
  },
  {
    at: 0.18, // still dormant through contact-start — the long hold before anything
    background: [0.014, 0.011, 0.013],
    ember: EMBER,
    reaction: 0.06,
    juice: 0.07,
    key: 0.16,
    projection: 0.01,
    particulate: 0.09,
    exposure: 1.05,
    bloom: 0.88
  },
  {
    at: 0.34, // contact resolved — a hairline of ember; the key rakes the glass, juice stirs. Contained.
    background: [0.038, 0.028, 0.03],
    ember: EMBER,
    reaction: 0.24,
    juice: 0.3,
    key: 0.72,
    projection: 0.07,
    particulate: 0.22,
    exposure: 1.55,
    bloom: 0.96
  },
  {
    at: 0.6, // ignition complete — the bloom at full, born from the dark (late)
    background: [0.06, 0.042, 0.038],
    ember: EMBER,
    reaction: 1.25,
    juice: 0.9,
    key: 1.14,
    projection: 0.52,
    particulate: 0.6,
    exposure: 2.18,
    bloom: 1.18
  },
  {
    at: 0.82, // peak — the crown, thrown outward, one event absolute
    background: [0.078, 0.05, 0.04],
    ember: EMBER_HOT,
    reaction: 1.55,
    juice: 1.0,
    key: 1.3,
    projection: 1.0,
    particulate: 0.72,
    // the impact: the grade opens up with the reaction — one event, absolute
    exposure: 2.4,
    bloom: 1.35
  },
  {
    at: 1, // held — afterglow, ember banked low, warm
    background: [0.06, 0.043, 0.035],
    ember: EMBER,
    reaction: 0.42,
    juice: 0.55,
    key: 0.64,
    projection: 0.2,
    particulate: 0.28,
    // the settle — eased back from the crown, but never all the way to dormant
    exposure: 1.95,
    bloom: 0.95
  }
];

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function mixRGB(
  a: LostFragranceRGB,
  b: LostFragranceRGB,
  t: number
): LostFragranceRGB {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

export function evaluateLostFragranceReaction(
  progress: number,
  keys: LostReactionKey[] = LOST_FRAGRANCE_REACTION_KEYS
): LostFragranceReactionState {
  const first = keys[0];
  const last = keys[keys.length - 1];
  const strip = ({ at: _at, ...rest }: LostReactionKey) => rest;

  if (!Number.isFinite(progress) || progress <= first.at) return strip(first);
  if (progress >= last.at) return strip(last);

  let index = 0;
  while (index < keys.length - 2 && progress >= keys[index + 1].at) {
    index += 1;
  }
  const a = keys[index];
  const b = keys[index + 1];
  const span = b.at - a.at;
  const t = smoothstep(span <= 0 ? 0 : (progress - a.at) / span);

  return {
    background: mixRGB(a.background, b.background, t),
    ember: mixRGB(a.ember, b.ember, t),
    reaction: mix(a.reaction, b.reaction, t),
    juice: mix(a.juice, b.juice, t),
    key: mix(a.key, b.key, t),
    projection: mix(a.projection, b.projection, t),
    particulate: mix(a.particulate, b.particulate, t),
    exposure: mix(a.exposure, b.exposure, t),
    bloom: mix(a.bloom, b.bloom, t)
  };
}
