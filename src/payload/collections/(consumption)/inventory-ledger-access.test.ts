import { describe, expect, it } from "vitest";

import { InventoryLevels } from "./InventoryLevels";
import {
  authorizeInventoryLedgerRequest,
  isInventoryLedgerRequestAuthorized
} from "./InventoryLevels/protectInventoryProjection";
import { InventoryMovements } from "./InventoryMovements";
import { StockLocations } from "./StockLocations";

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
  const options = field.options;
  if (!Array.isArray(options)) throw new Error("Expected select options");
  return options.map((option) => {
    if (typeof option === "string") return option;
    if (option && typeof option === "object" && "value" in option) {
      return String(option.value);
    }
    throw new Error("Invalid select option");
  });
}

describe("inventory ledger collection contracts", () => {
  it("allows only admins to manage stock locations and never exposes delete", async () => {
    for (const operation of ["read", "create", "update"] as const) {
      expect(
        await StockLocations.access?.[operation]?.(accessArgs("admin") as never)
      ).toBe(true);
      expect(
        await StockLocations.access?.[operation]?.(
          accessArgs("editor") as never
        )
      ).toBe(false);
      expect(
        await StockLocations.access?.[operation]?.(accessArgs(null) as never)
      ).toBe(false);
    }

    expect(
      await StockLocations.access?.delete?.(accessArgs("admin") as never)
    ).toBe(false);
  });

  it("normalizes location identity while keeping its code immutable", async () => {
    const hook = StockLocations.hooks?.beforeValidate?.[0];
    expect(hook).toBeTypeOf("function");

    const created = await hook?.({
      operation: "create",
      data: { code: "  seoul-01  ", name: "  Seoul studio  " }
    } as never);
    expect(created).toMatchObject({
      code: "SEOUL-01",
      name: "Seoul studio"
    });

    await expect(
      hook?.({
        operation: "update",
        data: { code: "busan-01" },
        originalDoc: { code: "SEOUL-01", name: "Seoul studio" }
      } as never)
    ).rejects.toThrow("stock-location-code-immutable");

    const code = namedField(StockLocations, "code");
    const codeAccess = code.access as
      { update?: (args: AccessArgs) => boolean } | undefined;
    expect(code.required).toBe(true);
    expect(code.unique).toBe(true);
    expect(code.index).toBe(true);
    expect(codeAccess?.update?.(accessArgs("admin"))).toBe(false);
    expect(code.admin).not.toMatchObject({ readOnly: true });

    const active = namedField(StockLocations, "active");
    expect(active.required).toBe(true);
    expect(active.defaultValue).toBe(false);
    expect(active.index).toBe(true);
  });

  it("keeps inventory levels admin-readable but service-write-only", async () => {
    expect(
      await InventoryLevels.access?.read?.(accessArgs("admin") as never)
    ).toBe(true);
    expect(
      await InventoryLevels.access?.read?.(accessArgs("editor") as never)
    ).toBe(false);

    for (const operation of ["create", "update", "delete"] as const) {
      expect(
        await InventoryLevels.access?.[operation]?.(
          accessArgs("admin") as never
        )
      ).toBe(false);
    }
  });

  it("defines immutable aggregate identity and nonnegative projections", () => {
    const aggregateKey = namedField(InventoryLevels, "aggregate_key");
    expect(aggregateKey).toMatchObject({
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: expect.objectContaining({ hidden: true, readOnly: true })
    });

    for (const [name, relationTo] of [
      ["sku", "product-variants"],
      ["location", "stock-locations"]
    ] as const) {
      const field = namedField(InventoryLevels, name);
      expect(field).toMatchObject({
        type: "relationship",
        relationTo,
        required: true,
        index: true,
        admin: expect.objectContaining({ readOnly: true })
      });
    }

    const disposition = namedField(InventoryLevels, "disposition");
    expect(disposition).toMatchObject({
      type: "select",
      required: true,
      index: true,
      admin: expect.objectContaining({ readOnly: true })
    });
    expect(disposition).not.toHaveProperty("defaultValue");
    expect(selectOptions(disposition)).toEqual([
      "available",
      "quarantine",
      "damaged",
      "inspection_pending",
      "returned_pending_release",
      "discarded"
    ]);

    for (const name of ["quantity", "movement_count"]) {
      expect(namedField(InventoryLevels, name)).toMatchObject({
        type: "number",
        required: true,
        defaultValue: 0,
        min: 0
      });
    }

    expect(InventoryLevels.indexes).toContainEqual({
      fields: ["sku", "location", "disposition"],
      unique: true
    });
  });

  it("authorizes projection writes only for explicitly scoped requests", async () => {
    const request = {};
    const otherRequest = {};
    expect(isInventoryLedgerRequestAuthorized(request)).toBe(false);
    expect(() => authorizeInventoryLedgerRequest(null as never)).toThrow(
      "inventory-ledger-request-required"
    );

    authorizeInventoryLedgerRequest(request);
    expect(isInventoryLedgerRequestAuthorized(request)).toBe(true);
    expect(isInventoryLedgerRequestAuthorized(otherRequest)).toBe(false);

    const hook = InventoryLevels.hooks?.beforeOperation?.[0];
    await expect(
      hook?.({ operation: "create", req: otherRequest } as never)
    ).rejects.toThrow("inventory-projection-write-forbidden");
    await expect(
      hook?.({ operation: "update", req: request } as never)
    ).resolves.toBeUndefined();
    await expect(
      hook?.({ operation: "delete", req: request } as never)
    ).rejects.toThrow("inventory-projection-delete-forbidden");
  });

  it("keeps projection aggregate identity immutable after creation", async () => {
    const hook = InventoryLevels.hooks?.beforeValidate?.[0];
    const originalDoc = {
      aggregate_key: "sku-1:location-1:available",
      sku: "sku-1",
      location: "location-1",
      disposition: "available",
      quantity: 2,
      movement_count: 1
    };

    await expect(
      hook?.({
        operation: "update",
        data: { quantity: 3, movement_count: 2 },
        originalDoc
      } as never)
    ).resolves.toMatchObject({ quantity: 3, movement_count: 2 });

    for (const [field, value] of [
      ["aggregate_key", "different-key"],
      ["sku", "sku-2"],
      ["location", "location-2"],
      ["disposition", "damaged"]
    ]) {
      await expect(
        hook?.({
          operation: "update",
          data: { [field]: value },
          originalDoc
        } as never)
      ).rejects.toThrow(`inventory-projection-${field}-immutable`);
    }
  });

  it("keeps movement creation service-only and updates/deletes forbidden even when scoped", async () => {
    expect(InventoryMovements.lockDocuments).toBe(false);
    expect(
      await InventoryMovements.access?.read?.(accessArgs("admin") as never)
    ).toBe(true);

    for (const operation of ["create", "update", "delete"] as const) {
      expect(
        await InventoryMovements.access?.[operation]?.(
          accessArgs("admin") as never
        )
      ).toBe(false);
    }

    const hook = InventoryMovements.hooks?.beforeOperation?.[0];
    const genericRequest = {};
    await expect(
      hook?.({ operation: "create", req: genericRequest } as never)
    ).rejects.toThrow("inventory-movement-create-forbidden");

    authorizeInventoryLedgerRequest(genericRequest);
    await expect(
      hook?.({ operation: "create", req: genericRequest } as never)
    ).resolves.toBeUndefined();
    await expect(
      hook?.({ operation: "update", req: genericRequest } as never)
    ).rejects.toThrow("inventory-movement-immutable");
    await expect(
      hook?.({ operation: "delete", req: genericRequest } as never)
    ).rejects.toThrow("inventory-movement-immutable");
  });

  it("defines one dual-endpoint movement without signed legs or opening-balance semantics", () => {
    const expectedFields = [
      "idempotency_key",
      "request_hash",
      "sku",
      "kind",
      "quantity",
      "from_location",
      "from_disposition",
      "to_location",
      "to_disposition",
      "reason_code",
      "source_type",
      "source_ref",
      "receipt",
      "receipt_line",
      "lot",
      "cycle_count",
      "cycle_count_line",
      "actor",
      "effective_at"
    ];
    const names = InventoryMovements.fields.flatMap((field) =>
      "name" in field ? [field.name] : []
    );
    expect(names).toEqual(expectedFields);
    expect(names).not.toContain("signed_quantity");
    expect(names).not.toContain("opening_balance");

    expect(namedField(InventoryMovements, "idempotency_key")).toMatchObject({
      type: "text",
      required: true,
      unique: true,
      index: true
    });
    expect(namedField(InventoryMovements, "request_hash")).toMatchObject({
      type: "text",
      required: true
    });
    expect(namedField(InventoryMovements, "sku")).toMatchObject({
      type: "relationship",
      relationTo: "product-variants",
      required: true
    });
    expect(selectOptions(namedField(InventoryMovements, "kind"))).toEqual([
      "inbound",
      "outbound",
      "transfer"
    ]);
    expect(namedField(InventoryMovements, "quantity")).toMatchObject({
      type: "number",
      required: true,
      min: 1
    });

    for (const name of ["from_location", "to_location"]) {
      expect(namedField(InventoryMovements, name)).toMatchObject({
        type: "relationship",
        relationTo: "stock-locations"
      });
    }
    for (const name of ["from_disposition", "to_disposition"]) {
      expect(selectOptions(namedField(InventoryMovements, name))).toEqual([
        "available",
        "quarantine",
        "damaged",
        "inspection_pending",
        "returned_pending_release",
        "discarded"
      ]);
    }

    expect(namedField(InventoryMovements, "reason_code")).toMatchObject({
      type: "text",
      required: true
    });
    const sourceType = namedField(InventoryMovements, "source_type");
    expect(sourceType).toMatchObject({ type: "select", required: true });
    expect(selectOptions(sourceType)).toEqual([
      "inventory_command",
      "inventory_receipt",
      "inventory_lot_release",
      "inventory_adjustment",
      "inventory_cycle_count"
    ]);
    expect(namedField(InventoryMovements, "source_ref")).toMatchObject({
      type: "text"
    });
    for (const [name, relationTo] of [
      ["receipt", "inventory-receipts"],
      ["receipt_line", "inventory-receipt-lines"],
      ["lot", "inventory-lots"],
      ["cycle_count", "inventory-cycle-counts"],
      ["cycle_count_line", "inventory-cycle-count-lines"]
    ] as const) {
      expect(namedField(InventoryMovements, name)).toMatchObject({
        type: "relationship",
        relationTo,
        index: true,
        admin: expect.objectContaining({ readOnly: true })
      });
    }
    expect(namedField(InventoryMovements, "actor")).toMatchObject({
      type: "text"
    });
    expect(namedField(InventoryMovements, "effective_at")).toMatchObject({
      type: "date"
    });

    for (const name of [
      "sku",
      "kind",
      "from_location",
      "from_disposition",
      "to_location",
      "to_disposition"
    ]) {
      expect(namedField(InventoryMovements, name).index).toBe(true);
    }
  });
});
