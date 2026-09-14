import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import { buildCheckoutSnapshot, type CheckoutCart } from "./checkout-snapshot";

function fixture() {
  const product = {
    id: "p1",
    name: "Object",
    slug: "object",
    active: true,
    _status: "published",
    standard_enabled: true,
    enableVariants: true,
    min_order_quantity: 1,
    max_order_quantity: 3
  };
  const variant = {
    id: "v1",
    product: "p1",
    active: true,
    _status: "published",
    sku: "SKU-1",
    label: "Small",
    options: [{ id: "option-1", label: "Small", value: "s" }],
    priceInKRW: 1200,
    priceInKRWEnabled: true
  };
  const cart: CheckoutCart = {
    id: "c1",
    currency: "KRW",
    subtotal: 1200,
    items: [
      {
        product: "p1",
        variant: "v1",
        quantity: 1,
        product_name: "FORGED",
        sku: "FORGED"
      }
    ]
  };
  const find = vi.fn(async ({ collection }: { collection: string }) => ({
    docs: collection === "products" ? [product] : [variant]
  }));
  const req = { payload: { find } } as unknown as PayloadRequest;
  return { product, variant, cart, find, req };
}

describe("checkout snapshots", () => {
  it("identifies this goods-only checkout as physical independently of client hints", async () => {
    const f = fixture();
    const { snapshot } = await buildCheckoutSnapshot({
      ...f, currency: "KRW", cart: { ...f.cart, fulfillmentKind: "digital" } as CheckoutCart
    });
    expect(snapshot).toMatchObject({ fulfillmentKind: "physical" });
  });
  it("rejects a stale selected variant after variants are disabled", async () => {
    const f = fixture();
    f.product.enableVariants = false;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("variants-disabled");
  });
  it("preserves a bounded delivery note in the purchase snapshot", async () => {
    const f = fixture();
    const { snapshot } = await buildCheckoutSnapshot({
      ...f,
      currency: "KRW",
      deliveryNote: "  Ring once  "
    });
    expect(snapshot.deliveryNote).toBe("Ring once");
    await expect(
      buildCheckoutSnapshot({
        ...f,
        currency: "KRW",
        deliveryNote: "x".repeat(2001)
      })
    ).rejects.toThrow("invalid-delivery-note");
  });
  it("captures catalog names/options and recipient data independently of later edits", async () => {
    const f = fixture();
    const address = {
      firstName: "Customer",
      city: "Seoul",
      arbitraryPrivilege: true
    };
    const { snapshot } = await buildCheckoutSnapshot({
      ...f,
      currency: "KRW",
      shippingAddress: address
    });
    f.product.name = "Renamed";
    f.variant.options[0]!.label = "Changed";
    address.city = "Busan";
    expect(snapshot.items[0]).toMatchObject({
      product_name: "Object",
      sku: "SKU-1",
      options: [{ label: "Small" }]
    });
    expect(snapshot.shippingAddress).toEqual({
      firstName: "Customer",
      city: "Seoul"
    });
    expect(snapshot).toMatchObject({
      shippingAmount: null,
      taxAmount: null,
      acceptedTerms: null
    });
    expect(f.find).toHaveBeenCalledTimes(2);
  });
  it("aggregates quantity limits across duplicate product lines", async () => {
    const f = fixture();
    f.cart.items = [f.cart.items![0]!, { ...f.cart.items![0]!, quantity: 3 }];
    f.cart.subtotal = 4800;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("quantity-above-max");
  });
  it.each(["request_to_order", "private_order", "unknown"])(
    "rejects unsupported mode %s",
    async (mode) => {
      const f = fixture();
      f.cart.items![0]!.mode = mode;
      await expect(
        buildCheckoutSnapshot({ ...f, currency: "KRW" })
      ).rejects.toThrow("unsupported-purchase-mode");
    }
  );
  it.each([0, -1, Infinity, 1.1, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid price %s",
    async (price) => {
      const f = fixture();
      f.variant.priceInKRW = price;
      await expect(
        buildCheckoutSnapshot({ ...f, currency: "KRW" })
      ).rejects.toThrow();
    }
  );
  it("rejects disabled currency prices and line snapshots that disagree with the catalog", async () => {
    const f = fixture();
    f.variant.priceInKRWEnabled = false;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("currency-price-disabled");
    f.variant.priceInKRWEnabled = true;
    f.cart.items![0]!.unit_amount = 1;
    await expect(
      buildCheckoutSnapshot({ ...f, currency: "KRW" })
    ).rejects.toThrow("cart-total-changed");
  });
});
