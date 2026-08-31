import { describe, expect, it } from "vitest";

import { loadVaultHomeWork, type VaultFind } from "./work";

function findWith(docs: Record<string, Record<string, unknown>[]>): VaultFind {
  return async ({ collection, where }) => {
    const list = docs[collection] ?? [];
    if (
      where &&
      typeof where._status === "object" &&
      where._status !== null &&
      "equals" in where._status &&
      (where._status as { equals: string }).equals === "draft"
    ) {
      return {
        docs: list.filter((doc) => doc._status === "draft")
      };
    }
    if (
      where &&
      typeof where.id === "object" &&
      where.id !== null &&
      "in" in where.id
    ) {
      const ids = (where.id as { in: string[] }).in;
      return { docs: list.filter((doc) => ids.includes(String(doc.id))) };
    }
    return { docs: list };
  };
}

describe("loadVaultHomeWork", () => {
  it("returns drafts, recent, and locks for editorial collections only", async () => {
    const work = await loadVaultHomeWork({
      adminRoute: "/vault",
      find: findWith({
        posts: [
          {
            _status: "draft",
            id: "p1",
            title: "Draft essay",
            updatedAt: "2026-08-31T12:00:00.000Z"
          },
          {
            _status: "published",
            id: "p2",
            title: "Live essay",
            updatedAt: "2026-08-30T12:00:00.000Z"
          }
        ],
        surf: [
          {
            _status: "published",
            id: "s1",
            title: "Tide",
            updatedAt: "2026-08-29T12:00:00.000Z"
          }
        ],
        pages: [],
        "payload-locked-documents": [
          {
            document: { relationTo: "posts", value: "p2" },
            updatedAt: "2026-08-31T10:00:00.000Z",
            user: { firstName: "Butler" }
          },
          {
            document: { relationTo: "users", value: "u1" },
            updatedAt: "2026-08-31T09:00:00.000Z",
            user: { firstName: "Skip" }
          }
        ]
      }),
      user: { id: "butler" }
    });

    expect(work.drafts.map((row) => row.id)).toEqual(["p1"]);
    expect(work.recent.map((row) => row.id)).toEqual(["p1", "p2", "s1"]);
    expect(work.locked).toEqual([
      {
        collection: "posts",
        href: "/vault/collections/posts/p2",
        id: "p2",
        lockedBy: "Butler",
        title: "Live essay",
        updatedAt: "2026-08-31T10:00:00.000Z"
      }
    ]);
    expect(work.errors).toEqual([]);
  });

  it("reports a failed collection query instead of disguising it as empty", async () => {
    const work = await loadVaultHomeWork({
      adminRoute: "/vault",
      find: async ({ collection }) => {
        if (collection === "posts") throw new Error("down");
        if (collection === "payload-locked-documents") {
          throw new Error("locks down");
        }
        return { docs: [] };
      },
      user: { id: "butler" }
    });
    expect(work.errors).toEqual(
      expect.arrayContaining(["posts", "payload-locked-documents"])
    );
    expect(work.drafts).toEqual([]);
    expect(work.locked).toEqual([]);
  });
});
