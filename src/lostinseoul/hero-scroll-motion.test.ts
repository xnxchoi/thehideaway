import { describe, expect, it } from "vitest";
import {
  getLostHeroScrollCameraOffset,
  getLostHeroScrollProgress,
  shouldUpdateLostHeroReflectors
} from "./hero-scroll-motion";
describe("lostinseoul hero scroll motion", () => {
  it("matches the source scroll range formula", () => {
    expect(getLostHeroScrollProgress(400, 1000, 1440)).toBe(0.5);
    expect(getLostHeroScrollProgress(300, 300, 1440)).toBeCloseTo(300 / 360);
  });

  it("clamps source-derived progress into the camera-safe range", () => {
    expect(getLostHeroScrollProgress(-10, 1000, 1440)).toBe(0);
    expect(getLostHeroScrollProgress(1400, 1000, 1440)).toBe(1);
  });

  it("dead-zones tiny values so the camera does not shudder around rest", () => {
    expect(getLostHeroScrollProgress(0.2, 1000, 1440)).toBe(0);
    expect(getLostHeroScrollProgress(2, 1000, 1440)).toBe(0.0025);
  });

  it("disables source scroll-follow below the desktop breakpoint", () => {
    expect(getLostHeroScrollProgress(400, 1000, 767)).toBe(0);
    expect(getLostHeroScrollProgress(400, 1000, 768)).toBe(0.5);
  });

  it("moves the camera and look target together so scroll does not pitch the scene", () => {
    expect(getLostHeroScrollCameraOffset(0)).toEqual({
      lookAtY: 0,
      positionY: 0
    });

    const mid = getLostHeroScrollCameraOffset(0.5);
    expect(mid.lookAtY).toBe(mid.positionY);
    expect(mid.positionY).toBeLessThan(0);
    expect(Math.abs(mid.positionY)).toBeLessThan(0.2);
  });

  it("skips reflector redraws while Lenis is moving quickly", () => {
    expect(shouldUpdateLostHeroReflectors(0)).toBe(true);
    expect(shouldUpdateLostHeroReflectors(120)).toBe(true);
    expect(shouldUpdateLostHeroReflectors(800)).toBe(false);
    expect(shouldUpdateLostHeroReflectors(-800)).toBe(false);
  });

});
