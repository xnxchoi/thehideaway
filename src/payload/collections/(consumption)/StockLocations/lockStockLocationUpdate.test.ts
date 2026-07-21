import { beforeEach, describe, expect, it, vi } from "vitest";

const { inventoryLocationLock } = vi.hoisted(() => ({
  inventoryLocationLock: vi.fn()
}));

vi.mock("@/lib/db/sequences", () => ({ inventoryLocationLock }));

import { lockStockLocationUpdate } from "./lockStockLocationUpdate";

describe("lockStockLocationUpdate", () => {
  beforeEach(() => inventoryLocationLock.mockReset());

  it("locks a single location update in the caller transaction", async () => {
    const payload = {};
    await lockStockLocationUpdate({
      operation: "updateByID",
      args: { id: "location-b" },
      req: { payload, transactionID: "tx-1", user: { role: "admin" } },
      overrideAccess: false
    } as never);

    expect(inventoryLocationLock).toHaveBeenCalledWith(
      payload,
      "tx-1",
      "location-b"
    );
  });

  it("fails closed for bulk and non-transactional updates", async () => {
    await expect(
      lockStockLocationUpdate({
        operation: "update",
        args: {},
        req: { payload: {}, transactionID: "tx-1", user: { role: "admin" } }
      } as never)
    ).rejects.toThrow("stock-location-bulk-update-disabled");

    await expect(
      lockStockLocationUpdate({
        operation: "updateByID",
        args: { id: "location-a" },
        req: { payload: {}, user: { role: "admin" } }
      } as never)
    ).rejects.toThrow("stock-location-update-transaction-required");
  });

  it("does not lock create or read operations", async () => {
    await lockStockLocationUpdate({
      operation: "create",
      args: {},
      req: { payload: {} }
    } as never);

    expect(inventoryLocationLock).not.toHaveBeenCalled();
  });
});
