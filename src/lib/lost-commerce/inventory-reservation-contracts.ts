import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "./commerce-commands";

export type InventoryReservationPolicy = {
  enabled: true;
  ttlMinutes: number;
  locationCode: string;
  safetyStock: number;
  consumePoint: "payment_confirmed";
  expiryBoundary: "at_or_after";
  paymentTimeSource: "provider_paid_at";
  latePaymentPolicy: "manual_review";
  backorderMode: "disabled";
};

export type InventoryReservationOperation =
  "reserve" | "release" | "expire" | "consume";

export type InventoryReservationStatus =
  "active" | "released" | "expired" | "consumed";

export type InventoryReservationRequest = {
  idempotencyKey: string;
  operation: InventoryReservationOperation;
  orderId: string;
  skuId: string;
  locationId: string;
  quantity: number;
  reservationId?: string;
  expiresAt?: string;
  effectiveAt: string;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;
const OPERATIONS = new Set<string>(["reserve", "release", "expire", "consume"]);

function unavailable(): never {
  throw new Error("inventory-reservations-unavailable");
}

function parsePositiveSafeInteger(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) unavailable();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) unavailable();
  return parsed;
}

function parseNonNegativeSafeInteger(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) unavailable();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) unavailable();
  return parsed;
}

function parsePolicyReference(value: unknown): string {
  if (typeof value !== "string" || !REFERENCE_PATTERN.test(value)) {
    unavailable();
  }
  return value;
}

export function parseInventoryReservationPolicy(
  source: Record<string, unknown>,
  options: { paymentProvider?: unknown }
): InventoryReservationPolicy {
  if (
    source.enabled !== "true" ||
    options.paymentProvider !== "portone" ||
    source.consumePoint !== "payment_confirmed" ||
    source.expiryBoundary !== "at_or_after" ||
    source.paymentTimeSource !== "provider_paid_at" ||
    source.latePaymentPolicy !== "manual_review" ||
    source.backorderMode !== "disabled"
  ) {
    unavailable();
  }

  return {
    enabled: true,
    ttlMinutes: parsePositiveSafeInteger(source.ttlMinutes),
    locationCode: parsePolicyReference(source.locationCode),
    safetyStock: parseNonNegativeSafeInteger(source.safetyStock),
    consumePoint: source.consumePoint,
    expiryBoundary: source.expiryBoundary,
    paymentTimeSource: source.paymentTimeSource,
    latePaymentPolicy: source.latePaymentPolicy,
    backorderMode: source.backorderMode
  };
}

function requireNonNegativeSafeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("invalid-inventory-availability");
  }
  return value;
}

export function calculateAvailableToPromise(input: {
  available: number;
  activeReserved: number;
  safetyStock: number;
}): number {
  const available = requireNonNegativeSafeInteger(input.available);
  const activeReserved = requireNonNegativeSafeInteger(input.activeReserved);
  const safetyStock = requireNonNegativeSafeInteger(input.safetyStock);
  const afterReservations = available - activeReserved;
  if (afterReservations <= 0) return 0;
  return Math.max(0, afterReservations - safetyStock);
}

function validateReference(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || !REFERENCE_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

function validateTimestamp(value: unknown, errorCode: string): string {
  if (typeof value !== "string") throw new Error(errorCode);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(errorCode);
  return new Date(timestamp).toISOString();
}

function isOperation(value: unknown): value is InventoryReservationOperation {
  return typeof value === "string" && OPERATIONS.has(value);
}

export function validateInventoryReservationRequest(
  value: unknown
): InventoryReservationRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid-inventory-reservation-request");
  }
  const request = value as Record<string, unknown>;
  if (!isOperation(request.operation)) {
    throw new Error("invalid-inventory-reservation-operation");
  }
  if (
    typeof request.quantity !== "number" ||
    !Number.isSafeInteger(request.quantity) ||
    request.quantity <= 0
  ) {
    throw new Error("invalid-inventory-reservation-quantity");
  }

  const operation = request.operation;
  const reservationId =
    request.reservationId === undefined
      ? undefined
      : validateReference(
          request.reservationId,
          "invalid-inventory-reservation-id"
        );
  if (
    (operation === "reserve" && reservationId !== undefined) ||
    (operation !== "reserve" && reservationId === undefined)
  ) {
    throw new Error("invalid-inventory-reservation-id");
  }

  const effectiveAt = validateTimestamp(
    request.effectiveAt,
    "invalid-inventory-reservation-effective-at"
  );
  let expiresAt: string | undefined;
  if (operation === "reserve") {
    expiresAt = validateTimestamp(
      request.expiresAt,
      "invalid-inventory-reservation-expiry"
    );
    if (Date.parse(expiresAt) <= Date.parse(effectiveAt)) {
      throw new Error("invalid-inventory-reservation-expiry");
    }
  } else if (request.expiresAt !== undefined) {
    throw new Error("invalid-inventory-reservation-expiry");
  }

  return {
    idempotencyKey: validateCommerceCommandKey(request.idempotencyKey),
    operation,
    orderId: validateReference(request.orderId, "invalid-inventory-order"),
    skuId: validateReference(request.skuId, "invalid-inventory-sku"),
    locationId: validateReference(
      request.locationId,
      "invalid-inventory-location"
    ),
    quantity: request.quantity,
    ...(reservationId ? { reservationId } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    effectiveAt
  };
}

export function hashInventoryReservationRequest(value: unknown): string {
  return hashCommerceCommandInput(validateInventoryReservationRequest(value));
}

export function transitionInventoryReservationStatus(
  current: InventoryReservationStatus,
  event: Exclude<InventoryReservationOperation, "reserve">
): Exclude<InventoryReservationStatus, "active"> {
  if (current !== "active") {
    throw new Error("invalid-inventory-reservation-transition");
  }
  if (event === "release") return "released";
  if (event === "expire") return "expired";
  if (event === "consume") return "consumed";
  throw new Error("invalid-inventory-reservation-transition");
}
