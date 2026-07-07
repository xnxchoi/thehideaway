import { describe, expect, it } from "vitest";
import {
  getLostFragranceActivePhase,
  getLostFragrancePhaseProgress,
  LOST_FRAGRANCE_PHASES
} from "./fragrance-phases";

describe("LOSTINSEOUL Catalyst phases", () => {
  it("covers the full scroll range without gaps", () => {
    expect(LOST_FRAGRANCE_PHASES[0].start).toBe(0);
    expect(LOST_FRAGRANCE_PHASES[LOST_FRAGRANCE_PHASES.length - 1].end).toBe(1);
    for (let i = 1; i < LOST_FRAGRANCE_PHASES.length; i += 1) {
      expect(LOST_FRAGRANCE_PHASES[i].start).toBe(
        LOST_FRAGRANCE_PHASES[i - 1].end
      );
    }
  });

  it("is the five scenes of the reaction in order", () => {
    expect(LOST_FRAGRANCE_PHASES.map((p) => p.id)).toEqual([
      "dormant",
      "contact",
      "ignition",
      "peak",
      "held"
    ]);
  });

  it("opens dormant and resolves held", () => {
    expect(getLostFragranceActivePhase(0)).toBe("dormant");
    expect(getLostFragranceActivePhase(1)).toBe("held");
  });

  it("maps mid-scroll progress to the matching phase", () => {
    expect(getLostFragranceActivePhase(0.1)).toBe("dormant");
    expect(getLostFragranceActivePhase(0.26)).toBe("contact");
    expect(getLostFragranceActivePhase(0.45)).toBe("ignition");
    expect(getLostFragranceActivePhase(0.7)).toBe("peak");
    expect(getLostFragranceActivePhase(0.9)).toBe("held");
  });

  it("clamps out-of-range and non-finite progress", () => {
    expect(getLostFragranceActivePhase(-1)).toBe("dormant");
    expect(getLostFragranceActivePhase(2)).toBe("held");
    expect(getLostFragranceActivePhase(Number.NaN)).toBe("dormant");
  });

  it("reports intra-phase progress between 0 and 1", () => {
    const phase = LOST_FRAGRANCE_PHASES[2];
    expect(getLostFragrancePhaseProgress(phase.start, phase)).toBe(0);
    expect(getLostFragrancePhaseProgress(phase.end, phase)).toBe(1);
    const mid = (phase.start + phase.end) / 2;
    expect(getLostFragrancePhaseProgress(mid, phase)).toBeCloseTo(0.5);
    expect(getLostFragrancePhaseProgress(Number.NaN, phase)).toBe(0);
  });
});
