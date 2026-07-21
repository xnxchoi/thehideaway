import { beforeEach, describe, expect, it, vi } from "vitest";

import { productSkuMutationLock } from "@/lib/db/sequences";
import { lockProductVariantUpdate } from "./lockProductVariantUpdate";

vi.mock("@/lib/db/sequences", () => ({
  productSkuMutationLock: vi.fn()
}));

describe("lockProductVariantUpdate", () => {
  beforeEach(() => {
    vi.mocked(productSkuMutationLock).mockReset();
  });

  it("serializes an update by SKU ID inside its Payload transaction", async () => {
    const payload = {} as never;

    await lockProductVariantUpdate({
      operation: "updateByID",
      args: { id: "sku-1" },
      overrideAccess: true,
      req: { payload, transactionID: "tx-1" }
    } as never);

    expect(productSkuMutationLock).toHaveBeenCalledWith(
      payload,
      "tx-1",
      "sku-1"
    );
  });

  it("fails closed for bulk and non-transactional updates", async () => {
    await expect(
      lockProductVariantUpdate({
        operation: "update",
        args: { where: {} },
        req: { payload: {} }
      } as never)
    ).rejects.toThrow("sku-bulk-update-disabled");

    await expect(
      lockProductVariantUpdate({
        operation: "updateByID",
        args: { id: "sku-1" },
        overrideAccess: true,
        req: { payload: {} }
      } as never)
    ).rejects.toThrow("sku-update-transaction-required");
  });

  it("rejects untrusted callers before they can queue on the SKU lock", async () => {
    await expect(
      lockProductVariantUpdate({
        operation: "updateByID",
        args: { id: "sku-1" },
        overrideAccess: false,
        req: {
          payload: {},
          transactionID: "tx-1",
          user: { role: "user" }
        }
      } as never)
    ).rejects.toThrow("sku-update-forbidden");

    expect(productSkuMutationLock).not.toHaveBeenCalled();
  });

  it("does not lock non-update operations", async () => {
    await expect(
      lockProductVariantUpdate({
        operation: "create",
        args: {},
        req: { payload: {} }
      } as never)
    ).resolves.toBeUndefined();

    expect(productSkuMutationLock).not.toHaveBeenCalled();
  });
});
