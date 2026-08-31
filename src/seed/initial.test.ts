import { describe, expect, it, vi } from "vitest";

import { ensureUncategorized } from "./initial";

describe("ensureUncategorized", () => {
  it("returns the existing category id without creating", async () => {
    const create = vi.fn();
    const payload = {
      create,
      find: vi.fn().mockResolvedValue({
        docs: [{ id: "cat-existing" }]
      })
    };

    await expect(
      ensureUncategorized(payload as never)
    ).resolves.toBe("cat-existing");
    expect(create).not.toHaveBeenCalled();
  });

  it("creates Uncategorized when no row matches the slug", async () => {
    const create = vi.fn().mockResolvedValue({ id: "cat-new" });
    const payload = {
      create,
      find: vi.fn().mockResolvedValue({ docs: [] })
    };

    await expect(
      ensureUncategorized(payload as never)
    ).resolves.toBe("cat-new");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "categories",
        overrideAccess: true,
        data: expect.objectContaining({
          slug: "uncategorized",
          title: "Uncategorized"
        })
      })
    );
  });

  it("looks up by slug with id-only select so join fields are not queried", async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({
        docs: [{ id: "cat-existing" }]
      })
    };

    await ensureUncategorized(payload as never);
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "categories",
        select: { id: true },
        where: { slug: { equals: "uncategorized" } }
      })
    );
  });
});
