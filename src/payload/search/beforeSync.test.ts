import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payload", () => ({
  getPayload: vi.fn(async () => ({
    find: vi.fn(async () => ({ docs: [] }))
  }))
}));

import { beforeSyncWithSearch } from "./beforeSync";
import { DEFAULT_SEARCH_AUTHOR } from "./ensureSearchAuthor";

const payload = {
  find: vi.fn(),
  findByID: vi.fn()
};

describe("beforeSyncWithSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gives pages a search author so publish is not rolled back", async () => {
    const synced = await beforeSyncWithSearch({
      originalDoc: {
        id: "page-1",
        title: "Walk published page",
        slug: "walk-published-page-abc",
        _status: "published"
      },
      payload,
      req: { payload },
      searchDoc: {
        title: "Walk published page",
        slug: "walk-published-page-abc",
        author: [],
        locked: false,
        category: [],
        doc: {
          relationTo: "pages",
          value: "page-1"
        }
      }
    } as never);

    expect(synced.author).toEqual([
      expect.objectContaining({
        key: DEFAULT_SEARCH_AUTHOR.key,
        name: DEFAULT_SEARCH_AUTHOR.name,
        slug: DEFAULT_SEARCH_AUTHOR.slug
      })
    ]);
  });
});
