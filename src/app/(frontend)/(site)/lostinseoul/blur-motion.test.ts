import { describe, expect, it } from "vitest";
import {
  getLostBlurLineDelay,
  getLostBlurViewportAmount,
  splitLostBlurLines
} from "./blur-motion";

describe("lostinseoul blur motion", () => {
  it("splits sentence-like copy into reveal lines", () => {
    expect(
      splitLostBlurLines(
        "Objects, editions, and small commitments from the city. Some can be bought now. Some only happen if enough people commit."
      )
    ).toEqual([
      "Objects, editions, and small commitments from the city.",
      "Some can be bought now.",
      "Some only happen if enough people commit."
    ]);
  });

  it("falls back to the original text when no sentence boundary exists", () => {
    expect(splitLostBlurLines("Available now")).toEqual(["Available now"]);
  });

  it("converts the old interval rhythm to Motion stagger delays", () => {
    expect(getLostBlurLineDelay(0, 200)).toBe(0);
    expect(getLostBlurLineDelay(1, 200)).toBe(0.2);
    expect(getLostBlurLineDelay(3, 150)).toBe(0.45);
  });

  it("keeps viewport trigger amount in the same range as the old observer threshold", () => {
    expect(getLostBlurViewportAmount()).toBe(0.1);
  });
});
