import type { CommerceOrderStatus } from "./order-transitions";
import { assertOrderTransition } from "./order-transitions";
import {
  projectCommerceOrder,
  type CommerceOrderProjection,
  type CommerceRepository
} from "./create-order";

export type FulfillmentStatus = Extract<
  CommerceOrderStatus,
  "preparing" | "shipped" | "completed"
>;

export async function transitionOrderStatus(input: {
  repository: CommerceRepository;
  orderRef: string;
  status: FulfillmentStatus;
  trackingNumber?: string;
  now?: string;
}): Promise<CommerceOrderProjection> {
  const order = await input.repository.findOrderByRef(input.orderRef.trim());
  if (!order) throw new Error("order-not-found");
  if (order.paymentStatus !== "paid") throw new Error("order-not-paid");
  assertOrderTransition(order.status, input.status);

  const now = input.now ?? new Date().toISOString();
  const trackingNumber = input.trackingNumber?.trim();
  if (trackingNumber && trackingNumber.length > 128) {
    throw new Error("invalid-tracking-number");
  }
  const updated = await input.repository.updateOrderLifecycle(order.id, {
    status: input.status,
    ...(trackingNumber ? { trackingNumber } : {}),
    ...(input.status === "shipped" ? { shippedAt: now } : {}),
    ...(input.status === "completed" ? { completedAt: now } : {})
  });
  return projectCommerceOrder(updated);
}
