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

export const INVENTORY_MOVEMENT_SOURCE_TYPES = [
  "inventory_command",
  "inventory_receipt",
  "inventory_lot_release",
  "inventory_adjustment",
  "inventory_cycle_count",
  "inventory_reservation"
] as const;

export type InventoryMovementSourceType =
  (typeof INVENTORY_MOVEMENT_SOURCE_TYPES)[number];

export type InventoryMovementEndpoint = {
  locationId: string;
  disposition: InventoryDisposition;
};

export type InventoryAdjustmentTransition =
  | {
      kind: "outbound";
      from: InventoryMovementEndpoint;
      to?: never;
    }
  | {
      kind: "transfer";
      from: InventoryMovementEndpoint;
      to: InventoryMovementEndpoint;
    };

export type InventoryMovementRequest = {
  idempotencyKey: string;
  skuId: string;
  kind: InventoryMovementKind;
  quantity: number;
  from?: InventoryMovementEndpoint;
  to?: InventoryMovementEndpoint;
  reasonCode: string;
  sourceType: InventoryMovementSourceType;
  sourceRef?: string;
  receiptId?: string;
  receiptLineId?: string;
  lotId?: string;
  cycleCountId?: string;
  cycleCountLineId?: string;
  actorId?: string;
  effectiveAt?: string;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;
const DISPOSITIONS = new Set<string>(INVENTORY_DISPOSITIONS);
const MOVEMENT_KINDS = new Set<string>(["inbound", "outbound", "transfer"]);
const SOURCE_TYPES = new Set<string>(INVENTORY_MOVEMENT_SOURCE_TYPES);

function isInventoryDisposition(value: unknown): value is InventoryDisposition {
  return typeof value === "string" && DISPOSITIONS.has(value);
}

function isInventoryMovementKind(
  value: unknown
): value is InventoryMovementKind {
  return typeof value === "string" && MOVEMENT_KINDS.has(value);
}

function isInventoryMovementSourceType(
  value: unknown
): value is InventoryMovementSourceType {
  return typeof value === "string" && SOURCE_TYPES.has(value);
}

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
  if (!isInventoryDisposition(endpoint.disposition)) {
    throw new Error("invalid-inventory-disposition");
  }
  return {
    locationId: validateReference(
      endpoint.locationId,
      "invalid-inventory-location"
    ),
    disposition: endpoint.disposition
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

function validateProvenance(
  request: Record<string, unknown>,
  sourceType: InventoryMovementSourceType
): Pick<
  InventoryMovementRequest,
  "receiptId" | "receiptLineId" | "lotId" | "cycleCountId" | "cycleCountLineId"
> {
  const receiptId = validateOptionalReference(
    request.receiptId,
    "invalid-inventory-provenance"
  );
  const receiptLineId = validateOptionalReference(
    request.receiptLineId,
    "invalid-inventory-provenance"
  );
  const lotId = validateOptionalReference(
    request.lotId,
    "invalid-inventory-provenance"
  );
  const cycleCountId = validateOptionalReference(
    request.cycleCountId,
    "invalid-inventory-provenance"
  );
  const cycleCountLineId = validateOptionalReference(
    request.cycleCountLineId,
    "invalid-inventory-provenance"
  );

  const hasReceiptProvenance = Boolean(receiptId || receiptLineId || lotId);
  const hasCountProvenance = Boolean(cycleCountId || cycleCountLineId);
  const requiresReceiptProvenance =
    sourceType === "inventory_receipt" ||
    sourceType === "inventory_lot_release";
  const requiresCountProvenance = sourceType === "inventory_cycle_count";

  if (
    (requiresReceiptProvenance &&
      (!receiptId || !receiptLineId || !lotId || hasCountProvenance)) ||
    (requiresCountProvenance &&
      (!cycleCountId || !cycleCountLineId || hasReceiptProvenance)) ||
    (!requiresReceiptProvenance &&
      !requiresCountProvenance &&
      (hasReceiptProvenance || hasCountProvenance))
  ) {
    throw new Error("invalid-inventory-provenance");
  }

  return {
    ...(receiptId ? { receiptId } : {}),
    ...(receiptLineId ? { receiptLineId } : {}),
    ...(lotId ? { lotId } : {}),
    ...(cycleCountId ? { cycleCountId } : {}),
    ...(cycleCountLineId ? { cycleCountLineId } : {})
  };
}

function validateSourceSemantics(input: {
  sourceType: InventoryMovementSourceType;
  kind: InventoryMovementKind;
  from?: InventoryMovementEndpoint;
  to?: InventoryMovementEndpoint;
}): void {
  if (input.sourceType === "inventory_command" && input.kind === "inbound") {
    throw new Error("inventory-inbound-requires-workflow");
  }
  if (
    input.sourceType !== "inventory_lot_release" &&
    input.kind === "transfer" &&
    input.from?.disposition === "quarantine" &&
    input.to?.disposition === "available"
  ) {
    throw new Error("inventory-lot-release-workflow-required");
  }
  const invalidAdjustment =
    input.sourceType === "inventory_adjustment" && input.kind === "inbound";
  const invalidReceipt =
    input.sourceType === "inventory_receipt" &&
    (input.kind !== "inbound" || input.to?.disposition !== "quarantine");
  const invalidRelease =
    input.sourceType === "inventory_lot_release" &&
    (input.kind !== "transfer" ||
      input.from?.locationId !== input.to?.locationId ||
      input.from?.disposition !== "quarantine" ||
      input.to?.disposition !== "available");
  const invalidCount =
    input.sourceType === "inventory_cycle_count" && input.kind === "transfer";
  const invalidReservation =
    input.sourceType === "inventory_reservation" &&
    (input.kind !== "outbound" || input.from?.disposition !== "available");
  if (
    invalidAdjustment ||
    invalidReceipt ||
    invalidRelease ||
    invalidCount ||
    invalidReservation
  ) {
    throw new Error("invalid-inventory-source-semantics");
  }
  if (input.sourceType === "inventory_adjustment") {
    validateInventoryAdjustmentTransition(
      input.kind === "outbound"
        ? { kind: "outbound", from: input.from! }
        : { kind: "transfer", from: input.from!, to: input.to! }
    );
  }
}

export function validateInventoryAdjustmentTransition(
  transition: InventoryAdjustmentTransition
): void {
  if (transition.kind === "outbound") return;
  if (
    transition.from.locationId === transition.to.locationId &&
    transition.from.disposition === transition.to.disposition
  ) {
    throw new Error("inventory-transfer-endpoints-match");
  }
  if (
    transition.from.disposition === "quarantine" &&
    transition.to.disposition === "available"
  ) {
    throw new Error("inventory-lot-release-workflow-required");
  }
}

function resolveSourceRef(
  request: Record<string, unknown>,
  sourceType: InventoryMovementSourceType,
  provenance: ReturnType<typeof validateProvenance>
): string | undefined {
  const supplied = validateOptionalReference(
    request.sourceRef,
    "invalid-inventory-source-ref"
  );
  if (sourceType === "inventory_reservation" && !supplied) {
    throw new Error("invalid-inventory-source-ref");
  }
  const required =
    sourceType === "inventory_receipt" || sourceType === "inventory_lot_release"
      ? provenance.lotId
      : sourceType === "inventory_cycle_count"
        ? provenance.cycleCountLineId
        : undefined;
  if (required && supplied && supplied !== required) {
    throw new Error("invalid-inventory-source-ref");
  }
  return required ?? supplied;
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
  if (!isInventoryMovementKind(request.kind)) {
    throw new Error("invalid-inventory-movement-kind");
  }
  if (
    typeof request.quantity !== "number" ||
    !Number.isSafeInteger(request.quantity) ||
    request.quantity <= 0
  ) {
    throw new Error("invalid-inventory-movement-quantity");
  }
  if (!isInventoryMovementSourceType(request.sourceType)) {
    throw new Error("invalid-inventory-source-type");
  }
  const sourceType = request.sourceType;
  const provenance = validateProvenance(request, sourceType);

  const kind = request.kind;
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
    sourceType !== "inventory_adjustment" &&
    from !== undefined &&
    to !== undefined &&
    from.locationId === to.locationId &&
    from.disposition === to.disposition
  ) {
    throw new Error("inventory-transfer-endpoints-match");
  }
  validateSourceSemantics({ sourceType, kind, from, to });

  const sourceRef = resolveSourceRef(request, sourceType, provenance);
  const actorId = validateOptionalReference(
    request.actorId,
    "invalid-inventory-actor"
  );
  const effectiveAt = validateEffectiveAt(request.effectiveAt);

  return {
    idempotencyKey: validateCommerceCommandKey(request.idempotencyKey),
    skuId: validateReference(request.skuId, "invalid-inventory-sku"),
    kind,
    quantity: request.quantity,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    reasonCode: validateReference(
      request.reasonCode,
      "invalid-inventory-reason-code"
    ),
    sourceType,
    ...(sourceRef ? { sourceRef } : {}),
    ...provenance,
    ...(actorId ? { actorId } : {}),
    ...(effectiveAt ? { effectiveAt } : {})
  };
}

export function hashInventoryMovementRequest(value: unknown): string {
  return hashCommerceCommandInput(validateInventoryMovementRequest(value));
}
