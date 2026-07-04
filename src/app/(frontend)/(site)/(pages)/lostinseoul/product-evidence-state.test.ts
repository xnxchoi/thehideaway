import { describe, expect, it } from "vitest";
import {
  getLostProductEvidenceSummary,
  getLostProductFallbackMark,
  getLostProductStoryImages
} from "./product-evidence-state";

describe("LOSTINSEOUL product evidence state", () => {
  it("uses CMS-backed summaries as product evidence copy", () => {
    expect(getLostProductEvidenceSummary("  Seoul-cut cotton, edition 02.  ")).toBe(
      "Seoul-cut cotton, edition 02."
    );
    expect(getLostProductEvidenceSummary(" ")).toBeNull();
    expect(getLostProductEvidenceSummary(null)).toBeNull();
  });

  it("prefers gallery media before falling back to hero image", () => {
    expect(
      getLostProductStoryImages({
        galleryPreview: [
          { alt: "Detail", url: "/media/detail.jpg" },
          { alt: "Packaging", url: "/media/packaging.jpg" }
        ],
        imageAlt: "Hero",
        imageUrl: "/media/hero.jpg",
        name: "Object 01"
      })
    ).toEqual([
      { alt: "Detail", url: "/media/detail.jpg" },
      { alt: "Packaging", url: "/media/packaging.jpg" }
    ]);

    expect(
      getLostProductStoryImages({
        galleryPreview: [],
        imageAlt: null,
        imageUrl: "/media/hero.jpg",
        name: "Object 01"
      })
    ).toEqual([{ alt: "Object 01", url: "/media/hero.jpg" }]);
  });

  it("uses a stable fallback mark when product media is absent", () => {
    expect(getLostProductFallbackMark("  lost coat  ")).toBe("L");
    expect(getLostProductFallbackMark("향")).toBe("향");
    expect(getLostProductFallbackMark(" ")).toBe("L");
  });
});
