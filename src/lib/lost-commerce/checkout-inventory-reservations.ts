import type { Payload } from "payload";

import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "./commerce-commands";
import type { InventoryReservationPolicy } from "./inventory-reservation-contracts";
import type { ReservationTransactionRequest } from "./inventory-reservation-store";
import { reserveOrderInventoryInTransaction } from "./inventory-reservations";

type CheckoutReservationLine = Readonly<{
  mode: string;
  skuId: string;
  quantity: number;
}>;

function requiredReference(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(code);
  return value;
}

function aggregateStandardLines(lines: readonly CheckoutReservationLine[]) {
  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (line.mode !== "standard_purchase") continue;
    const skuId = requiredReference(line.skuId, "invalid-inventory-sku");
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("invalid-inventory-reservation-quantity");
    }
    const quantity = (quantities.get(skuId) ?? 0) + line.quantity;
    if (!Number.isSafeInteger(quantity)) {
      throw new Error("invalid-inventory-reservation-quantity");
    }
    quantities.set(skuId, quantity);
  }
  if (quantities.size === 0) {
    throw new Error("invalid-inventory-reservation-batch");
  }
  return [...quantities.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

export async function reserveCheckoutOrderInventoryInTransaction(input: {
  payload: Payload;
  req: ReservationTransactionRequest;
  order: Readonly<{ id: unknown; expires_at?: unknown }>;
  lines: readonly CheckoutReservationLine[];
  policy: InventoryReservationPolicy;
  commandKey: string;
  effectiveAt: string;
}) {
  const locations = await input.payload.find({
    collection: "stock-locations",
    depth: 0,
    limit: 2,
    pagination: false,
    overrideAccess: true,
    req: input.req,
    where: { code: { equals: input.policy.locationCode } }
  });
  const matching = (locations.docs as Array<Record<string, unknown>>).filter(
    (location) =>
      location.active === true && location.code === input.policy.locationCode
  );
  if (matching.length !== 1) {
    throw new Error("inventory-reservation-location-unavailable");
  }

  const orderId = requiredReference(input.order.id, "invalid-inventory-order");
  const locationId = requiredReference(
    matching[0].id,
    "inventory-reservation-location-unavailable"
  );
  const expiresAt = requiredReference(
    input.order.expires_at,
    "invalid-inventory-reservation-expiry"
  );
  const commandKey = validateCommerceCommandKey(input.commandKey);
  const requests = aggregateStandardLines(input.lines).map(
    ([skuId, quantity]) => ({
      idempotencyKey: hashCommerceCommandInput({
        commandKey,
        operation: "reserve",
        orderId,
        skuId,
        locationId
      }),
      operation: "reserve" as const,
      orderId,
      skuId,
      locationId,
      quantity,
      expiresAt,
      effectiveAt: input.effectiveAt
    })
  );

  return reserveOrderInventoryInTransaction({
    payload: input.payload,
    req: input.req,
    requests,
    policy: input.policy
  });
}
