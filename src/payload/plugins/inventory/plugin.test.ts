import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pluginSource = readFileSync(new URL("./plugin.ts", import.meta.url), "utf8");

describe("InventoryPlugin", () => {
  it("registers the warehouse ledger collections", () => {
    expect(pluginSource).toContain("StockLocations,");
    expect(pluginSource).toContain("InventoryLevels,");
    expect(pluginSource).toContain("InventoryMovements,");
    expect(pluginSource).toContain("InventoryReceipts,");
    expect(pluginSource).toContain("InventoryReceiptLines,");
    expect(pluginSource).toContain("InventoryLots,");
    expect(pluginSource).toContain("InventoryCycleCounts,");
    expect(pluginSource).toContain("InventoryCycleCountLines,");
    expect(pluginSource).toContain("InventoryReservations,");
    expect(pluginSource).toContain("InventoryReservationOperatorEvents,");
    expect(pluginSource).toContain("InventoryReservationEntries");
  });

  it("does not register sellable catalog or membership collections", () => {
    expect(pluginSource).not.toContain("Products,");
    expect(pluginSource).not.toContain("ProductVariants");
    expect(pluginSource).not.toContain("Plans,");
  });
});
