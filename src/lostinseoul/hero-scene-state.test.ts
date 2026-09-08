import { describe, expect, it } from "vitest";
import {
  getLostHeroPostTheme,
  shouldPauseLostHeroVideo,
  shouldRenderLostHeroFrame
} from "./hero-scene-state";

describe("lostinseoul hero scene state", () => {
  it("pauses the hero video while the document is hidden or bag is open", () => {
    expect(
      shouldPauseLostHeroVideo({ cartOpen: false, documentHidden: false })
    ).toBe(false);
    expect(
      shouldPauseLostHeroVideo({ cartOpen: true, documentHidden: false })
    ).toBe(true);
    expect(
      shouldPauseLostHeroVideo({ cartOpen: false, documentHidden: true })
    ).toBe(true);
  });

  it("uses the dark post theme when either overlay owns the scene", () => {
    expect(getLostHeroPostTheme({ cartOpen: false, videoOpen: false })).toBe(
      "light"
    );
    expect(getLostHeroPostTheme({ cartOpen: true, videoOpen: false })).toBe(
      "dark"
    );
    expect(getLostHeroPostTheme({ cartOpen: false, videoOpen: true })).toBe(
      "dark"
    );
  });

  it("renders the hero frame only while the document can display it", () => {
    expect(
      shouldRenderLostHeroFrame({ documentHidden: false, inViewport: true })
    ).toBe(true);
    expect(
      shouldRenderLostHeroFrame({ documentHidden: true, inViewport: true })
    ).toBe(false);
    expect(
      shouldRenderLostHeroFrame({ documentHidden: false, inViewport: false })
    ).toBe(false);
  });
});
