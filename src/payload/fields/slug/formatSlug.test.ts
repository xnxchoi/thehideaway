import { describe, expect, it } from "vitest";

import {
  composeHashedSlug,
  formatSlug,
  formatSlugHook,
  isBlankSlugKey
} from "./formatSlug";

describe("formatSlug", () => {
  it("slugifies latin titles", () => {
    expect(formatSlug("Walk Published Page")).toBe("walk-published-page");
  });
});

describe("isBlankSlugKey", () => {
  it("treats missing and stringified nullish as blank", () => {
    expect(isBlankSlugKey(undefined)).toBe(true);
    expect(isBlankSlugKey(null)).toBe(true);
    expect(isBlankSlugKey("")).toBe(true);
    expect(isBlankSlugKey("undefined")).toBe(true);
    expect(isBlankSlugKey("null")).toBe(true);
    expect(isBlankSlugKey("walk-page")).toBe(false);
  });
});

describe("composeHashedSlug", () => {
  it("does not stringify undefined or null into the slug", () => {
    expect(composeHashedSlug(undefined, "abc123")).toBe("abc123");
    expect(composeHashedSlug(null, "abc123")).toBe("abc123");
    expect(composeHashedSlug("undefined", "abc123")).toBe("abc123");
  });

  it("joins a real key with the hash", () => {
    expect(composeHashedSlug("walk-page", "abc123")).toBe("walk-page-abc123");
  });
});

describe("formatSlugHook", () => {
  const hook = formatSlugHook("title");

  it("derives from title instead of returning undefined", () => {
    expect(
      hook({
        data: { title: "Walk published page" },
        operation: "create",
        value: undefined
      } as never)
    ).toBe("walk-published-page");
  });

  it("replaces a stringified nullish key when title exists", () => {
    expect(
      hook({
        data: { title: "Walk published page", slug: "undefined-abc" },
        operation: "update",
        value: "undefined"
      } as never)
    ).toBe("walk-published-page");
  });

  it("returns empty string when there is no title yet", () => {
    expect(
      hook({
        data: {},
        operation: "create",
        value: undefined
      } as never)
    ).toBe("");
  });
});
