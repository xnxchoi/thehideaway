import { describe, expect, it } from "vitest";
import { shouldEnableLostProductStage } from "./product-stage-gate";

describe("shouldEnableLostProductStage", () => {
  it("enables the mesh stage when the product IS the fragrance product", () => {
    expect(
      shouldEnableLostProductStage({
        productSlug: "catalyst",
        fragranceSlug: "catalyst"
      })
    ).toBe(true);
  });

  it("keeps the image gallery for any other product", () => {
    expect(
      shouldEnableLostProductStage({
        productSlug: "some-other-thing",
        fragranceSlug: "catalyst"
      })
    ).toBe(false);
  });

  it("is disabled when there is no fragrance product to compare against", () => {
    expect(
      shouldEnableLostProductStage({
        productSlug: "catalyst",
        fragranceSlug: null
      })
    ).toBe(false);
    expect(
      shouldEnableLostProductStage({
        productSlug: "catalyst",
        fragranceSlug: undefined
      })
    ).toBe(false);
  });

  it("is disabled when the product slug is missing", () => {
    expect(
      shouldEnableLostProductStage({
        productSlug: null,
        fragranceSlug: "catalyst"
      })
    ).toBe(false);
    expect(
      shouldEnableLostProductStage({
        productSlug: undefined,
        fragranceSlug: "catalyst"
      })
    ).toBe(false);
  });

  it("does not treat two empty slugs as a match", () => {
    expect(
      shouldEnableLostProductStage({ productSlug: "", fragranceSlug: "" })
    ).toBe(false);
  });
});
