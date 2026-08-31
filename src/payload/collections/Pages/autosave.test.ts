import { describe, expect, it } from "vitest";

import { Pages } from "./index";

describe("Pages drafts", () => {
  it("does not autosave empty create drafts", () => {
    const drafts = Pages.versions?.drafts;
    expect(drafts && typeof drafts === "object" ? drafts.autosave : undefined).toBe(
      false
    );
  });
});
