import { describe, expect, it } from "vitest";
import { createTransStore } from "./RP_Ui";

describe("RP transition animations", () => {
  it("exposes the LOSTINSEOUL product handoff variant used by RPage", () => {
    const animations = createTransStore().getState().transitionAnimations;

    expect(animations.LOST_PRODUCT.none).toMatchObject({
      y: "100svh",
      position: "fixed"
    });
    expect(animations.LOST_PRODUCT.entering).toMatchObject({
      y: 0,
      position: "relative"
    });
    expect(animations.LOST_PRODUCT.leaving).toMatchObject({
      scale: 0.5,
      scaleX: 0.9,
      position: "fixed"
    });
  });
});
