import { describe, expect, it } from "vitest";
import {
  evaluateLostFragranceCamera,
  LOST_FRAGRANCE_CAMERA_KEYS
} from "./fragrance-camera";

describe("lostinseoul fragrance camera path", () => {
  it("holds the first key before the chapter starts", () => {
    const first = LOST_FRAGRANCE_CAMERA_KEYS[0];
    expect(evaluateLostFragranceCamera(-0.5)).toEqual({
      fov: first.fov,
      position: first.position,
      target: first.target
    });
    expect(evaluateLostFragranceCamera(0)).toEqual({
      fov: first.fov,
      position: first.position,
      target: first.target
    });
  });

  it("settles on the last key at the end of the chapter", () => {
    const last =
      LOST_FRAGRANCE_CAMERA_KEYS[LOST_FRAGRANCE_CAMERA_KEYS.length - 1];
    expect(evaluateLostFragranceCamera(1)).toEqual({
      fov: last.fov,
      position: last.position,
      target: last.target
    });
    expect(evaluateLostFragranceCamera(1.7)).toEqual({
      fov: last.fov,
      position: last.position,
      target: last.target
    });
  });

  it("returns each key exactly at its own progress stop", () => {
    for (const key of LOST_FRAGRANCE_CAMERA_KEYS) {
      expect(evaluateLostFragranceCamera(key.at)).toEqual({
        fov: key.fov,
        position: key.position,
        target: key.target
      });
    }
  });

  it("interpolates strictly between neighbouring keys", () => {
    const [a, b] = LOST_FRAGRANCE_CAMERA_KEYS;
    const mid = evaluateLostFragranceCamera((a.at + b.at) / 2);
    for (const axis of [0, 1, 2] as const) {
      const lo = Math.min(a.position[axis], b.position[axis]);
      const hi = Math.max(a.position[axis], b.position[axis]);
      expect(mid.position[axis]).toBeGreaterThanOrEqual(lo);
      expect(mid.position[axis]).toBeLessThanOrEqual(hi);
    }
    expect(mid.fov).toBeGreaterThanOrEqual(Math.min(a.fov, b.fov));
    expect(mid.fov).toBeLessThanOrEqual(Math.max(a.fov, b.fov));
  });

  it("eases through segments without jumps at key boundaries", () => {
    // sample densely; consecutive samples must never teleport
    let previous = evaluateLostFragranceCamera(0);
    for (let i = 1; i <= 200; i += 1) {
      const next = evaluateLostFragranceCamera(i / 200);
      for (const axis of [0, 1, 2] as const) {
        expect(
          Math.abs(next.position[axis] - previous.position[axis])
        ).toBeLessThan(0.6);
      }
      previous = next;
    }
  });

  it("keys are sorted and cover the full 0..1 span", () => {
    expect(LOST_FRAGRANCE_CAMERA_KEYS[0].at).toBe(0);
    expect(
      LOST_FRAGRANCE_CAMERA_KEYS[LOST_FRAGRANCE_CAMERA_KEYS.length - 1].at
    ).toBe(1);
    for (let i = 1; i < LOST_FRAGRANCE_CAMERA_KEYS.length; i += 1) {
      expect(LOST_FRAGRANCE_CAMERA_KEYS[i].at).toBeGreaterThan(
        LOST_FRAGRANCE_CAMERA_KEYS[i - 1].at
      );
    }
  });
});
