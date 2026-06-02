/**
 * Stock image references — picsum.photos with deterministic seeds so the
 * skeleton renders the same images on every build. The host runs without
 * auth or quotas, so this is the safest external source for skeleton work.
 *
 * Replace with curated Unsplash IDs (whitelisted in next.config.ts) when
 * real cookout photography is ready.
 */

const PICSUM = "https://picsum.photos/seed";

export const stockImage = (seed: string, w: number, h: number): string =>
  `${PICSUM}/hideaway-cookout-${seed}/${w}/${h}`;

export const HERO_IMAGES = [
  { seed: "table", tag: "the table, 14:00", w: 600, h: 800 },
  { seed: "lemons", tag: "lemons & ice, 15:00", w: 600, h: 800 },
  { seed: "fire", tag: "fire pit, 18:00", w: 600, h: 800 }
];
