import { describe, expect, it } from "vitest";

import { InventoryCycleCountLines } from "./InventoryCycleCountLines";
import { InventoryCycleCounts } from "./InventoryCycleCounts";
import { InventoryLots } from "./InventoryLots";
import { InventoryReceiptLines } from "./InventoryReceiptLines";
import { InventoryReceipts } from "./InventoryReceipts";
import { authorizeInventoryLedgerRequest } from "./InventoryLevels/protectInventoryProjection";

type AccessArgs = {
  req: {
    user?: {
      id: string;
      role: string;
    } | null;
  };
};

function accessArgs(role: string | null): AccessArgs {
  return {
    req: {
      user: role ? { id: "user-id", role } : null
    }
  };
}

function namedField(
  collection: { fields: unknown[] },
  name: string
): Record<string, unknown> {
  const field = collection.fields.find((candidate) => {
    return (
      typeof candidate === "object" &&
      candidate !== null &&
      "name" in candidate &&
      (candidate as { name?: unknown }).name === name
    );
  });
  if (!field) throw new Error(`Missing field ${name}`);
  return field as Record<string, unknown>;
}

function selectOptions(field: Record<string, unknown>): string[] {
  if (!Array.isArray(field.options)) throw new Error("Expected select options");
  return field.options.map((option) => {
    if (typeof option === "string") return option;
    if (option && typeof option === "object" && "value" in option) {
      return String(option.value);
    }
    throw new Error("Invalid select option");
  });
}

const inventoryOperationCollections = [
  InventoryReceipts,
  InventoryReceiptLines,
  InventoryLots,
  InventoryCycleCounts,
  InventoryCycleCountLines
];

describe("inventory operation collection contracts", () => {
  it("keeps all operation records admin-readable and service-write-only", async () => {
    for (const collection of inventoryOperationCollections) {
      expect(
        await collection.access?.read?.(accessArgs("admin") as never)
      ).toBe(true);
      expect(
        await collection.access?.read?.(accessArgs("editor") as never)
      ).toBe(false);
      expect(await collection.access?.read?.(accessArgs(null) as never)).toBe(
        false
      );

      for (const operation of ["create", "update", "delete"] as const) {
        expect(
          await collection.access?.[operation]?.(accessArgs("admin") as never)
        ).toBe(false);
      }
    }
  });

  it("requires explicit request authorization for service writes", async () => {
    for (const collection of [InventoryReceipts, InventoryCycleCounts]) {
      const hook = collection.hooks?.beforeOperation?.[0];
      const genericRequest = {};
      const authorizedRequest = {};
      authorizeInventoryLedgerRequest(authorizedRequest);

      await expect(
        hook?.({ operation: "create", req: genericRequest } as never)
      ).rejects.toThrow("inventory-operation-write-forbidden");
      await expect(
        hook?.({ operation: "update", req: genericRequest } as never)
      ).rejects.toThrow("inventory-operation-write-forbidden");
      await expect(
        hook?.({ operation: "create", req: authorizedRequest } as never)
      ).resolves.toBeUndefined();
      await expect(
        hook?.({ operation: "update", req: authorizedRequest } as never)
      ).resolves.toBeUndefined();
      await expect(
        hook?.({ operation: "delete", req: authorizedRequest } as never)
      ).rejects.toThrow("inventory-operation-delete-forbidden");
    }
  });

  it("allows authorized line creation but keeps line evidence immutable", async () => {
    for (const collection of [
      InventoryReceiptLines,
      InventoryCycleCountLines
    ]) {
      const hook = collection.hooks?.beforeOperation?.[0];
      const genericRequest = {};
      const authorizedRequest = {};
      authorizeInventoryLedgerRequest(authorizedRequest);

      await expect(
        hook?.({ operation: "create", req: genericRequest } as never)
      ).rejects.toThrow("inventory-operation-write-forbidden");
      await expect(
        hook?.({ operation: "create", req: authorizedRequest } as never)
      ).resolves.toBeUndefined();
      await expect(
        hook?.({ operation: "update", req: authorizedRequest } as never)
      ).rejects.toThrow("inventory-operation-record-immutable");
      await expect(
        hook?.({ operation: "delete", req: authorizedRequest } as never)
      ).rejects.toThrow("inventory-operation-record-immutable");
    }
  });

  it("permits only valid receipt lifecycle transitions with write-once evidence", async () => {
    const hook = InventoryReceipts.hooks?.beforeValidate?.[0];
    const draft = {
      status: "draft",
      location: "location-1",
      supplier_name: "Supplier",
      external_reference: "REF-1"
    };

    await expect(
      hook?.({ operation: "create", data: { status: "closed" } } as never)
    ).rejects.toThrow("inventory-receipt-create-status-invalid");
    await expect(
      hook?.({
        operation: "create",
        data: {
          status: "draft",
          opened_at: "2026-07-22T00:00:00.000Z",
          opened_by: "user-1"
        }
      } as never)
    ).rejects.toThrow("inventory-receipt-create-evidence-forbidden");

    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: {
          status: "open",
          opened_at: "2026-07-22T00:00:00.000Z",
          opened_by: "user-1"
        }
      } as never)
    ).resolves.toMatchObject({ status: "open" });
    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: {
          status: "closed",
          closed_at: "2026-07-22T00:00:00.000Z",
          closed_by: "user-1"
        }
      } as never)
    ).rejects.toThrow("inventory-receipt-transition-invalid");
    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: { status: "open", opened_at: "2026-07-22T00:00:00.000Z" }
      } as never)
    ).rejects.toThrow("inventory-receipt-transition-evidence-required");
    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: { supplier_name: "Changed" }
      } as never)
    ).rejects.toThrow("inventory-receipt-supplier_name-immutable");

    const opened = {
      ...draft,
      status: "open",
      opened_at: "2026-07-22T00:00:00.000Z",
      opened_by: "user-1"
    };
    await expect(
      hook?.({
        operation: "update",
        originalDoc: opened,
        data: { opened_by: "user-2" }
      } as never)
    ).rejects.toThrow("inventory-receipt-opened_by-immutable");
    await expect(
      hook?.({
        operation: "update",
        originalDoc: {
          ...draft,
          closed_at: "2026-07-21T00:00:00.000Z",
          closed_by: "user-old"
        },
        data: {
          status: "open",
          opened_at: "2026-07-22T00:00:00.000Z",
          opened_by: "user-1"
        }
      } as never)
    ).resolves.toMatchObject({ status: "open" });
    await expect(
      hook?.({
        operation: "update",
        originalDoc: {
          ...opened,
          closed_at: "2026-07-21T00:00:00.000Z",
          closed_by: "user-old"
        },
        data: {
          status: "closed",
          closed_at: "2026-07-22T00:00:00.000Z",
          closed_by: "user-2"
        }
      } as never)
    ).rejects.toThrow("inventory-receipt-closed_at-immutable");
  });

  it("permits only valid count lifecycle transitions with write-once evidence", async () => {
    const hook = InventoryCycleCounts.hooks?.beforeValidate?.[0];
    const draft = { status: "draft", location: "location-1" };

    await expect(
      hook?.({ operation: "create", data: { status: "applied" } } as never)
    ).rejects.toThrow("inventory-cycle-count-create-status-invalid");
    await expect(
      hook?.({
        operation: "create",
        data: {
          status: "draft",
          submitted_at: "2026-07-22T00:00:00.000Z",
          submitted_by: "user-1"
        }
      } as never)
    ).rejects.toThrow("inventory-cycle-count-create-evidence-forbidden");

    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: {
          status: "submitted",
          submitted_at: "2026-07-22T00:00:00.000Z",
          submitted_by: "user-1"
        }
      } as never)
    ).resolves.toMatchObject({ status: "submitted" });
    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: {
          status: "applied",
          applied_at: "2026-07-22T00:00:00.000Z",
          applied_by: "user-1"
        }
      } as never)
    ).rejects.toThrow("inventory-cycle-count-transition-invalid");
    await expect(
      hook?.({
        operation: "update",
        originalDoc: draft,
        data: { location: "location-2" }
      } as never)
    ).rejects.toThrow("inventory-cycle-count-location-immutable");

    const submitted = {
      ...draft,
      status: "submitted",
      submitted_at: "2026-07-22T00:00:00.000Z",
      submitted_by: "user-1"
    };
    await expect(
      hook?.({
        operation: "update",
        originalDoc: submitted,
        data: {
          status: "cancelled",
          cancelled_at: "2026-07-22T01:00:00.000Z",
          cancelled_by: "user-2"
        }
      } as never)
    ).rejects.toThrow("inventory-cycle-count-transition-invalid");
    await expect(
      hook?.({
        operation: "update",
        originalDoc: submitted,
        data: {
          status: "applied",
          applied_at: "2026-07-22T01:00:00.000Z",
          applied_by: "user-2"
        }
      } as never)
    ).resolves.toMatchObject({ status: "applied" });
    await expect(
      hook?.({
        operation: "update",
        originalDoc: { ...submitted, status: "applied" },
        data: {
          status: "rejected",
          rejected_at: "2026-07-22T02:00:00.000Z",
          rejected_by: "user-2"
        }
      } as never)
    ).rejects.toThrow("inventory-cycle-count-transition-invalid");
  });

  it("defines receipt status, provenance, and transition evidence", () => {
    expect(selectOptions(namedField(InventoryReceipts, "status"))).toEqual([
      "draft",
      "open",
      "closed",
      "cancelled"
    ]);
    expect(namedField(InventoryReceipts, "status")).toMatchObject({
      required: true,
      defaultValue: "draft",
      index: true
    });
    expect(namedField(InventoryReceipts, "location")).toMatchObject({
      type: "relationship",
      relationTo: "stock-locations",
      required: true,
      index: true
    });
    for (const name of ["supplier_name", "external_reference"]) {
      expect(namedField(InventoryReceipts, name)).toMatchObject({
        type: "text"
      });
      expect(namedField(InventoryReceipts, name)).not.toHaveProperty(
        "required"
      );
    }
    for (const transition of ["opened", "closed", "cancelled"]) {
      expect(namedField(InventoryReceipts, `${transition}_at`)).toMatchObject({
        type: "date",
        index: true
      });
      expect(namedField(InventoryReceipts, `${transition}_by`)).toMatchObject({
        type: "relationship",
        relationTo: "users",
        index: true
      });
    }
  });

  it("defines unique receipt SKU lines and append-only lot evidence", () => {
    expect(namedField(InventoryReceiptLines, "receipt_sku_key")).toMatchObject({
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: expect.objectContaining({ hidden: true, readOnly: true })
    });
    expect(namedField(InventoryReceiptLines, "receipt")).toMatchObject({
      type: "relationship",
      relationTo: "inventory-receipts",
      required: true,
      index: true
    });
    expect(namedField(InventoryReceiptLines, "sku")).toMatchObject({
      type: "relationship",
      relationTo: "product-variants",
      required: true,
      index: true
    });
    expect(
      namedField(InventoryReceiptLines, "expected_quantity")
    ).toMatchObject({
      type: "number",
      min: 1
    });
    expect(
      namedField(InventoryReceiptLines, "expected_quantity")
    ).not.toHaveProperty("required");
    expect(InventoryReceiptLines.indexes).toContainEqual({
      fields: ["receipt", "sku"],
      unique: true
    });

    expect(InventoryLots.lockDocuments).toBe(false);
    expect(namedField(InventoryLots, "operation_key")).toMatchObject({
      type: "text",
      required: true,
      unique: true,
      index: true
    });
    expect(namedField(InventoryLots, "receipt_line")).toMatchObject({
      type: "relationship",
      relationTo: "inventory-receipt-lines",
      required: true,
      index: true
    });
    expect(namedField(InventoryLots, "external_lot_code")).toMatchObject({
      type: "text"
    });
    expect(namedField(InventoryLots, "received_quantity")).toMatchObject({
      type: "number",
      required: true,
      min: 1
    });
    expect(namedField(InventoryLots, "received_at")).toMatchObject({
      type: "date",
      required: true,
      index: true
    });
    expect(namedField(InventoryLots, "actor")).toMatchObject({
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true
    });

    const protectLot = InventoryLots.hooks?.beforeOperation?.[0];
    expect(protectLot).toBeTypeOf("function");
  });

  it("requires authorization to create lots and keeps them immutable", async () => {
    const protectLot = InventoryLots.hooks?.beforeOperation?.[0];
    const genericRequest = {};
    const authorizedRequest = {};
    authorizeInventoryLedgerRequest(authorizedRequest);

    await expect(
      protectLot?.({ operation: "create", req: genericRequest } as never)
    ).rejects.toThrow("inventory-operation-write-forbidden");
    await expect(
      protectLot?.({ operation: "create", req: authorizedRequest } as never)
    ).resolves.toBeUndefined();
    await expect(
      protectLot?.({ operation: "update", req: authorizedRequest } as never)
    ).rejects.toThrow("inventory-lot-immutable");
    await expect(
      protectLot?.({ operation: "delete", req: authorizedRequest } as never)
    ).rejects.toThrow("inventory-lot-immutable");
  });

  it("defines cycle-count lifecycle and immutable aggregate snapshots", () => {
    expect(selectOptions(namedField(InventoryCycleCounts, "status"))).toEqual([
      "draft",
      "submitted",
      "applied",
      "rejected",
      "cancelled"
    ]);
    expect(namedField(InventoryCycleCounts, "status")).toMatchObject({
      required: true,
      defaultValue: "draft",
      index: true
    });
    expect(namedField(InventoryCycleCounts, "location")).toMatchObject({
      type: "relationship",
      relationTo: "stock-locations",
      required: true,
      index: true
    });
    for (const transition of [
      "submitted",
      "applied",
      "rejected",
      "cancelled"
    ]) {
      expect(
        namedField(InventoryCycleCounts, `${transition}_at`)
      ).toMatchObject({
        type: "date",
        index: true
      });
      expect(
        namedField(InventoryCycleCounts, `${transition}_by`)
      ).toMatchObject({
        type: "relationship",
        relationTo: "users",
        index: true
      });
    }

    expect(
      namedField(InventoryCycleCountLines, "count_aggregate_key")
    ).toMatchObject({
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: expect.objectContaining({ hidden: true, readOnly: true })
    });
    expect(namedField(InventoryCycleCountLines, "count")).toMatchObject({
      type: "relationship",
      relationTo: "inventory-cycle-counts",
      required: true,
      index: true
    });
    expect(namedField(InventoryCycleCountLines, "sku")).toMatchObject({
      type: "relationship",
      relationTo: "product-variants",
      required: true,
      index: true
    });
    expect(
      selectOptions(namedField(InventoryCycleCountLines, "disposition"))
    ).toEqual([
      "available",
      "quarantine",
      "damaged",
      "inspection_pending",
      "returned_pending_release",
      "discarded"
    ]);
    for (const name of [
      "counted_quantity",
      "system_quantity",
      "movement_count_snapshot"
    ]) {
      expect(namedField(InventoryCycleCountLines, name)).toMatchObject({
        type: "number",
        required: true,
        min: 0
      });
    }
    expect(namedField(InventoryCycleCountLines, "variance")).toMatchObject({
      type: "number",
      required: true
    });
    expect(namedField(InventoryCycleCountLines, "variance")).not.toHaveProperty(
      "min"
    );
    expect(InventoryCycleCountLines.indexes).toContainEqual({
      fields: ["count", "sku", "disposition"],
      unique: true
    });
  });
});
