import { describe, expect, it } from "vitest";

import { JPY, KRW } from "./currencies";

describe("ecommerce currencies", () => {
  it("treats KRW as a zero-decimal integer currency", () => {
    expect(KRW).toMatchObject({
      code: "KRW",
      decimals: 0,
      symbol: "₩"
    });
  });

  it("treats JPY as a zero-decimal integer currency", () => {
    expect(JPY).toMatchObject({
      code: "JPY",
      decimals: 0,
      symbol: "¥"
    });
  });
});
