import { describe, expect, it } from "vitest";

import {
  catalogUnitAmount,
  priceFieldName
} from "./catalog-money";

describe("plugin catalog money", () => {
  it("maps a currency code onto the plugin integer price field", () => {
    expect(priceFieldName("KRW")).toBe("priceInKRW");
    expect(priceFieldName("usd")).toBe("priceInUSD");
  });

  it("reads a positive plugin price and ignores zero or missing amounts", () => {
    expect(catalogUnitAmount({ priceInKRW: 55_000 })).toBe(55_000);
    expect(catalogUnitAmount({ priceInUSD: 1299 }, "USD")).toBe(1299);
    expect(catalogUnitAmount({ priceInKRW: 0 })).toBe(0);
    expect(
      catalogUnitAmount({ priceInKRW: 55_000, priceInKRWEnabled: false })
    ).toBe(0);
    expect(catalogUnitAmount({ unit_amount: 55_000 })).toBe(0);
    expect(catalogUnitAmount({})).toBe(0);
  });
});
