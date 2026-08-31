import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEARCH_AUTHOR,
  ensureSearchAuthor
} from "./ensureSearchAuthor";

describe("ensureSearchAuthor", () => {
  it("fills The Hideaway when a page has no authors", () => {
    const filled = ensureSearchAuthor([]);

    expect(filled).toHaveLength(1);
    expect(filled[0]).toEqual(
      expect.objectContaining({
        key: DEFAULT_SEARCH_AUTHOR.key,
        name: DEFAULT_SEARCH_AUTHOR.name,
        slug: DEFAULT_SEARCH_AUTHOR.slug
      })
    );
    expect(filled[0].id).toEqual(expect.any(String));
  });

  it("fills The Hideaway when author is missing", () => {
    expect(ensureSearchAuthor(undefined)).toHaveLength(1);
    expect(ensureSearchAuthor(null)).toHaveLength(1);
  });

  it("keeps authors that already exist", () => {
    const existing = [
      {
        id: "row-1",
        key: "user-1",
        name: "Butler",
        slug: "butler"
      }
    ];

    expect(ensureSearchAuthor(existing)).toEqual(existing);
  });
});
