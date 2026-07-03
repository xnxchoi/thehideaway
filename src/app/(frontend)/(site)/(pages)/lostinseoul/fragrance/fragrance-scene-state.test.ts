import { describe, expect, it } from "vitest";
import {
  shouldPauseLostFragranceScene,
  shouldRenderLostFragranceFrame
} from "./fragrance-scene-state";

describe("LOSTINSEOUL fragrance scene state", () => {
  it("pauses while the bag overlay is open or the tab is hidden", () => {
    expect(
      shouldPauseLostFragranceScene({ bagOpen: true, documentHidden: false })
    ).toBe(true);
    expect(
      shouldPauseLostFragranceScene({ bagOpen: false, documentHidden: true })
    ).toBe(true);
    expect(
      shouldPauseLostFragranceScene({ bagOpen: false, documentHidden: false })
    ).toBe(false);
  });

  it("renders frames only when visible and in viewport", () => {
    expect(
      shouldRenderLostFragranceFrame({
        documentHidden: false,
        inViewport: true
      })
    ).toBe(true);
    expect(
      shouldRenderLostFragranceFrame({ documentHidden: true, inViewport: true })
    ).toBe(false);
    expect(
      shouldRenderLostFragranceFrame({
        documentHidden: false,
        inViewport: false
      })
    ).toBe(false);
  });
});
