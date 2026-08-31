import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("LostEcommerceProvider wiring", () => {
  it("wraps plugin EcommerceProvider with KRW, variants, and PortOne", () => {
    const source = readFileSync(new URL("./provider.tsx", import.meta.url), "utf8");
    expect(source).toContain("EcommerceProvider");
    expect(source).toContain('from "@payloadcms/plugin-ecommerce/client/react"');
    expect(source).toContain("enableVariants={true}");
    expect(source).toContain('defaultCurrency: "KRW"');
    expect(source).toContain('name: "portone"');
    expect(source).toContain("initiatePayment: true");
    expect(source).toContain("confirmOrder: true");
    expect(source).toContain("onLogin");
    expect(source).toContain("cartsFetchQuery");
    expect(source).not.toContain("stripeAdapter");
  });

  it("documents the array-item id varchar cutover", () => {
    const migration = readFileSync(
      new URL(
        "../../../../lib/migrations-baseline/20260831_063800_array_item_ids.ts",
        import.meta.url
      ),
      "utf8"
    );
    expect(migration).toContain("WHY-OVERRIDE-PAYLOAD");
    expect(migration).toContain('ALTER TABLE "carts_items" ALTER COLUMN "id" TYPE varchar');
  });

  it("keeps useLostCart as a plugin useCart adapter that returns the add promise", () => {
    const adapter = readFileSync(
      new URL("../../../../lib/lost-commerce/useLostCart.tsx", import.meta.url),
      "utf8"
    );
    expect(adapter).toContain('from "@payloadcms/plugin-ecommerce/client/react"');
    expect(adapter).toContain("useCart");
    expect(adapter).toContain("mapPluginCartLines");
    expect(adapter).toContain("pluginCartAddItem");
    expect(adapter).toContain("addItem(pluginCartAddItem(line) as never, line.quantity)");
    expect(adapter).not.toContain("lostinseoul.cart.v2");
    expect(adapter).not.toContain("/api/lost/cart");
  });

  it("is mounted from the LOSTINSEOUL layout", () => {
    const layout = readFileSync(
      new URL(
        "../../../../app/(frontend)/(site)/lostinseoul/layout.tsx",
        import.meta.url
      ),
      "utf8"
    );
    expect(layout).toContain("LostEcommerceProvider");
  });
});
