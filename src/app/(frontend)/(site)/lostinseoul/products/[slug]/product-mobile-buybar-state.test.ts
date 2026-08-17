import { describe, expect, it } from "vitest";
import { getLostProductMobileBuybarClassName } from "./product-mobile-buybar-state";

describe("LOSTINSEOUL product mobile buy bar state", () => {
  it("keeps purchase actions fixed at the bottom of the mobile viewport", () => {
    const className = getLostProductMobileBuybarClassName();

    expect(className).toContain("fixed");
    expect(className).toContain("inset-x-0");
    expect(className).toContain("bottom-0");
    expect(className).toContain("lg:hidden");
  });

  it("reserves a readable price row above the action buttons", () => {
    const className = getLostProductMobileBuybarClassName();

    expect(className).toContain("grid");
    expect(className).toContain("gap-3");
    expect(className).toContain("px-4");
  });
});
