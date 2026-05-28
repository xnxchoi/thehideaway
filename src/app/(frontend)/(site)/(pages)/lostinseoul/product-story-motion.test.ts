import { describe, expect, it } from "vitest";
import {
  getLostProductStoryFigureState,
  lostProductStoryFigureTransition,
  type LostProductStoryFigureState
} from "./product-story-motion";

describe("lostinseoul product story motion", () => {
  it.each<{
    expected: Record<string, unknown>;
    index: number;
    state: LostProductStoryFigureState;
  }>([
    {
      expected: { opacity: 1, scale: 1, y: 0, zIndex: 0 },
      index: 0,
      state: "rest"
    },
    {
      expected: { opacity: 0, scale: 1.02, y: 0, zIndex: 1 },
      index: 1,
      state: "rest"
    },
    {
      expected: { opacity: 1, scale: 1, y: 0, zIndex: 1 },
      index: 1,
      state: "hover"
    },
    {
      expected: { opacity: 0, scale: 1, y: "100%", zIndex: 0 },
      index: 2,
      state: "hover"
    }
  ])("returns $state state for story figure $index", ({ expected, index, state }) => {
    expect(getLostProductStoryFigureState(index, state)).toMatchObject(
      expected
    );
  });

  it("keeps the existing story reveal timing", () => {
    expect(lostProductStoryFigureTransition.duration).toBe(0.8);
    expect(lostProductStoryFigureTransition.ease).toEqual([0.6, 0, 0.4, 1]);
  });
});
