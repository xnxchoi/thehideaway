import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook
} from "payload";

import { isInventoryReservationRequestAuthorized } from "./authorizeInventoryReservation";

const IMMUTABLE_FIELDS = [
  "reservation_key",
  "request_hash",
  "order",
  "sku",
  "location",
  "quantity",
  "expires_at",
  "reserved_at",
  "policy_version",
  "ttl_minutes",
  "safety_stock",
  "consume_point",
  "expiry_boundary",
  "payment_time_source",
  "late_payment_policy",
  "backorder_mode",
  "recovery_of"
] as const;

function relationshipId(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id;
  }
  return value;
}

export const protectInventoryReservation: CollectionBeforeOperationHook =
  async ({ operation, req }) => {
    if (operation === "delete" || operation === "deleteByID") {
      throw new Error("inventory-reservation-delete-forbidden");
    }
    if (
      (operation === "create" ||
        operation === "update" ||
        operation === "updateByID") &&
      !isInventoryReservationRequestAuthorized(req)
    ) {
      throw new Error("inventory-reservation-write-forbidden");
    }
  };

export const protectInventoryReservationIdentity: CollectionBeforeValidateHook =
  async ({ data, operation, originalDoc }) => {
    if (operation !== "update" || !data || !originalDoc) return data;
    for (const field of IMMUTABLE_FIELDS) {
      if (
        data[field] !== undefined &&
        relationshipId(data[field]) !== relationshipId(originalDoc[field])
      ) {
        throw new Error(`inventory-reservation-${field}-immutable`);
      }
    }
    return data;
  };
