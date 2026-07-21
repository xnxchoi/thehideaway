import type { CollectionBeforeValidateHook } from "payload";

const allowedTransitions: Record<string, readonly string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["applied", "rejected"],
  applied: [],
  rejected: [],
  cancelled: []
};

const transitionEvidenceFields = [
  "submitted_at",
  "submitted_by",
  "applied_at",
  "applied_by",
  "rejected_at",
  "rejected_by",
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

export const protectInventoryCycleCountUpdate: CollectionBeforeValidateHook =
  async ({ data, operation, originalDoc }) => {
    if (!data) return data;
    if (operation === "create") {
      if (data.status !== undefined && data.status !== "draft") {
        throw new Error("inventory-cycle-count-create-status-invalid");
      }
      if (
        transitionEvidenceFields.some(
          (field) => data[field] !== undefined && data[field] !== null
        )
      ) {
        throw new Error("inventory-cycle-count-create-evidence-forbidden");
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
        throw new Error("inventory-cycle-count-transition-invalid");
      }

      const transitionAt = `${nextStatus}_at`;
      const transitionBy = `${nextStatus}_by`;
      if (
        originalDoc[transitionAt] !== undefined &&
        originalDoc[transitionAt] !== null
      ) {
        throw new Error(`inventory-cycle-count-${transitionAt}-immutable`);
      }
      if (
        relationshipId(originalDoc[transitionBy]) !== undefined &&
        relationshipId(originalDoc[transitionBy]) !== null
      ) {
        throw new Error(`inventory-cycle-count-${transitionBy}-immutable`);
      }
      if (!data[transitionAt] || !relationshipId(data[transitionBy])) {
        throw new Error("inventory-cycle-count-transition-evidence-required");
      }
      allowedChangedFields.add("status");
      allowedChangedFields.add(transitionAt);
      allowedChangedFields.add(transitionBy);
    }

    for (const field of Object.keys(data)) {
      if (field === "updatedAt" || !changed(data, originalDoc, field)) continue;
      if (allowedChangedFields.has(field)) continue;
      throw new Error(`inventory-cycle-count-${field}-immutable`);
    }

    return data;
  };
