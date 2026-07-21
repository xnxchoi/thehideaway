import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "./commerce-commands";

export const INVENTORY_DISPOSITIONS = [
  "available",
  "quarantine",
  "damaged",
  "inspection_pending",
  "returned_pending_release",
  "discarded"
] as const;

export type InventoryDisposition = (typeof INVENTORY_DISPOSITIONS)[number];
export type InventoryMovementKind = "inbound" | "outbound" | "transfer";

export type InventoryMovementEndpoint = {
  locationId: string;
  disposition: InventoryDisposition;
};

export type InventoryMovementRequest = {
  idempotencyKey: string;
  skuId: string;
  kind: InventoryMovementKind;
  quantity: number;
  from?: InventoryMovementEndpoint;
  to?: InventoryMovementEndpoint;
  reasonCode: string;
  sourceType: "inventory_command";
  sourceRef?: string;
  actorId?: string;
  effectiveAt?: string;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;
const DISPOSITIONS = new Set<string>(INVENTORY_DISPOSITIONS);
const MOVEMENT_KINDS = new Set<string>(["inbound", "outbound", "transfer"]);

function validateReference(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || !REFERENCE_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

function validateOptionalReference(
  value: unknown,
  errorCode: string
): string | undefined {
  return value === undefined ? undefined : validateReference(value, errorCode);
}

function validateEndpoint(
  value: unknown,
  errorCode = "invalid-inventory-movement-endpoints"
): InventoryMovementEndpoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(errorCode);
  }
  const endpoint = value as Record<string, unknown>;
  if (!DISPOSITIONS.has(String(endpoint.disposition))) {
    throw new Error("invalid-inventory-disposition");
  }
  return {
    locationId: validateReference(
      endpoint.locationId,
      "invalid-inventory-location"
    ),
    disposition: endpoint.disposition as InventoryDisposition
  };
}

function validateEffectiveAt(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error("invalid-inventory-effective-at");
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    throw new Error("invalid-inventory-effective-at");
  }
  return new Date(time).toISOString();
}

export function inventoryAggregateKey(input: {
  skuId: string;
  locationId: string;
  disposition: InventoryDisposition;
}): string {
  return `${input.skuId}:${input.locationId}:${input.disposition}`;
}

export function validateInventoryMovementRequest(
  value: unknown
): InventoryMovementRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid-inventory-movement-request");
  }
  const request = value as Record<string, unknown>;
  if (!MOVEMENT_KINDS.has(String(request.kind))) {
    throw new Error("invalid-inventory-movement-kind");
  }
  if (
    !Number.isSafeInteger(request.quantity) ||
    (request.quantity as number) <= 0
  ) {
    throw new Error("invalid-inventory-movement-quantity");
  }
  if (request.sourceType !== "inventory_command") {
    throw new Error("invalid-inventory-source-type");
  }

  const kind = request.kind as InventoryMovementKind;
  const hasFrom = request.from !== undefined;
  const hasTo = request.to !== undefined;
  if (
    (kind === "inbound" && (hasFrom || !hasTo)) ||
    (kind === "outbound" && (!hasFrom || hasTo)) ||
    (kind === "transfer" && (!hasFrom || !hasTo))
  ) {
    throw new Error("invalid-inventory-movement-endpoints");
  }

  const from = hasFrom ? validateEndpoint(request.from) : undefined;
  const to = hasTo ? validateEndpoint(request.to) : undefined;
  if (
    kind === "transfer" &&
    from?.locationId === to?.locationId &&
    from.disposition === to.disposition
  ) {
    throw new Error("inventory-transfer-endpoints-match");
  }

  const sourceRef = validateOptionalReference(
    request.sourceRef,
    "invalid-inventory-source-ref"
  );
  const actorId = validateOptionalReference(
    request.actorId,
    "invalid-inventory-actor"
  );
  const effectiveAt = validateEffectiveAt(request.effectiveAt);

  return {
    idempotencyKey: validateCommerceCommandKey(request.idempotencyKey),
    skuId: validateReference(request.skuId, "invalid-inventory-sku"),
    kind,
    quantity: request.quantity as number,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    reasonCode: validateReference(
      request.reasonCode,
      "invalid-inventory-reason-code"
    ),
    sourceType: "inventory_command",
    ...(sourceRef ? { sourceRef } : {}),
    ...(actorId ? { actorId } : {}),
    ...(effectiveAt ? { effectiveAt } : {})
  };
}

export function hashInventoryMovementRequest(value: unknown): string {
  return hashCommerceCommandInput(validateInventoryMovementRequest(value));
}
