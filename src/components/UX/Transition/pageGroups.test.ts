import { describe, expect, it } from "vitest";
import { pickTransitionType } from "./pageGroups";

describe("pickTransitionType settings shell", () => {
  it("keeps the settings shell in place between section paths", () => {
    const decision = pickTransitionType({
      fromHref: "/me/settings/profile",
      toHref: "/me/settings/security",
      navIsOpen: false
    });
    expect(decision.type).toBe("SHELL");
  });

  it("keeps the settings shell from the hub to a section", () => {
    const decision = pickTransitionType({
      fromHref: "/me/settings",
      toHref: "/me/settings/general",
      navIsOpen: false
    });
    expect(decision.type).toBe("SHELL");
  });

  it("does not reuse the in-shell handoff when leaving settings", () => {
    const decision = pickTransitionType({
      fromHref: "/me/settings/security",
      toHref: "/me",
      navIsOpen: false
    });
    expect(decision.type).not.toBe("SHELL");
  });
});

describe("LOST host transition handoff", () => {
  it.each([
    ["/", "/products/coat"],
    ["/products/coat", "/products/jacket?variant=blue"],
    ["/collections/archive", "/cart"]
  ])("keeps %s to %s inside storefront transitions", (fromHref, toHref) => {
    expect(
      pickTransitionType({
        fromHref,
        toHref,
        navIsOpen: false,
        onLostHost: true
      }).type
    ).toBe("LOST_PRODUCT");
  });
  it("preserves primary-host home and editorial transitions", () => {
    expect(
      pickTransitionType({
        fromHref: "/",
        toHref: "/essays/a",
        navIsOpen: false,
        onLostHost: false
      }).type
    ).toBe("CURTAIN");
  });
});
