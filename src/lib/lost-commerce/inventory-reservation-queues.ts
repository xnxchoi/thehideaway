import { hashCommerceCommandInput } from "./commerce-commands";

export type InventoryReservationOperatorQueue =
  "active" | "expiring" | "stuck" | "paid_inventory_review";

type ReservationQueueRecord = Readonly<{
  id: string;
  status: string;
  expiresAt: string;
  updatedAt: string;
  terminalAt?: string | null;
  skuId?: string | null;
  locationId?: string | null;
  quantity?: number | null;
  safetyStock?: number | null;
  recoveryOf?: string | null;
}>;

type InventoryLevelQueueRecord = Readonly<{
  aggregateKey: string;
  id?: string | null;
  quantity?: number | null;
  movementCount?: number | null;
  updatedAt?: string | null;
}>;

type QueueState = Readonly<{
  order: Readonly<{
    id: string;
    status: string;
    paymentStatus: string;
    updatedAt: string;
    [key: string]: unknown;
  }>;
  payment?: Readonly<{
    id: string;
    status: string;
    paidAt?: string | null;
    updatedAt: string;
    paymentRef?: string | null;
    provider?: string | null;
    transactionReference?: string | null;
    [key: string]: unknown;
  }> | null;
  reservations: readonly ReservationQueueRecord[];
  inventoryLevels?: readonly InventoryLevelQueueRecord[];
}>;

function timestamp(value: string, code: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(code);
  return parsed;
}

export function classifyInventoryReservationQueue(input: {
  orderStatus: string;
  reservations: readonly ReservationQueueRecord[];
  now: string;
  expiringBefore: string;
}): InventoryReservationOperatorQueue | null {
  if (
    input.orderStatus === "paid_inventory_review" &&
    input.reservations.length > 0
  ) {
    return "paid_inventory_review";
  }
  const active = input.reservations.filter(
    (reservation) => reservation.status === "active"
  );
  if (active.length === 0) return null;

  const now = timestamp(input.now, "invalid-inventory-reservation-queue-time");
  const expiringBefore = timestamp(
    input.expiringBefore,
    "invalid-inventory-reservation-queue-horizon"
  );
  if (expiringBefore < now) {
    throw new Error("invalid-inventory-reservation-queue-horizon");
  }
  const latestExpiry = Math.max(
    ...active.map((reservation) =>
      timestamp(
        reservation.expiresAt,
        "invalid-inventory-reservation-queue-expiry"
      )
    )
  );
  if (latestExpiry <= now) return "stuck";
  if (latestExpiry <= expiringBefore) return "expiring";
  return "active";
}

export function hashInventoryReservationQueueVersion(
  state: QueueState
): string {
  const reservations = state.reservations
    .map((reservation) => ({
      id: reservation.id,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      updatedAt: reservation.updatedAt,
      terminalAt: reservation.terminalAt ?? null,
      skuId: reservation.skuId ?? null,
      locationId: reservation.locationId ?? null,
      quantity: reservation.quantity ?? null,
      safetyStock: reservation.safetyStock ?? null,
      recoveryOf: reservation.recoveryOf ?? null
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const inventoryLevels = (state.inventoryLevels ?? [])
    .map((level) => ({
      aggregateKey: level.aggregateKey,
      id: level.id ?? null,
      quantity: level.quantity ?? null,
      movementCount: level.movementCount ?? null,
      updatedAt: level.updatedAt ?? null
    }))
    .sort((left, right) => left.aggregateKey.localeCompare(right.aggregateKey));
  return hashCommerceCommandInput({
    order: {
      id: state.order.id,
      status: state.order.status,
      paymentStatus: state.order.paymentStatus,
      updatedAt: state.order.updatedAt
    },
    payment: state.payment
      ? {
          id: state.payment.id,
          status: state.payment.status,
          paidAt: state.payment.paidAt ?? null,
          updatedAt: state.payment.updatedAt,
          paymentRef: state.payment.paymentRef ?? null,
          provider: state.payment.provider ?? null,
          transactionReference: state.payment.transactionReference ?? null
        }
      : null,
    reservations,
    inventoryLevels
  });
}
