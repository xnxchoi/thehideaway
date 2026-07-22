import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";

import { expireInventoryReservationsTask } from "./expireInventoryReservations";

const expireDueInventoryReservationOrders = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lost-commerce/inventory-reservation-expiry", () => ({
  DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE: 25,
  expireDueInventoryReservationOrders
}));

beforeEach(() => {
  expireDueInventoryReservationOrders.mockReset();
});

describe("expireInventoryReservations Payload task", () => {
  it("is scheduled into the existing quarter-hour queue", () => {
    expect(expireInventoryReservationsTask).toMatchObject({
      slug: "expireInventoryReservations",
      schedule: [{ cron: "*/15 * * * *", queue: "quarterHour" }]
    });
  });

  it("runs one bounded expiry batch and reports its deterministic counts", async () => {
    const output = {
      ordersExamined: 2,
      ordersExpired: 1,
      ordersFailed: 1,
      reservationsExpired: 3
    };
    expireDueInventoryReservationOrders.mockResolvedValue(output);
    const req = {
      payload: { logger: { info: vi.fn() } }
    } as unknown as PayloadRequest;

    const result = await expireInventoryReservationsTask.handler({ req });

    expect(expireDueInventoryReservationOrders).toHaveBeenCalledWith({
      payload: req.payload,
      req,
      batchSize: 25
    });
    expect(result).toEqual({ output });
  });
});
