import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pluginSource = readFileSync(new URL("./plugin.ts", import.meta.url), "utf8");

describe("MembershipPlugin commerce registration", () => {
  it("registers both inventory reservation collections", () => {
    expect(pluginSource).toContain("InventoryReservations,");
    expect(pluginSource).toContain("InventoryReservationEntries\n");
  });
});
