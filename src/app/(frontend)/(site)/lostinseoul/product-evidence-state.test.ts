import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getLostProductEvidenceSummary,
  getLostProductFallbackMark,
  getLostProductStoryImages
} from "./product-evidence-state";

describe("LOSTINSEOUL product evidence state", () => {
  it("uses CMS-backed summaries as product evidence copy", () => {
    expect(
      getLostProductEvidenceSummary("  Seoul-cut cotton, edition 02.  ")
    ).toBe("Seoul-cut cotton, edition 02.");
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

  it("wires evidence decisions into home product cards", () => {
    const source = readFileSync(join(__dirname, "components.tsx"), "utf8");

    expect(source).toContain("getLostProductStoryImages(product)");
    expect(source).toContain("getLostProductEvidenceSummary(product.summary)");
    expect(source).toContain("getLostProductFallbackMark(product.name)");
    expect(source).toContain("{evidenceSummary ? (");
    expect(source).toContain("{fallbackMark}");
  });
});
