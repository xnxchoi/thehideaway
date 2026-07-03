import { describe, expect, it } from "vitest";
import {
  getLostFragranceActiveBeat,
  getLostFragranceBeatProgress,
  LOST_FRAGRANCE_BEATS
} from "./fragrance-beats";

describe("LOSTINSEOUL fragrance beats", () => {
  it("covers the full scroll range without gaps", () => {
    expect(LOST_FRAGRANCE_BEATS[0].start).toBe(0);
    expect(LOST_FRAGRANCE_BEATS[LOST_FRAGRANCE_BEATS.length - 1].end).toBe(1);
    for (let i = 1; i < LOST_FRAGRANCE_BEATS.length; i += 1) {
      expect(LOST_FRAGRANCE_BEATS[i].start).toBe(
        LOST_FRAGRANCE_BEATS[i - 1].end
      );
    }
  });

  it("opens on arrival and resolves on reveal", () => {
    expect(getLostFragranceActiveBeat(0)).toBe("arrival");
    expect(getLostFragranceActiveBeat(1)).toBe("reveal");
  });

  it("maps mid-scroll progress to the matching beat", () => {
    expect(getLostFragranceActiveBeat(0.2)).toBe("neon");
    expect(getLostFragranceActiveBeat(0.45)).toBe("rain");
    expect(getLostFragranceActiveBeat(0.6)).toBe("sodium");
    expect(getLostFragranceActiveBeat(0.8)).toBe("dawn");
  });

  it("clamps out-of-range and non-finite progress", () => {
    expect(getLostFragranceActiveBeat(-1)).toBe("arrival");
    expect(getLostFragranceActiveBeat(2)).toBe("reveal");
    expect(getLostFragranceActiveBeat(Number.NaN)).toBe("arrival");
  });

  it("reports intra-beat progress between 0 and 1", () => {
    const beat = LOST_FRAGRANCE_BEATS[1];
    expect(getLostFragranceBeatProgress(beat.start, beat)).toBe(0);
    expect(getLostFragranceBeatProgress(beat.end, beat)).toBe(1);
    const mid = (beat.start + beat.end) / 2;
    expect(getLostFragranceBeatProgress(mid, beat)).toBeCloseTo(0.5);
    expect(getLostFragranceBeatProgress(Number.NaN, beat)).toBe(0);
  });
});
