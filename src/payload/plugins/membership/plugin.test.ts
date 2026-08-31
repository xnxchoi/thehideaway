import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pluginSource = readFileSync(new URL("./plugin.ts", import.meta.url), "utf8");

describe("MembershipPlugin", () => {
  it("registers membership billing collections", () => {
    expect(pluginSource).toContain("Plans,");
    expect(pluginSource).toContain("Invoices,");
    expect(pluginSource).toContain("Prices,");
    expect(pluginSource).toContain("Subscriptions,");
    expect(pluginSource).toContain("FXRate,");
    expect(pluginSource).toContain("Currency,");
    expect(pluginSource).toContain("Holidays");
  });

  it("does not register product catalog, cart, order, or inventory collections", () => {
    expect(pluginSource).not.toContain("Products,");
    expect(pluginSource).not.toContain("ProductVariants");
    expect(pluginSource).not.toContain("ProductCarts");
    expect(pluginSource).not.toContain("ProductOrders");
    expect(pluginSource).not.toContain("ProductPayments");
    expect(pluginSource).not.toContain("ProductDrops");
    expect(pluginSource).not.toContain("ProductCategory");
    expect(pluginSource).not.toContain("ProductOrderCampaigns");
    expect(pluginSource).not.toContain("InventoryReservations");
    expect(pluginSource).not.toContain("InventoryLevels");
    expect(pluginSource).not.toContain("StockLocations");
  });
});
