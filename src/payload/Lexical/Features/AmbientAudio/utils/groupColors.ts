/**
 * Per-group color assignment. When multiple ambient-audio regions coexist in
 * a document we need to distinguish them visually — same-color blobs blur
 * together. Each groupId is deterministically hashed onto a small palette
 * pulled from the project's tailwind tokens (src/styles/payloadStyles.css).
 *
 * Returned values are OKLCH components; callers compose the final color with
 * the alpha they want for that surface (border, fill, dot, etc).
 */

export interface GroupColor {
  l: number;
  c: number;
  h: number;
  /** Name of the source token — useful for debugging in devtools. */
  token: string;
}

// Ordered to maximise hue separation between neighbouring indices so that two
// regions inserted close together visually contrast even before the palette
// wraps. Values mirror the --color-* tokens in payloadStyles.css.
const PALETTE: readonly GroupColor[] = [
  { l: 0.7456, c: 0.1389, h: 223.09, token: "pastel-sky-blue" },
  { l: 0.7858, c: 0.1658, h: 74.97, token: "piercing-orange" },
  { l: 0.5971, c: 0.0893, h: 131.62, token: "muted-olive" },
  { l: 0.7616, c: 0.1683, h: 57.66, token: "soft-peach" },
  { l: 0.9124, c: 0.228, h: 124.65, token: "piercing-green" },
  { l: 0.5463, c: 0.2239, h: 29.23, token: "rosso-corsa" },
  { l: 0.8455, c: 0.161, h: 82.9, token: "warm-yellow" },
  { l: 0.452, c: 0.313, h: 264.05, token: "piercing-blue" }
];

/**
 * In-session registry: the first groupId we see is assigned palette[0], the
 * second palette[1], etc. Hashing 8-slot palette produced visible collisions
 * after only 2–3 groups, so we assign deterministically by order of first
 * appearance instead. Still wraps past the palette length, but first N ≤ 8
 * groups are guaranteed distinct.
 */
const GROUP_INDEX = new Map<string, number>();

function indexForGroupId(groupId: string): number {
  const existing = GROUP_INDEX.get(groupId);
  if (existing !== undefined) return existing;
  const next = GROUP_INDEX.size;
  GROUP_INDEX.set(groupId, next);
  return next;
}

export function getGroupColor(groupId: string | null | undefined): GroupColor {
  const key =
    typeof groupId === "string" && groupId.length > 0
      ? groupId
      : "__fallback__";
  return PALETTE[indexForGroupId(key) % PALETTE.length]!;
}

export function groupColorOklch(color: GroupColor, alpha = 1): string {
  return `oklch(${color.l} ${color.c} ${color.h} / ${alpha})`;
}
