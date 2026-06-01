import { describe, expect, it } from "vitest";
import {
  getLostProductActiveImageFromScroll,
  getLostProductDesktopSlideClassName,
  getLostProductDesktopThumbStyle,
  getLostProductThumbClassName
} from "./product-gallery-state";

describe("LOSTINSEOUL product gallery state", () => {
  it("advances the active desktop image from scroll position without resetting at the gallery tail", () => {
    const base = {
      galleryTop: 91,
      imageCount: 3,
      slideHeight: 705,
      viewportHeight: 900
    };

    expect(getLostProductActiveImageFromScroll({ ...base, scrollY: 0 })).toBe(
      0
    );
    expect(getLostProductActiveImageFromScroll({ ...base, scrollY: 450 })).toBe(
      1
    );
    expect(getLostProductActiveImageFromScroll({ ...base, scrollY: 1350 })).toBe(
      2
    );
    expect(getLostProductActiveImageFromScroll({ ...base, scrollY: 2700 })).toBe(
      2
    );
  });

  it("only pins the first desktop slide to the first grid row", () => {
    expect(
      getLostProductDesktopSlideClassName({ activeImage: 0, index: 0 })
    ).toContain("row-start-1");
    expect(
      getLostProductDesktopSlideClassName({ activeImage: 0, index: 1 })
    ).not.toContain("row-start-1");
    expect(
      getLostProductDesktopSlideClassName({ activeImage: 0, index: 2 })
    ).not.toContain("row-start-1");
  });

  it("marks prior desktop thumbnails as previous, not mobile thumbnails", () => {
    expect(getLostProductThumbClassName({ activeImage: 2, index: 0 })).toContain(
      "is-prev"
    );
    expect(getLostProductThumbClassName({ activeImage: 2, index: 1 })).toContain(
      "is-prev"
    );
    expect(
      getLostProductThumbClassName({ activeImage: 2, index: 2 })
    ).not.toContain("is-prev");
    expect(
      getLostProductThumbClassName({ activeImage: 2, index: 0, mobile: true })
    ).not.toContain("is-prev");
  });

  it("returns an explicit collapse style for previous desktop thumbnails", () => {
    expect(
      getLostProductDesktopThumbStyle({ activeImage: 1, index: 0 })
    ).toMatchObject({
      opacity: 0,
      pointerEvents: "none",
      transform: "translate3d(0, 50%, 0) scale(0)"
    });
    expect(
      getLostProductDesktopThumbStyle({ activeImage: 1, index: 1 })
    ).toBeUndefined();
  });
});
