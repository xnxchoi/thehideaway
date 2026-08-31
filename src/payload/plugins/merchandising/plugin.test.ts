import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pluginSource = readFileSync(new URL("./plugin.ts", import.meta.url), "utf8");

describe("MerchandisingPlugin", () => {
  it("registers drops and taxonomy that do not depend on the products collection", () => {
    expect(pluginSource).toContain("ProductCategory,");
    expect(pluginSource).toContain("ProductSubCategory,");
    expect(pluginSource).toContain("ProductDrops");
  });

  it("does not register plugin-owned catalog, cart, or order collections", () => {
    expect(pluginSource).not.toContain("Products,");
    expect(pluginSource).not.toContain("ProductOrders");
    expect(pluginSource).not.toContain("ProductOrderCampaigns");
  });
});
