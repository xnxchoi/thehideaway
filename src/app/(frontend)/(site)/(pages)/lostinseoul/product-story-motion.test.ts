import { describe, expect, it } from "vitest";
import {
  clampLostProductStoryIndex,
  getLostProductStoryFigureState,
  getLostProductStoryProgressClassName,
  lostProductStoryFigureTransition,
} from "./product-story-motion";

describe("lostinseoul product story motion", () => {
  it.each<{
    expected: Record<string, unknown>;
    activeIndex: number;
    index: number;
  }>([
    {
      activeIndex: 0,
      expected: { opacity: 1, scale: 1, y: 0, zIndex: 2 },
      index: 0
    },
    {
      activeIndex: 2,
      expected: { opacity: 0, scale: 1.04, y: 0, zIndex: 1 },
      index: 1
    },
    {
      activeIndex: 2,
      expected: { opacity: 1, scale: 1, y: 0, zIndex: 2 },
      index: 2
    },
    {
      activeIndex: 1,
      expected: { opacity: 0, scale: 1.02, y: "100%", zIndex: 0 },
      index: 2
    }
  ])(
    "returns motion state for story figure $index when $activeIndex is active",
    ({ activeIndex, expected, index }) => {
      expect(getLostProductStoryFigureState(index, activeIndex)).toMatchObject(
        expected
      );
    }
  );

  it("clamps pointer-derived story indices to available images", () => {
    expect(clampLostProductStoryIndex(-1, 3)).toBe(0);
    expect(clampLostProductStoryIndex(1, 3)).toBe(1);
    expect(clampLostProductStoryIndex(8, 3)).toBe(2);
    expect(clampLostProductStoryIndex(4, 0)).toBe(0);
  });

  it("fills progress bars up to the active story image", () => {
    expect(getLostProductStoryProgressClassName(0, 2)).toContain("is-active");
    expect(getLostProductStoryProgressClassName(1, 2)).toContain("is-active");
    expect(getLostProductStoryProgressClassName(2, 2)).toContain("is-active");
    expect(getLostProductStoryProgressClassName(3, 2)).not.toContain(
      "is-active"
    );
  });

  it("keeps the existing story reveal timing", () => {
    expect(lostProductStoryFigureTransition.duration).toBe(0.8);
    expect(lostProductStoryFigureTransition.ease).toEqual([0.6, 0, 0.4, 1]);
  });
});
