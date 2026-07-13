import { describe, expect, it } from "vitest";
import {
  getLostProductViewCamera,
  getLostProductViewOffset,
  LOST_PRODUCT_SUBJECT_X
} from "./fragrance-product-view";

describe("getLostProductViewCamera", () => {
  it("returns a stable, fully-finite studio shot", () => {
    const cam = getLostProductViewCamera();
    for (const axis of [0, 1, 2] as const) {
      expect(Number.isFinite(cam.position[axis])).toBe(true);
      expect(Number.isFinite(cam.target[axis])).toBe(true);
    }
    expect(Number.isFinite(cam.fov)).toBe(true);
    expect(cam.fov).toBeGreaterThan(0);
    expect(cam.fov).toBeLessThan(180);
  });

  it("sits in front of the flacon, roughly eye-level and square-on", () => {
    const cam = getLostProductViewCamera();
    // camera in front of subject (positive Z), subject centred on X
    expect(cam.position[2]).toBeGreaterThan(0);
    expect(cam.position[0]).toBe(0);
    expect(cam.target[0]).toBe(0);
    // aimed at the body of the ~1.9-unit flacon (centre near y≈0.95)
    expect(cam.target[1]).toBeGreaterThan(0.4);
    expect(cam.target[1]).toBeLessThan(1.6);
  });

  it("keeps a frustum symmetric on X so verticals stay straight", () => {
    // the left-bias is applied via setViewOffset, NOT by trucking the camera on X.
    const cam = getLostProductViewCamera();
    expect(cam.position[0]).toBe(0);
  });

  it("returns an equal snapshot on every call (pure, stateless)", () => {
    expect(getLostProductViewCamera()).toEqual(getLostProductViewCamera());
  });
});

describe("getLostProductViewOffset", () => {
  it("biases the centred subject toward the left of the container", () => {
    const off = getLostProductViewOffset(1200, 800);
    // positive offsetX shifts the render window right → centred subject reads left
    expect(off.offsetX).toBeGreaterThan(0);
    // the subject (centre of the virtual frame) lands left of centre on screen
    const subjectScreenFraction = 0.5 - off.offsetX / off.width;
    expect(subjectScreenFraction).toBeLessThan(0.5);
    expect(subjectScreenFraction).toBeCloseTo(LOST_PRODUCT_SUBJECT_X, 6);
  });

  it("applies a pure lens-shift — no zoom (window matches full frame)", () => {
    const off = getLostProductViewOffset(1000, 600);
    expect(off.fullWidth).toBe(1000);
    expect(off.fullHeight).toBe(600);
    expect(off.width).toBe(1000);
    expect(off.height).toBe(600);
    expect(off.offsetY).toBe(0);
  });

  it("shifts by the same proportion regardless of container size (aspect-independent)", () => {
    const wide = getLostProductViewOffset(1600, 400);
    const tall = getLostProductViewOffset(600, 1200);
    expect(wide.offsetX / wide.fullWidth).toBeCloseTo(
      tall.offsetX / tall.fullWidth,
      6
    );
  });

  it("clamps non-finite or non-positive dimensions to a safe identity frame", () => {
    for (const bad of [
      getLostProductViewOffset(0, 0),
      getLostProductViewOffset(-800, 600),
      getLostProductViewOffset(Number.NaN, Number.NaN),
      getLostProductViewOffset(Number.POSITIVE_INFINITY, 500)
    ]) {
      expect(Number.isFinite(bad.fullWidth)).toBe(true);
      expect(Number.isFinite(bad.fullHeight)).toBe(true);
      expect(Number.isFinite(bad.offsetX)).toBe(true);
      expect(bad.fullWidth).toBeGreaterThan(0);
      expect(bad.fullHeight).toBeGreaterThan(0);
    }
  });
});
