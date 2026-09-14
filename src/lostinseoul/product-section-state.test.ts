import { describe, expect, it } from "vitest";

import { getLostProductSectionMetaLabel } from "./product-section-state";

describe("LOSTINSEOUL product section state", () => {
  it.each<[string, number, string]>([
    ["Cart", 2, "Cart / 02"],
    ["카트", 12, "카트 / 12"]
  ])(
    "shows the actual cart quantity with translated label %s",
    (cartLabel, cartCount, expected) => {
      expect(
        getLostProductSectionMetaLabel({
          cartLabel,
          cartCount,
          incomingLabel: "Incoming",
          productCount: 3,
          searchQuery: "",
          searchResultsLabel: "Search results"
        })
      ).toBe(expected);
    }
  );
  it("labels an empty non-search catalog as incoming instead of cart", () => {
    expect(
      getLostProductSectionMetaLabel({
        cartLabel: "Cart",
        incomingLabel: "Incoming",
        productCount: 0,
        searchQuery: "",
        searchResultsLabel: "Search results"
      })
    ).toBe("Incoming / 00");
  });

  it("keeps search result count tied to visible products", () => {
    expect(
      getLostProductSectionMetaLabel({
        cartLabel: "Cart",
        incomingLabel: "Incoming",
        productCount: 7,
        searchQuery: "jacket",
        searchResultsLabel: "Search results"
      })
    ).toBe("Search results / 07");
  });

  it("preserves explicit section metadata", () => {
    expect(
      getLostProductSectionMetaLabel({
        cartLabel: "Cart",
        incomingLabel: "Incoming",
        productCount: 0,
        searchQuery: "",
        searchResultsLabel: "Search results",
        sectionMetaLabel: "Related / 02"
      })
    ).toBe("Related / 02");
  });

  it("preserves the existing cart metadata for non-empty catalog sections", () => {
    expect(
      getLostProductSectionMetaLabel({
        cartLabel: "Cart",
        incomingLabel: "Incoming",
        productCount: 3,
        searchQuery: "",
        searchResultsLabel: "Search results"
      })
    ).toBe("Cart / 00");
  });
});
