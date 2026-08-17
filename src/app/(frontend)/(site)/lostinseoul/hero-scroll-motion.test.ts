import { describe, expect, it } from "vitest";
import { getLostHeroScrollProgress } from "./hero-scroll-motion";

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
});
