import { describe, expect, it } from "vitest";
import {
  getLostProductPanelFigureState,
  getLostProductPanelState,
  lostProductPanelTransition
} from "./product-panel-motion";

describe("lostinseoul product panel motion", () => {
  it("opens with transform and opacity instead of clip-path state", () => {
    expect(getLostProductPanelState(true)).toMatchObject({
      opacity: 1,
      pointerEvents: "auto",
      visibility: "visible",
      y: "0%"
    });
  });

  it("closes off the composited y-axis", () => {
    expect(getLostProductPanelState(false)).toMatchObject({
      opacity: 0,
      pointerEvents: "none",
      visibility: "hidden",
      y: "-100%"
    });
  });

  it("keeps the figure drift aligned with the old CSS transition", () => {
    expect(getLostProductPanelFigureState(false)).toMatchObject({ y: "-8%" });
    expect(getLostProductPanelFigureState(true)).toMatchObject({ y: "0%" });
  });

  it("uses the existing panel timing", () => {
    expect(lostProductPanelTransition.duration).toBe(0.8);
    expect(lostProductPanelTransition.ease).toEqual([0.6, 0, 0.3, 1]);
  });
});
