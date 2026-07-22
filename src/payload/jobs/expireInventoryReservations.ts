import {
  DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE,
  expireDueInventoryReservationOrders,
  type InventoryReservationExpiryBatchResult
} from "@/lib/lost-commerce/inventory-reservation-expiry";
import type { PayloadRequest, TaskConfig } from "payload";

type ExpireInventoryReservationsTaskContract = {
  input: Record<string, never>;
  output: InventoryReservationExpiryBatchResult;
};

export const expireInventoryReservationsTask = {
  slug: "expireInventoryReservations",
  label: "Expire inventory reservations",
  inputSchema: [],
  outputSchema: [
    { name: "ordersExamined", type: "number", required: true },
    { name: "ordersExpired", type: "number", required: true },
    { name: "ordersFailed", type: "number", required: true },
    { name: "reservationsExpired", type: "number", required: true }
  ],
  schedule: [{ cron: "*/15 * * * *", queue: "quarterHour" }],
  retries: 3,
  handler: async ({ req }: { req: PayloadRequest }) => {
    const output = await expireDueInventoryReservationOrders({
      payload: req.payload,
      req,
      batchSize: DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE
    });
    req.payload.logger.info(
      `expireInventoryReservations: examined ${output.ordersExamined} orders, failed ${output.ordersFailed} orders, expired ${output.reservationsExpired} reservations`
    );
    return { output };
  }
} satisfies TaskConfig<ExpireInventoryReservationsTaskContract>;
