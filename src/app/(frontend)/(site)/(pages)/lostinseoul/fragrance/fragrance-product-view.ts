/**
 * Product-view framing for the fragrance flacon — the held studio shot the scroll
 * journey settles into, and the standalone framing on the PDP. Unlike the scroll
 * camera (a descending crane keyed to progress), this is motionless: the camera holds
 * while the flacon itself idles, on a clean studio void with no water or plume.
 *
 * Two pure concerns, both testable without a GPU:
 *  - `getLostProductViewCamera()` — the fixed eye-level, square-on studio shot.
 *  - `getLostProductViewOffset(w, h)` — a `setViewOffset` lens-shift that seats the
 *    centred flacon into the LEFT of the frame, clearing the right-hand info panel,
 *    without trucking the camera (verticals stay straight).
 */

import type { LostFragranceVec3 } from "./fragrance-camera";

export type LostProductViewCamera = {
  position: LostFragranceVec3;
  target: LostFragranceVec3;
  fov: number;
};

/**
 * A held studio product shot: eye-level, square-on, close enough to fill the frame
 * while keeping a base-to-cap read with headroom. The flacon (base at y=0, ~1.9 units
 * tall, centred near y≈0.95) is aimed at its body; camera sits just above centre so
 * the look is a whisper down, never up. X is dead-centre — the left-bias is a lens
 * shift (`getLostProductViewOffset`), not a camera truck, so the glass stays upright.
 */
export const LOST_PRODUCT_VIEW_CAMERA: LostProductViewCamera = {
  position: [0, 1.15, 5.4],
  target: [0, 0.95, 0],
  fov: 30
};

export function getLostProductViewCamera(): LostProductViewCamera {
  return LOST_PRODUCT_VIEW_CAMERA;
}

/**
 * Where the flacon rests horizontally as a fraction of container width
 * (0 = left edge, 0.5 = centre). ~0.34 seats it in the left ~40%, leaving the right
 * of the frame open for the info panel in the full-bleed handoff.
 */
export const LOST_PRODUCT_SUBJECT_X = 0.34;

export type LostProductViewOffset = {
  fullWidth: number;
  fullHeight: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

/**
 * Compute the `PerspectiveCamera.setViewOffset` args that shift the centred subject
 * toward the left of the container. This is a pure horizontal lens-shift: the render
 * window matches the full frame in size (no zoom), only its origin moves, so the
 * subject slides left while the frustum stays symmetric top-to-bottom and verticals
 * remain vertical. Positive `offsetX` renders a window to the right of centre, which
 * pushes the centred flacon toward the left of what's drawn.
 *
 * `subjectScreenFraction = 0.5 - offsetX / width` lands at `LOST_PRODUCT_SUBJECT_X`.
 * Invalid dimensions clamp to a safe 1×1 identity frame (offset 0) rather than NaN.
 */
export function getLostProductViewOffset(
  width: number,
  height: number
): LostProductViewOffset {
  const safeW = Number.isFinite(width) && width > 0 ? width : 1;
  const safeH = Number.isFinite(height) && height > 0 ? height : 1;
  const offsetX = safeW * (0.5 - LOST_PRODUCT_SUBJECT_X);
  return {
    fullWidth: safeW,
    fullHeight: safeH,
    offsetX,
    offsetY: 0,
    width: safeW,
    height: safeH
  };
}
