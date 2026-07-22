import { describe, expect, it, vi } from "vitest";

import {
  compareReservationText,
  findReservationDocs
} from "./inventory-reservation-store";

describe("inventory reservation document reads", () => {
  it("sorts reservation identifiers deterministically", () => {
    expect(compareReservationText("b", "a")).toBe(1);
    expect(compareReservationText("a", "a")).toBe(0);
  });

  it("reads every page instead of silently truncating reservation history", async () => {
    const allDocs = Array.from({ length: 1001 }, (_, index) => ({
      id: `reservation-${String(index).padStart(4, "0")}`
    }));
    const find = vi.fn(
      async ({ limit, page }: { limit: number; page: number }) => {
        const start = (page - 1) * limit;
        return {
          docs: allDocs.slice(start, start + limit),
          hasNextPage: start + limit < allDocs.length,
          nextPage: start + limit < allDocs.length ? page + 1 : null,
          totalPages: Math.ceil(allDocs.length / limit)
        };
      }
    );

    await expect(
      findReservationDocs(
        { find } as any,
        { transactionID: "tx-1" } as any,
        "inventory-reservations",
        { status: { equals: "active" } },
        "createdAt"
      )
    ).resolves.toEqual(allDocs);
    expect(find).toHaveBeenCalledTimes(2);
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 1000,
        page: 1,
        pagination: true,
        sort: ["createdAt", "id"]
      })
    );
  });

  it("rejects non-advancing pagination metadata", async () => {
    const find = vi.fn(async () => ({
      docs: [],
      hasNextPage: true,
      nextPage: 1,
      totalPages: 2
    }));

    await expect(
      findReservationDocs(
        { find } as any,
        { transactionID: "tx-1" } as any,
        "inventory-reservations",
        {}
      )
    ).rejects.toThrow("inventory-reservation-pagination-corrupt");
  });
});
