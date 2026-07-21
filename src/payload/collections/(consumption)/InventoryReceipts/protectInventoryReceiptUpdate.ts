import type { CollectionBeforeValidateHook } from "payload";

const allowedTransitions: Record<string, readonly string[]> = {
  draft: ["open", "cancelled"],
  open: ["closed", "cancelled"],
  closed: [],
  cancelled: []
};

const transitionEvidencePrefix: Record<string, string> = {
  open: "opened",
  closed: "closed",
  cancelled: "cancelled"
};

const transitionEvidenceFields = [
  "opened_at",
  "opened_by",
  "closed_at",
  "closed_by",
  "cancelled_at",
  "cancelled_by"
] as const;

function relationshipId(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id;
  }
  return value;
}

function changed(
  data: Record<string, unknown>,
  original: Record<string, unknown>,
  field: string
) {
  return relationshipId(data[field]) !== relationshipId(original[field]);
}

export const protectInventoryReceiptUpdate: CollectionBeforeValidateHook =
  async ({ data, operation, originalDoc }) => {
    if (!data) return data;
    if (operation === "create") {
      if (data.status !== undefined && data.status !== "draft") {
        throw new Error("inventory-receipt-create-status-invalid");
      }
      if (
        transitionEvidenceFields.some(
          (field) => data[field] !== undefined && data[field] !== null
        )
      ) {
        throw new Error("inventory-receipt-create-evidence-forbidden");
      }
      return data;
    }
    if (operation !== "update" || !originalDoc) return data;

    const currentStatus = String(originalDoc.status);
    const nextStatus =
      data.status === undefined ? currentStatus : String(data.status);
    const statusChanged = nextStatus !== currentStatus;
    const allowedChangedFields = new Set<string>();

    if (statusChanged) {
      if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
        throw new Error("inventory-receipt-transition-invalid");
      }

      const evidencePrefix = transitionEvidencePrefix[nextStatus];
      const transitionAt = `${evidencePrefix}_at`;
      const transitionBy = `${evidencePrefix}_by`;
      if (
        originalDoc[transitionAt] !== undefined &&
        originalDoc[transitionAt] !== null
      ) {
        throw new Error(`inventory-receipt-${transitionAt}-immutable`);
      }
      if (
        relationshipId(originalDoc[transitionBy]) !== undefined &&
        relationshipId(originalDoc[transitionBy]) !== null
      ) {
        throw new Error(`inventory-receipt-${transitionBy}-immutable`);
      }
      if (!data[transitionAt] || !relationshipId(data[transitionBy])) {
        throw new Error("inventory-receipt-transition-evidence-required");
      }
      allowedChangedFields.add("status");
      allowedChangedFields.add(transitionAt);
      allowedChangedFields.add(transitionBy);
    }

    for (const field of Object.keys(data)) {
      if (field === "updatedAt" || !changed(data, originalDoc, field)) continue;
      if (allowedChangedFields.has(field)) continue;
      throw new Error(`inventory-receipt-${field}-immutable`);
    }

    return data;
  };
