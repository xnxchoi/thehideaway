import { describe, expect, it } from "vitest";

import {
  DEV_LINKS,
  getMenuLinksForRuntime,
  MENU_LINKS,
  shouldShowDevNavigationLinks
} from "./navigation";

describe("navigation runtime links", () => {
  it("hides dev-only links on the production hostname", () => {
    expect(shouldShowDevNavigationLinks("hideawayseoul.com")).toBe(false);
    expect(getMenuLinksForRuntime("hideawayseoul.com")).toEqual(MENU_LINKS);
  });

  it("shows dev-only links on local hostnames", () => {
    expect(shouldShowDevNavigationLinks("localhost")).toBe(true);
    expect(getMenuLinksForRuntime("localhost")).toEqual([
      ...MENU_LINKS,
      ...DEV_LINKS
    ]);
  });
});
