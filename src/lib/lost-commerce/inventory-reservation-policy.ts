import {
  parseInventoryReservationPolicy,
  type InventoryReservationPolicy
} from "./inventory-reservation-contracts";

export function requireInventoryReservationPolicyForCheckout(options: {
  paymentProvider?: unknown;
}): InventoryReservationPolicy {
  return parseInventoryReservationPolicy(
    {
      enabled: process.env.LOST_INVENTORY_RESERVATIONS_LIVE,
      ttlMinutes: process.env.LOST_INVENTORY_RESERVATION_TTL_MINUTES,
      locationCode: process.env.LOST_INVENTORY_RESERVATION_LOCATION_CODE,
      safetyStock: process.env.LOST_INVENTORY_SAFETY_STOCK,
      consumePoint: process.env.LOST_INVENTORY_RESERVATION_CONSUME_POINT,
      expiryBoundary: process.env.LOST_INVENTORY_EXPIRY_BOUNDARY,
      paymentTimeSource: process.env.LOST_INVENTORY_PAYMENT_TIME_SOURCE,
      latePaymentPolicy: process.env.LOST_INVENTORY_LATE_PAYMENT_POLICY,
      backorderMode: process.env.LOST_INVENTORY_BACKORDER_MODE
    },
    options
  );
}
