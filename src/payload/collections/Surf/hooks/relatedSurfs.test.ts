import { describe, expect, it, vi } from "vitest";

import {
  defaultRelatedSurfs,
  filterRelatedSurfs
} from "./relatedSurfs";

describe("relatedSurfs", () => {
  it("starts empty on create and does not look up published docs", async () => {
    const find = vi.fn();
    await expect(
      defaultRelatedSurfs({
        user: { id: "butler" },
        req: { payload: { find } }
      })
    ).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it("does not restrict related picks before the surf has an id", () => {
    expect(filterRelatedSurfs({ id: undefined })).toBe(true);
    expect(filterRelatedSurfs({})).toBe(true);
  });

  it("excludes the current surf after it exists", () => {
    expect(filterRelatedSurfs({ id: "surf-1" })).toEqual({
      id: { not_in: ["surf-1"] }
    });
  });
});
