import { beforeEach, describe, expect, it, vi } from "vitest";

import { productInventoryLock } from "@/lib/db/sequences";

import { lockProductUpdate } from "./lockProductUpdate";

vi.mock("@/lib/db/sequences", () => ({
  productInventoryLock: vi.fn()
}));

describe("lockProductUpdate", () => {
  beforeEach(() => {
    vi.mocked(productInventoryLock).mockReset();
  });

  it("locks one product update inside the Payload transaction", async () => {
    const payload = {};

    await lockProductUpdate({
      operation: "updateByID",
      args: { id: "product-1" },
      overrideAccess: true,
      req: { payload, transactionID: "tx-1" }
    } as never);

    expect(productInventoryLock).toHaveBeenCalledWith(
      payload,
      "tx-1",
      "product-1"
    );
  });

  it("rejects bulk updates and updates without a transaction", async () => {
    await expect(
      lockProductUpdate({
        operation: "update",
        args: {},
        overrideAccess: true,
        req: { payload: {}, transactionID: "tx-1" }
      } as never)
    ).rejects.toThrow("product-bulk-update-disabled");

    await expect(
      lockProductUpdate({
        operation: "updateByID",
        args: { id: "product-1" },
        overrideAccess: true,
        req: { payload: {} }
      } as never)
    ).rejects.toThrow("product-update-transaction-required");
  });

  it("ignores non-update operations", async () => {
    await expect(
      lockProductUpdate({
        operation: "create",
        args: {},
        req: { payload: {} }
      } as never)
    ).resolves.toBeUndefined();
    expect(productInventoryLock).not.toHaveBeenCalled();
  });
});
