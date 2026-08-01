import type { PayloadRequest } from "payload";

import {
  DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE,
  MAX_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE
} from "./inventory-reservation-expiry";

export const INVENTORY_RESERVATION_OPERATOR_ACTIONS = [
  "release",
  "expire",
  "reconcile",
  "run_expiry"
] as const;

export type InventoryReservationOperatorAction =
  (typeof INVENTORY_RESERVATION_OPERATOR_ACTIONS)[number];

export type InventoryReservationOperatorCommand = Readonly<{
  action: InventoryReservationOperatorAction;
  orderId?: string;
  expectedStateHash: string;
  reasonCode: string;
  evidenceReference: string;
  batchSize?: number;
}>;

const ACTIONS = new Set<string>(INVENTORY_RESERVATION_OPERATOR_ACTIONS);
const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]+$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

function reference(value: unknown, code: string, maxLength: number): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > maxLength ||
    !REFERENCE_PATTERN.test(value)
  ) {
    throw new Error(code);
  }
  return value;
}

function stateHash(value: unknown): string {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    throw new Error("invalid-inventory-reservation-operator-state-hash");
  }
  return value;
}

function batchSize(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE;
  }
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > MAX_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE
  ) {
    throw new Error("invalid-inventory-reservation-expiry-batch-size");
  }
  return value;
}

export function requireInventoryReservationOperator(
  req: Pick<PayloadRequest, "user">
): string {
  const user = req.user as { id?: unknown; role?: unknown } | null | undefined;
  if (user?.role !== "admin" || typeof user.id !== "string" || !user.id) {
    throw new Error("inventory-reservation-operator-admin-required");
  }
  return reference(
    user.id,
    "inventory-reservation-operator-admin-required",
    200
  );
}

export function inventoryReservationOperatorMutationsEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE === "true";
}

export function validateInventoryReservationOperatorCommand(
  value: unknown
): InventoryReservationOperatorCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid-inventory-reservation-operator-command");
  }
  const input = value as Record<string, unknown>;
  if (typeof input.action !== "string" || !ACTIONS.has(input.action)) {
    throw new Error("invalid-inventory-reservation-operator-action");
  }
  const action = input.action as InventoryReservationOperatorAction;
  const orderId =
    action === "run_expiry"
      ? input.orderId === undefined
        ? undefined
        : reference(
            input.orderId,
            "invalid-inventory-reservation-operator-order",
            200
          )
      : reference(
          input.orderId,
          "invalid-inventory-reservation-operator-order",
          200
        );
  const normalized = {
    action,
    ...(orderId ? { orderId } : {}),
    expectedStateHash: stateHash(input.expectedStateHash),
    reasonCode: reference(
      input.reasonCode,
      "invalid-inventory-reservation-operator-reason",
      100
    ),
    evidenceReference: reference(
      input.evidenceReference,
      "invalid-inventory-reservation-operator-evidence",
      200
    ),
    ...(action === "run_expiry"
      ? { batchSize: batchSize(input.batchSize) }
      : {})
  };
  return Object.freeze(normalized);
}
