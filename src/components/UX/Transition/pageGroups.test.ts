import { describe, expect, it } from "vitest";
import { pickTransitionType } from "./pageGroups";

describe("pickTransitionType", () => {
  it("uses the LOSTINSEOUL transition for product-to-product navigation", () => {
    expect(
      pickTransitionType({
        fromHref: "/lostinseoul/products/parasol-0230",
        navIsOpen: false,
        toHref: "/lostinseoul/products/memory-tee"
      }).type
    ).toBe("LOST_PRODUCT");
  });

  it("uses the LOSTINSEOUL transition between storefront and product routes", () => {
    expect(
      pickTransitionType({
        fromHref: "/lostinseoul",
        navIsOpen: false,
        toHref: "/lostinseoul/products/parasol-0230"
      }).type
    ).toBe("LOST_PRODUCT");
  });

  it("keeps collection and checkout surfaces on the LOSTINSEOUL transition path", () => {
    expect(
      pickTransitionType({
        fromHref: "/lostinseoul/collections/available-now",
        navIsOpen: false,
        toHref: "/lostinseoul/products/memory-tee"
      }).type
    ).toBe("LOST_PRODUCT");

    expect(
      pickTransitionType({
        fromHref: "/lostinseoul/products/memory-tee",
        navIsOpen: false,
        toHref: "/lostinseoul/checkout"
      }).type
    ).toBe("LOST_PRODUCT");
  });

  it("does not run the LOSTINSEOUL transition for same-route query/hash changes", () => {
    expect(
      pickTransitionType({
        fromHref: "/lostinseoul/products/memory-tee",
        navIsOpen: false,
        toHref: "/lostinseoul/products/memory-tee?variant=dark"
      }).type
    ).toBe("FADE");
  });
});
