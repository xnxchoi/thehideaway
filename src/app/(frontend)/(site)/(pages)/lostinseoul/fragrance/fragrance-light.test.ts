import { describe, expect, it } from "vitest";
import {
  evaluateLostFragranceReaction,
  LOST_FRAGRANCE_REACTION_KEYS
} from "./fragrance-light";

describe("LOSTINSEOUL Catalyst reaction field", () => {
  it("returns the first key at and before progress 0", () => {
    const first = LOST_FRAGRANCE_REACTION_KEYS[0];
    const s = evaluateLostFragranceReaction(0);
    expect(s.reaction).toBe(first.reaction);
    expect(s.juice).toBe(first.juice);
    expect(evaluateLostFragranceReaction(-1).reaction).toBe(first.reaction);
  });

  it("returns the last key at and beyond progress 1", () => {
    const last =
      LOST_FRAGRANCE_REACTION_KEYS[LOST_FRAGRANCE_REACTION_KEYS.length - 1];
    const s = evaluateLostFragranceReaction(1);
    expect(s.reaction).toBe(last.reaction);
    expect(s.ember).toEqual(last.ember);
    expect(evaluateLostFragranceReaction(2).juice).toBe(last.juice);
  });

  it("keeps the background out of pure black (legibility floor)", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const { background } = evaluateLostFragranceReaction(p);
      const luma = background[0] + background[1] + background[2];
      expect(luma).toBeGreaterThan(0.1);
    }
  });

  it("interpolates continuously with no jumps between samples", () => {
    let prev = evaluateLostFragranceReaction(0);
    for (let p = 0.01; p <= 1.0001; p += 0.01) {
      const cur = evaluateLostFragranceReaction(p);
      expect(Math.abs(cur.reaction - prev.reaction)).toBeLessThan(0.2);
      expect(Math.abs(cur.juice - prev.juice)).toBeLessThan(0.1);
      prev = cur;
    }
  });

  it("traces the reaction arc: dim → bloom → peak → afterglow", () => {
    const dormant = evaluateLostFragranceReaction(0.03);
    const ignition = evaluateLostFragranceReaction(0.55);
    const peak = evaluateLostFragranceReaction(0.75);
    const held = evaluateLostFragranceReaction(0.97);
    // reaction climbs to the peak then eases to an afterglow
    expect(ignition.reaction).toBeGreaterThan(dormant.reaction);
    expect(peak.reaction).toBeGreaterThan(ignition.reaction);
    expect(held.reaction).toBeLessThan(peak.reaction);
    expect(held.reaction).toBeGreaterThan(dormant.reaction);
    // projection outward is greatest at the peak
    expect(peak.projection).toBeGreaterThan(ignition.projection);
    expect(dormant.projection).toBeLessThan(0.05);
    // the juice lights up and stays warm
    expect(dormant.juice).toBeLessThan(0.15);
    expect(peak.juice).toBeGreaterThan(0.9);
  });

  it("stays colourless early and earns the colour late (deck timing)", () => {
    // dormant + contact hold near-black: the reaction must not have bloomed by
    // the visual midpoint. Full bloom lands at peak-start (~0.6), not before.
    expect(evaluateLostFragranceReaction(0.2).reaction).toBeLessThan(0.15);
    expect(evaluateLostFragranceReaction(0.3).reaction).toBeLessThan(0.35);
    // the ember is still climbing past the midpoint — earned late, not front-loaded
    const mid = evaluateLostFragranceReaction(0.5).reaction;
    const late = evaluateLostFragranceReaction(0.62).reaction;
    expect(late).toBeGreaterThan(mid);
  });

  it("keeps the ember warm (red channel dominant) throughout", () => {
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const { ember } = evaluateLostFragranceReaction(p);
      expect(ember[0]).toBeGreaterThan(ember[2]);
    }
  });

  it("returns non-finite progress as the dormant state", () => {
    const first = LOST_FRAGRANCE_REACTION_KEYS[0];
    expect(evaluateLostFragranceReaction(Number.NaN).reaction).toBe(
      first.reaction
    );
  });

  // The grade is choreographed, not constant: exposure and bloom swell into the
  // impact and settle back afterwards, so the peak lands as an event.
  it("swells exposure into the peak and settles it after", () => {
    const dormant = evaluateLostFragranceReaction(0.03);
    const peak = evaluateLostFragranceReaction(0.82);
    const held = evaluateLostFragranceReaction(1);
    expect(peak.exposure).toBeGreaterThan(dormant.exposure);
    expect(held.exposure).toBeLessThan(peak.exposure);
    // the dark opening is lifted, never crushed to a black hole
    expect(dormant.exposure).toBeGreaterThan(1.5);
  });

  it("swells bloom into the peak and settles it after", () => {
    const dormant = evaluateLostFragranceReaction(0.03);
    const ignition = evaluateLostFragranceReaction(0.6);
    const peak = evaluateLostFragranceReaction(0.82);
    const held = evaluateLostFragranceReaction(1);
    expect(ignition.bloom).toBeGreaterThan(dormant.bloom);
    expect(peak.bloom).toBeGreaterThan(ignition.bloom);
    expect(held.bloom).toBeLessThan(peak.bloom);
    // bloom never fully leaves — the afterglow still blooms
    expect(held.bloom).toBeGreaterThan(0.5);
  });

  it("keeps exposure and bloom continuous across the whole scroll", () => {
    let prev = evaluateLostFragranceReaction(0);
    for (let p = 0.01; p <= 1.0001; p += 0.01) {
      const cur = evaluateLostFragranceReaction(p);
      expect(Math.abs(cur.exposure - prev.exposure)).toBeLessThan(0.05);
      expect(Math.abs(cur.bloom - prev.bloom)).toBeLessThan(0.05);
      prev = cur;
    }
  });
});
