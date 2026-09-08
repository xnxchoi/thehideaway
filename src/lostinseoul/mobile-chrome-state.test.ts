import { describe, expect, it } from "vitest";

import {
  LOST_HERO_VIDEO_BUTTON_LABEL_CLASS,
  LOST_STATEMENT_CHROME_SAFE_CLASS
} from "./mobile-chrome-state";

describe("LOSTINSEOUL mobile chrome state", () => {
  it("keeps statement copy below the fixed mobile chrome", () => {
    expect(LOST_STATEMENT_CHROME_SAFE_CLASS).toContain(
      "var(--lost-mobile-chrome-safe-height)"
    );
    expect(LOST_STATEMENT_CHROME_SAFE_CLASS).toContain("md:py-40");
  });

  it("keeps the hero video action text visible on mobile", () => {
    const classes = LOST_HERO_VIDEO_BUTTON_LABEL_CLASS.split(/\s+/);

    expect(classes).toContain("flex");
    expect(classes).toContain("min-h-16");
    expect(classes).not.toContain("hidden");
  });
});
