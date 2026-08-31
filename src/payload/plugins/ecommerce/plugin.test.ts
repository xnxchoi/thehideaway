import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pluginSource = readFileSync(new URL("./plugin.ts", import.meta.url), "utf8");

describe("hideaway ecommerce plugin config", () => {
  it("disables plugin inventory tracking", () => {
    expect(pluginSource).toContain("inventory: false");
  });

  it("uses users as customers and KRW as the default currency", () => {
    expect(pluginSource).toContain('slug: "users"');
    expect(pluginSource).toContain('defaultCurrency: "KRW"');
  });

  it("overrides products and variants and registers purchase validation", () => {
    expect(pluginSource).toContain("productsCollectionOverride");
    expect(pluginSource).toContain("variantsCollectionOverride");
    expect(pluginSource).toContain("hideawayProductsValidation");
  });

  it("keeps guest carts and matches lines by product, variant, mode, and campaign", () => {
    expect(pluginSource).toContain("allowGuestCarts: true");
    expect(pluginSource).toContain("cartsCollectionOverride");
    expect(pluginSource).toContain("lostCartItemMatcher");
  });

  it("registers PortOne as the payment adapter and keeps Stripe out", () => {
    expect(pluginSource).toContain("portoneAdapter");
    expect(pluginSource).toContain("paymentMethods");
    expect(pluginSource).not.toContain("stripeAdapter");
  });

  it("overrides orders and transactions with LOSTINSEOUL lifecycle fields", () => {
    expect(pluginSource).toContain("ordersCollectionOverride");
    expect(pluginSource).toContain("transactionsCollectionOverride");
  });
});

describe("generated ecommerce collections", () => {
  it("registers plugin catalog, cart, order, and address collections", () => {
    const types = readFileSync(
      new URL("../../../payload-types.ts", import.meta.url),
      "utf8"
    );
    for (const slug of [
      "products: Product",
      "variants: Variant",
      "variantTypes: VariantType",
      "variantOptions: VariantOption",
      "carts: Cart",
      "orders: Order",
      "transactions: Transaction",
      "addresses: Address"
    ]) {
      expect(types).toContain(slug);
    }
    expect(types).not.toMatch(/^\s+inventory\?:/m);
    expect(types).toContain("name: string;");
    expect(types).toContain("option_key: string;");
    expect(types).toContain(
      "mode: 'standard_purchase' | 'request_to_order' | 'private_order'"
    );
    expect(types).toContain("campaign?: string | null;");
    expect(types).toContain("paymentMethod?: 'portone' | null;");
    expect(types).toContain("paymentId?: string | null;");
    expect(types).toContain("order_ref");
    expect(types).toContain("lifecycle_status");
    expect(types).not.toContain("'commerce-products'");
    expect(types).not.toContain("'commerce-orders'");
  });
});

