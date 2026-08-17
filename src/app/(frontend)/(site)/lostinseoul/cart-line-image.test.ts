import { describe, expect, it } from "vitest";
import {
  getLostCartLineImageConfig,
  getLostCartLineImageSizes
} from "./cart-line-image";

describe("LOSTINSEOUL cart line image sizing", () => {
  it("uses the larger cart-page thumbnail size on tablet and desktop", () => {
    expect(getLostCartLineImageSizes("page")).toBe(
      "(min-width: 768px) 116px, 112px"
    );
  });

  it("uses the compact bag overlay thumbnail size", () => {
    expect(getLostCartLineImageSizes("overlay")).toBe("72px");
  });

  it("does not route cart thumbnails through the Next optimizer", () => {
    expect(getLostCartLineImageConfig("page")).toMatchObject({
      height: 116,
      sizes: "(min-width: 768px) 116px, 112px",
      unoptimized: true,
      width: 116
    });
  });
});
