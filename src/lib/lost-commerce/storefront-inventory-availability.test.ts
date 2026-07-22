import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";

import { getStorefrontInventoryAvailability } from "./storefront-inventory-availability";

const POLICY_ENV = {
  LOST_INVENTORY_RESERVATIONS_LIVE: "true",
  LOST_INVENTORY_RESERVATION_TTL_MINUTES: "15",
  LOST_INVENTORY_RESERVATION_LOCATION_CODE: "SEOUL",
  LOST_INVENTORY_SAFETY_STOCK: "2",
  LOST_INVENTORY_RESERVATION_CONSUME_POINT: "payment_confirmed",
  LOST_INVENTORY_EXPIRY_BOUNDARY: "at_or_after",
  LOST_INVENTORY_PAYMENT_TIME_SOURCE: "provider_paid_at",
  LOST_INVENTORY_LATE_PAYMENT_POLICY: "manual_review",
  LOST_INVENTORY_BACKORDER_MODE: "disabled"
} as const;

const originalEnv = Object.fromEntries(
  Object.keys(POLICY_ENV).map((key) => [key, process.env[key]])
);

function setPolicyEnv() {
  Object.assign(process.env, POLICY_ENV);
}

function payloadWithExecute(
  execute: ReturnType<typeof vi.fn>,
  error: ReturnType<typeof vi.fn> = vi.fn()
) {
  return {
    db: { drizzle: { execute } },
    logger: { error }
  } as unknown as Payload;
}

beforeEach(setPolicyEnv);

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("storefront inventory availability", () => {
  it("returns one batched ATP map from the configured active location aggregate", async () => {
    const execute = vi.fn().mockResolvedValue({
      rows: [
        { sku_id: "sku-a", available_to_promise: 4 },
        { sku_id: "sku-b", available_to_promise: 0 }
      ]
    });

    const result = await getStorefrontInventoryAvailability({
      payload: payloadWithExecute(execute),
      paymentProvider: "portone",
      skuIds: ["sku-b", "sku-a", "sku-a"]
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect([...result]).toEqual([
      ["sku-a", 4],
      ["sku-b", 0]
    ]);
  });

  it("fails closed without executing SQL when the complete PortOne policy is unavailable", async () => {
    delete process.env.LOST_INVENTORY_RESERVATION_LOCATION_CODE;
    const execute = vi.fn();

    const result = await getStorefrontInventoryAvailability({
      payload: payloadWithExecute(execute),
      paymentProvider: "portone",
      skuIds: ["sku-a"]
    });

    expect(result.size).toBe(0);
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    { rows: [{ sku_id: "sku-a", available_to_promise: -1 }] },
    { rows: [{ sku_id: "sku-a", available_to_promise: 1.5 }] },
    { rows: [{ sku_id: "unrequested", available_to_promise: 1 }] },
    { rows: undefined }
  ])("fails closed on malformed aggregate output: %#", async (output) => {
    const execute = vi.fn().mockResolvedValue(output);
    const error = vi.fn();

    const result = await getStorefrontInventoryAvailability({
      payload: payloadWithExecute(execute, error),
      paymentProvider: "portone",
      skuIds: ["sku-a"]
    });

    expect(result.size).toBe(0);
    expect(error).toHaveBeenCalledWith({
      msg: "Storefront inventory availability returned invalid data",
      skuCount: 1
    });
  });

  it("fails closed when the aggregate query is unavailable", async () => {
    const execute = vi.fn().mockRejectedValue(new Error("database-offline"));
    const error = vi.fn();

    const result = await getStorefrontInventoryAvailability({
      payload: payloadWithExecute(execute, error),
      paymentProvider: "portone",
      skuIds: ["sku-a"]
    });

    expect(result.size).toBe(0);
    expect(error).toHaveBeenCalledWith({
      msg: "Storefront inventory availability query failed",
      skuCount: 1
    });
  });
});
